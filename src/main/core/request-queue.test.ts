import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Logger } from "./logger";
import {
  BACKOFF_502_MS,
  BURST_WINDOW_MS,
  DEFAULT_BURST,
  DEFAULT_RATE_PER_SECOND,
  MAX_ATTEMPTS_429,
  REQUEST_PRIORITIES,
  RequestQueue,
  STOPPED_MESSAGE,
  type RequestPriority,
} from "./request-queue";

const BASE = "https://api.example.test/v2";

function fakeLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn<Logger["warn"]>(),
    error: vi.fn(),
    registerSecret: vi.fn(),
    flush: vi.fn(async () => {}),
  } satisfies Logger;
}

interface Call {
  path: string;
  at: number;
  body: string;
}

/** Simulates the SpaceTraders limiter: 2/s plus a burst of 30 per 60 s. */
function fakeServer(rate = DEFAULT_RATE_PER_SECOND, burst = DEFAULT_BURST) {
  let tokens = rate;
  let lastRefill = Date.now();
  let burstTokens = burst;
  let resetAt = Date.now() + BURST_WINDOW_MS;
  const calls: Call[] = [];
  let rateLimited = 0;

  const transport: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    const now = Date.now();
    calls.push({ path: new URL(request.url).pathname, at: now, body: "" });
    tokens = Math.min(rate, tokens + ((now - lastRefill) * rate) / 1000);
    lastRefill = now;
    while (now >= resetAt) {
      burstTokens = burst;
      resetAt += BURST_WINDOW_MS;
    }
    let ok = true;
    if (tokens >= 1) tokens -= 1;
    else if (burstTokens >= 1) burstTokens -= 1;
    else ok = false;
    const headers = {
      "x-ratelimit-type": "IP-based",
      "x-ratelimit-limit-per-second": String(rate),
      "x-ratelimit-limit-burst": String(burst),
      "x-ratelimit-remaining": String(burstTokens),
      "x-ratelimit-reset": new Date(resetAt).toISOString(),
    };
    if (!ok) {
      rateLimited += 1;
      return new Response("{}", { status: 429, headers: { ...headers, "retry-after": "1" } });
    }
    return new Response("{}", { status: 200, headers });
  };
  return { transport, calls, rateLimited: () => rateLimited };
}

/** Transport that answers with the given statuses in order (the last one repeats). */
function statusTransport(statuses: number[], headers: Record<string, string> = {}) {
  const calls: Call[] = [];
  const transport: typeof fetch = async (input, init) => {
    const request = new Request(input, init);
    calls.push({ path: new URL(request.url).pathname, at: Date.now(), body: await request.text() });
    const status = statuses[Math.min(calls.length - 1, statuses.length - 1)] ?? 200;
    return new Response(status === 204 ? null : "{}", { status, headers });
  };
  return { transport, calls };
}

function track(promise: Promise<Response>) {
  const state: { response?: Response; error?: unknown } = {};
  promise.then(
    (response) => (state.response = response),
    (error: unknown) => (state.error = error),
  );
  return state;
}

