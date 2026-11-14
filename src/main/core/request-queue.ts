import type { Logger } from "./logger";

/** Vorrangstufen der Request-Queue, höchste zuerst. */
export type RequestPriority = "user" | "boardComputer" | "routine" | "background";

export const REQUEST_PRIORITIES: readonly RequestPriority[] = [
  "user",
  "boardComputer",
  "routine",
  "background",
];

export const DEFAULT_RATE_PER_SECOND = 2;
export const DEFAULT_BURST = 30;
export const BURST_WINDOW_MS = 60_000;
export const MAX_ATTEMPTS_429 = 10;
export const MAX_ATTEMPTS_5XX = 5;
export const MAX_ATTEMPTS_502 = 3;
export const BACKOFF_502_MS = 120_000;
export const MAX_BACKOFF_MS = 60_000;
export const WAIT_SAMPLES = 100;
export const STOPPED_MESSAGE = "Request-Queue beendet";

const SCOPE = "request-queue";
const BASE_BACKOFF_MS = 1000;
const DEFAULT_RETRY_AFTER_MS = 1000;
const RATE_LIMIT_HEADER_PREFIX = "x-ratelimit-";

/** Like `RequestInfo | URL`; the DOM types are not part of the main-process build. */
type RequestInput = Parameters<typeof fetch>[0];

export interface RequestQueueOptions {
  transport?: typeof fetch;
  logger?: Logger;
  now?: () => number;
}

export interface RequestQueueMetrics {
  /** Wartende Anfragen insgesamt. */
  queueLength: number;
  queueLengthByPriority: Record<RequestPriority, number>;
  /** Zeit vom Einreihen bis zum ersten Senden, über die letzten 100 gesendeten Anfragen. */
  averageWaitMs: number;
  maxWaitMs: number;
  /** Alle seit dem Start empfangenen 429-Antworten, auch wiederholte. */
  rateLimitedCount: number;
}

interface Entry {
  priority: RequestPriority;
  request: Request;
  enqueuedAt: number;
  dispatched: boolean;
  attempts429: number;
  attempts5xx: number;
  attempts502: number;
  resolve(response: Response): void;
  reject(error: unknown): void;
}

function emptyQueues(): Record<RequestPriority, Entry[]> {
  return { user: [], boardComputer: [], routine: [], background: [] };
}

function positiveNumber(value: string | null): number | undefined {
  if (value === null || value.trim() === "") return undefined;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
}

function hasRateLimitHeaders(headers: Headers): boolean {
  for (const name of headers.keys()) {
    if (name.toLowerCase().startsWith(RATE_LIMIT_HEADER_PREFIX)) return true;
  }
  return false;
}

/**
 * Zentrale Request-Queue: Jede Anfrage an die SpaceTraders-API läuft hier durch.
 * Sie hält das Rate-Limit per Token-Bucket ein, wiederholt 429 und 5xx selbst und
 * sendet nach Vorrang (user > boardComputer > routine > background).
 */
export class RequestQueue {
  private readonly transport: typeof fetch;
  private readonly logger: Logger | undefined;
  private readonly now: () => number;

  private readonly queues = emptyQueues();
  private readonly retrying = new Map<Entry, ReturnType<typeof setTimeout>>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private timerAt = Infinity;
  private stopped = false;

  private ratePerSecond = DEFAULT_RATE_PER_SECOND;
  private secondTokens = DEFAULT_RATE_PER_SECOND;
  private lastRefill: number;
  private burstCapacity = DEFAULT_BURST;
  private burstTokens = DEFAULT_BURST;
  private burstResetAt: number;
  private pausedUntil = 0;

  private readonly waitSamples: number[] = [];
  private rateLimitedCount = 0;

  constructor(options: RequestQueueOptions = {}) {
    this.transport = options.transport ?? ((input, init) => globalThis.fetch(input, init));
    this.logger = options.logger;
    this.now = options.now ?? Date.now;
    this.lastRefill = this.now();
    this.burstResetAt = this.lastRefill + BURST_WINDOW_MS;
  }