/** Uses up the 2 per-second tokens and the burst of 30. */
function exhaust(queue: RequestQueue) {
  for (let i = 0; i < DEFAULT_RATE_PER_SECOND + DEFAULT_BURST; i += 1) {
    track(queue.fetch("background", `${BASE}/warmup`));
  }
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-14T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RequestQueue", () => {
  it("answers 200 concurrent requests without a 429 for the caller", async () => {
    const server = fakeServer();
    const queue = new RequestQueue({ transport: server.transport });
    const results = Array.from({ length: 200 }, (_, i) =>
      track(queue.fetch("routine", `${BASE}/systems/${i}`)),
    );
    await vi.advanceTimersByTimeAsync(180_000);
    expect(results.every((result) => result.response?.status === 200)).toBe(true);
    expect(server.calls.filter((call) => call.path.startsWith("/v2/systems"))).toHaveLength(200);
    expect(server.rateLimited()).toBe(0);
    expect(queue.metrics().queueLength).toBe(0);
  });

  it("survives a stricter server limit by adapting and retrying", async () => {
    const server = fakeServer(1, 5);
    const queue = new RequestQueue({ transport: server.transport });
    const results = Array.from({ length: 50 }, () => track(queue.fetch("routine", `${BASE}/x`)));
    await vi.advanceTimersByTimeAsync(300_000);
    expect(results.every((result) => result.response?.status === 200)).toBe(true);
  });

  it("sends a user action within one second behind 200 waiting routine requests", async () => {
    const server = fakeServer();
    const queue = new RequestQueue({ transport: server.transport });
    for (let i = 0; i < 200; i += 1) track(queue.fetch("routine", `${BASE}/routine/${i}`));
    await vi.advanceTimersByTimeAsync(5_250);
    expect(queue.metrics().queueLengthByPriority.routine).toBeGreaterThan(150);

    const enqueuedAt = Date.now();
    const user = track(queue.fetch("user", `${BASE}/my/ships/S-1/navigate`));
    await vi.advanceTimersByTimeAsync(1000);
    const call = server.calls.find((entry) => entry.path === "/v2/my/ships/S-1/navigate");
    expect(call).toBeDefined();
    expect(call!.at - enqueuedAt).toBeLessThanOrEqual(1000);
    expect(user.response?.status).toBe(200);
    queue.stop();
  });

  it("dispatches the four priority levels in order, FIFO within a level", async () => {
    const { transport, calls } = statusTransport([200]);
    const queue = new RequestQueue({ transport });
    exhaust(queue);
    const order: RequestPriority[] = ["background", "routine", "boardComputer", "user"];
    for (const priority of order) {
      track(queue.fetch(priority, `${BASE}/${priority}/1`));
      track(queue.fetch(priority, `${BASE}/${priority}/2`));
    }
    await vi.advanceTimersByTimeAsync(10_000);
    const sent = calls.map((call) => call.path).filter((path) => !path.endsWith("warmup"));
    expect(sent).toEqual(
      REQUEST_PRIORITIES.flatMap((priority) => [`/v2/${priority}/1`, `/v2/${priority}/2`]),
    );
  });

  it("sends at the new pace when the rate-limit headers change the limits", async () => {
    const headers = {
      "x-ratelimit-limit-per-second": "1",
      "x-ratelimit-limit-burst": "1",
      "x-ratelimit-remaining": "0",
    };
    const { transport, calls } = statusTransport([200], headers);
    const queue = new RequestQueue({ transport });
    await queue.fetch("routine", `${BASE}/first`);
    for (let i = 0; i < 5; i += 1) track(queue.fetch("routine", `${BASE}/next`));
    await vi.advanceTimersByTimeAsync(10_000);
    const start = calls[0]!.at;
    expect(calls.map((call) => call.at - start)).toEqual([0, 0, 1000, 2000, 3000, 4000]);
  });

  it("ignores missing, zero and non-numeric limits", async () => {
    const headers = {
      "x-ratelimit-limit-per-second": "abc",
      "x-ratelimit-limit-burst": "0",
    };
    const { transport, calls } = statusTransport([200], headers);
    const queue = new RequestQueue({ transport });
    for (let i = 0; i < 40; i += 1) track(queue.fetch("routine", `${BASE}/x`));
    await vi.advanceTimersByTimeAsync(0);
    expect(calls).toHaveLength(DEFAULT_RATE_PER_SECOND + DEFAULT_BURST);
    queue.stop();
  });

  it("pauses the whole queue on a 429 with rate-limit headers", async () => {
    const logger = fakeLogger();
    const responses = [429];
    const calls: Call[] = [];
    const transport: typeof fetch = async (input, init) => {
      const request = new Request(input, init);
      calls.push({ path: new URL(request.url).pathname, at: Date.now(), body: "" });
      const status = responses.shift() ?? 200;
      const headers: Record<string, string> =
        status === 429 ? { "retry-after": "3", "x-ratelimit-type": "IP-based" } : {};
      return new Response("{}", { status, headers });
    };
    const queue = new RequestQueue({ transport, logger });
    const first = track(
      queue.fetch("user", `${BASE}/my/agent`, { headers: { Authorization: "Bearer geheim" } }),
    );
    await vi.advanceTimersByTimeAsync(0);
    const second = track(queue.fetch("user", `${BASE}/other`));
    await vi.advanceTimersByTimeAsync(2_999);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls.map((call) => call.path)).toEqual(["/v2/my/agent", "/v2/my/agent", "/v2/other"]);
    expect(first.response?.status).toBe(200);
    expect(second.response?.status).toBe(200);
    expect(queue.metrics().rateLimitedCount).toBe(1);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith("request-queue", expect.any(String), {
      method: "GET",
      path: "/v2/my/agent",
      status: 429,
    });
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("geheim");
  });

  it("retries a 429 without rate-limit headers with backoff for that request only", async () => {
    const { transport, calls } = statusTransport([429, 429, 200]);
    const queue = new RequestQueue({ transport });
    const result = track(queue.fetch("routine", `${BASE}/x`));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls.map((call) => call.at - calls[0]!.at)).toEqual([0, 1000, 3000]);
    expect(result.response?.status).toBe(200);
    expect(queue.metrics().rateLimitedCount).toBe(2);
  });

  it("hands the last 429 to the caller after the maximum of attempts", async () => {
    const { transport, calls } = statusTransport([429]);
    const queue = new RequestQueue({ transport });
    const result = track(queue.fetch("routine", `${BASE}/x`));
    await vi.advanceTimersByTimeAsync(600_000);
    expect(calls).toHaveLength(MAX_ATTEMPTS_429);
    expect(result.response?.status).toBe(429);
  });

  it.each([500, 503])("retries %i with backoff and then returns it", async (status) => {
    const { transport, calls } = statusTransport([status]);
    const queue = new RequestQueue({ transport });
    const result = track(queue.fetch("routine", `${BASE}/x`));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls.map((call) => call.at - calls[0]!.at)).toEqual([0, 1000, 3000, 7000, 15000]);
    expect(result.response?.status).toBe(status);
  });

  it("keeps the body for retries", async () => {
    const { transport, calls } = statusTransport([500, 200]);
    const queue = new RequestQueue({ transport });
    const response = queue.fetch("user", `${BASE}/my/ships`, {
      method: "POST",
      body: JSON.stringify({ shipType: "SHIP_PROBE" }),
    });
    await vi.advanceTimersByTimeAsync(2_000);
    expect((await response).status).toBe(200);
    expect(calls.map((call) => call.body)).toEqual([
      '{"shipType":"SHIP_PROBE"}',
      '{"shipType":"SHIP_PROBE"}',
    ]);
  });

  it("waits the long pause before retrying a 502", async () => {
    const { transport, calls } = statusTransport([502]);
    const queue = new RequestQueue({ transport });
    const result = track(queue.fetch("routine", `${BASE}/x`));
    await vi.advanceTimersByTimeAsync(BACKOFF_502_MS - 1);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(BACKOFF_502_MS * 3);
    expect(calls.map((call) => call.at - calls[0]!.at)).toEqual([
      0,
      BACKOFF_502_MS,
      2 * BACKOFF_502_MS,
    ]);
    expect(result.response?.status).toBe(502);
  });

  it.each([400, 404, 422])("returns %i on the first attempt", async (status) => {
    const { transport, calls } = statusTransport([status]);
    const queue = new RequestQueue({ transport });
    const response = await queue.fetch("user", `${BASE}/x`);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(response.status).toBe(status);
    expect(calls).toHaveLength(1);
  });

  it("passes a network error to the caller without retrying", async () => {
    const error = new TypeError("fetch failed");
    const transport = vi.fn<typeof fetch>(async () => {
      throw error;
    });
    const queue = new RequestQueue({ transport });
    await expect(queue.fetch("user", `${BASE}/x`)).rejects.toBe(error);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("reports queue length, wait times and 429 count", async () => {
    const { transport } = statusTransport([200]);
    const queue = new RequestQueue({ transport });
    expect(queue.metrics()).toEqual({
      queueLength: 0,
      queueLengthByPriority: { user: 0, boardComputer: 0, routine: 0, background: 0 },
      averageWaitMs: 0,
      maxWaitMs: 0,
      rateLimitedCount: 0,
    });
    exhaust(queue);
    track(queue.fetch("routine", `${BASE}/a`));
    track(queue.fetch("routine", `${BASE}/b`));
    track(queue.fetch("boardComputer", `${BASE}/c`));
    expect(queue.metrics()).toMatchObject({
      queueLength: 3,
      queueLengthByPriority: { user: 0, boardComputer: 1, routine: 2, background: 0 },
    });
    await vi.advanceTimersByTimeAsync(2_000);
    const samples = [...Array<number>(32).fill(0), 500, 1000, 1500];
    expect(queue.metrics()).toEqual({
      queueLength: 0,
      queueLengthByPriority: { user: 0, boardComputer: 0, routine: 0, background: 0 },
      averageWaitMs: samples.reduce((sum, value) => sum + value, 0) / samples.length,
      maxWaitMs: 1500,
      rateLimitedCount: 0,
    });
  });

  it("rejects waiting and retrying requests on stop and refuses new ones", async () => {
    const { transport } = statusTransport([500]);
    const queue = new RequestQueue({ transport });
    const retrying = track(queue.fetch("user", `${BASE}/retry`));
    await vi.advanceTimersByTimeAsync(0);
    exhaust(queue);
    const waiting = track(queue.fetch("routine", `${BASE}/waiting`));
    queue.stop();
    await vi.advanceTimersByTimeAsync(0);
    expect((retrying.error as Error).message).toBe(STOPPED_MESSAGE);
    expect((waiting.error as Error).message).toBe(STOPPED_MESSAGE);
    await expect(queue.fetch("user", `${BASE}/later`)).rejects.toThrow(STOPPED_MESSAGE);
    expect(vi.getTimerCount()).toBe(0);
  });
});