  /** Reiht eine Anfrage ein; die Antwort kommt, sobald sie gesendet und ggf. wiederholt wurde. */
  fetch(priority: RequestPriority, input: RequestInput, init?: RequestInit): Promise<Response> {
    if (this.stopped) return Promise.reject(new Error(STOPPED_MESSAGE));
    let request: Request;
    try {
      request = new Request(input, init);
    } catch (error) {
      return Promise.reject(error);
    }
    return new Promise<Response>((resolve, reject) => {
      this.queues[priority].push({
        priority,
        request,
        enqueuedAt: this.now(),
        dispatched: false,
        attempts429: 0,
        attempts5xx: 0,
        attempts502: 0,
        resolve,
        reject,
      });
      this.pump();
    });
  }

  /** Eine fetch-Funktion, die mit der gegebenen Vorrangstufe über die Queue sendet. */
  fetchFor(priority: RequestPriority): typeof fetch {
    return (input, init) => this.fetch(priority, input, init);
  }

  metrics(): RequestQueueMetrics {
    const queueLengthByPriority = {} as Record<RequestPriority, number>;
    let queueLength = 0;
    for (const priority of REQUEST_PRIORITIES) {
      queueLengthByPriority[priority] = this.queues[priority].length;
      queueLength += this.queues[priority].length;
    }
    const samples = this.waitSamples;
    const total = samples.reduce((sum, value) => sum + value, 0);
    return {
      queueLength,
      queueLengthByPriority,
      averageWaitMs: samples.length > 0 ? total / samples.length : 0,
      maxWaitMs: samples.length > 0 ? Math.max(...samples) : 0,
      rateLimitedCount: this.rateLimitedCount,
    };
  }

  /** Hält die Queue an und beendet alle wartenden Anfragen mit einem Fehler. */
  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    this.clearTimer();
    const waiting: Entry[] = [];
    for (const priority of REQUEST_PRIORITIES) {
      waiting.push(...this.queues[priority].splice(0));
    }
    for (const [entry, timer] of this.retrying) {
      clearTimeout(timer);
      waiting.push(entry);
    }
    this.retrying.clear();
    for (const entry of waiting) entry.reject(new Error(STOPPED_MESSAGE));
  }

  private clearTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
    this.timer = undefined;
    this.timerAt = Infinity;
  }

  private schedule(at: number): void {
    if (this.timer !== undefined && this.timerAt <= at) return;
    this.clearTimer();
    this.timerAt = at;
    this.timer = setTimeout(
      () => {
        this.timer = undefined;
        this.timerAt = Infinity;
        this.pump();
      },
      Math.max(0, at - this.now()),
    );
  }

  private refill(now: number): void {
    const elapsed = now - this.lastRefill;
    if (elapsed > 0) {
      this.secondTokens = Math.min(
        this.ratePerSecond,
        this.secondTokens + (elapsed * this.ratePerSecond) / 1000,
      );
      this.lastRefill = now;
    }
    if (now >= this.burstResetAt) {
      this.burstTokens = this.burstCapacity;
      while (this.burstResetAt <= now) this.burstResetAt += BURST_WINDOW_MS;
    }
  }

  /** Takes a token; returns the time of the next free token if none is available. */
  private takeToken(now: number): number | undefined {
    this.refill(now);
    if (this.secondTokens >= 1) {
      this.secondTokens -= 1;
      return undefined;
    }
    if (this.burstTokens >= 1) {
      this.burstTokens -= 1;
      return undefined;
    }
    const nextSecondToken = now + Math.ceil(((1 - this.secondTokens) * 1000) / this.ratePerSecond);
    return Math.min(nextSecondToken, this.burstResetAt);
  }

  private nextEntry(): Entry | undefined {
    for (const priority of REQUEST_PRIORITIES) {
      const entry = this.queues[priority].shift();
      if (entry) return entry;
    }
    return undefined;
  }

  private hasWaiting(): boolean {
    return REQUEST_PRIORITIES.some((priority) => this.queues[priority].length > 0);
  }

  private pump(): void {
    if (this.stopped) return;
    while (this.hasWaiting()) {
      const now = this.now();
      if (now < this.pausedUntil) {
        this.schedule(this.pausedUntil);
        return;
      }
      const next = this.takeToken(now);
      if (next !== undefined) {
        this.schedule(next);
        return;
      }
      const entry = this.nextEntry();
      if (entry) void this.send(entry);
    }
  }

  private async send(entry: Entry): Promise<void> {
    if (!entry.dispatched) {
      entry.dispatched = true;
      this.waitSamples.push(this.now() - entry.enqueuedAt);
      if (this.waitSamples.length > WAIT_SAMPLES) this.waitSamples.shift();
    }
    let response: Response;
    try {
      response = await this.transport(entry.request.clone());
    } catch (error) {
      entry.reject(error);
      return;
    }
    this.adapt(response.headers);
    this.handle(entry, response);
  }

  private handle(entry: Entry, response: Response): void {
    const status = response.status;
    if (status === 429) {
      this.rateLimitedCount += 1;
      entry.attempts429 += 1;
      const url = new URL(entry.request.url);
      this.logger?.warn(SCOPE, "Rate-Limit erreicht (429)", {
        method: entry.request.method,
        path: url.pathname,
        status,
      });
      if (entry.attempts429 >= MAX_ATTEMPTS_429) return this.finish(entry, response);
      if (hasRateLimitHeaders(response.headers)) {
        const retryAfter = positiveNumber(response.headers.get("retry-after"));
        const pauseMs = retryAfter !== undefined ? retryAfter * 1000 : DEFAULT_RETRY_AFTER_MS;
        this.pausedUntil = Math.max(this.pausedUntil, this.now() + pauseMs);
        this.burstTokens = 0;
        return this.requeue(entry);
      }
      return this.retryLater(entry, this.backoff(entry.attempts429));
    }
    if (status === 502) {
      entry.attempts502 += 1;
      if (entry.attempts502 >= MAX_ATTEMPTS_502) return this.finish(entry, response);
      return this.retryLater(entry, BACKOFF_502_MS);
    }
    if (status >= 500 && status <= 599) {
      entry.attempts5xx += 1;
      if (entry.attempts5xx >= MAX_ATTEMPTS_5XX) return this.finish(entry, response);
      return this.retryLater(entry, this.backoff(entry.attempts5xx));
    }
    this.finish(entry, response);
  }

  private finish(entry: Entry, response: Response): void {
    entry.resolve(response);
  }

  private backoff(attempt: number): number {
    return Math.min(BASE_BACKOFF_MS * 2 ** (attempt - 1), MAX_BACKOFF_MS);
  }

  /** Puts the entry back to the front of its priority level. */
  private requeue(entry: Entry): void {
    if (this.stopped) {
      entry.reject(new Error(STOPPED_MESSAGE));
      return;
    }
    this.queues[entry.priority].unshift(entry);
    this.pump();
  }

  private retryLater(entry: Entry, delayMs: number): void {
    if (this.stopped) {
      entry.reject(new Error(STOPPED_MESSAGE));
      return;
    }
    const timer = setTimeout(() => {
      this.retrying.delete(entry);
      this.requeue(entry);
    }, delayMs);
    this.retrying.set(entry, timer);
  }

  /** Adapts the limits to the `x-ratelimit-*` headers of a response. */
  private adapt(headers: Headers): void {
    const now = this.now();
    this.refill(now);
    const perSecond = positiveNumber(headers.get("x-ratelimit-limit-per-second"));
    if (perSecond !== undefined) {
      this.ratePerSecond = perSecond;
      this.secondTokens = Math.min(this.secondTokens, perSecond);
    }
    const burst = positiveNumber(headers.get("x-ratelimit-limit-burst"));
    if (burst !== undefined) {
      this.burstCapacity = burst;
      this.burstTokens = Math.min(this.burstTokens, burst);
    }
    const remainingText = headers.get("x-ratelimit-remaining");
    const remaining = remainingText === null ? NaN : Number(remainingText);
    if (remainingText !== null && remainingText.trim() !== "" && Number.isFinite(remaining)) {
      // 0 is a meaningful value here: the burst pool is used up.
      if (remaining >= 0) this.burstTokens = Math.min(this.burstTokens, remaining);
    }
    const resetText = headers.get("x-ratelimit-reset");
    if (resetText !== null) {
      const reset = Date.parse(resetText);
      if (Number.isFinite(reset) && reset > 0) this.burstResetAt = reset;
    }
    if (perSecond !== undefined || burst !== undefined) this.pump();
  }
}
