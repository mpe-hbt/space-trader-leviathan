import type { FileStore } from "./ports";

export type LogLevel = "debug" | "info" | "warn" | "error";

export const LOG_FILE = "logs/leviathan.log";
export const OLD_LOG_FILE = "logs/leviathan.1.log";
export const MAX_LOG_BYTES = 5 * 1024 * 1024;

const REDACTED = "[redacted]";
const SECRET_KEY = /token|key|secret|password|authorization/i;

export interface Logger {
  debug(scope: string, message: string, data?: unknown): void;
  info(scope: string, message: string, data?: unknown): void;
  warn(scope: string, message: string, data?: unknown): void;
  error(scope: string, message: string, data?: unknown): void;
  /** Every registered value is replaced by `[redacted]` in all log lines. */
  registerSecret(value: string): void;
  /** Resolves when all pending lines are written. */
  flush(): Promise<void>;
}

export function createLogger(sink: FileStore, clock: () => Date = () => new Date()): Logger {
  const secrets = new Set<string>();
  let queue: Promise<void> = Promise.resolve();

  function redactString(text: string): string {
    let result = text;
    for (const secret of secrets) result = result.split(secret).join(REDACTED);
    return result;
  }

  function redact(value: unknown, seen: WeakSet<object>): unknown {
    if (typeof value === "string") return redactString(value);
    if (value instanceof Error) {
      return redact({ name: value.name, message: value.message, stack: value.stack }, seen);
    }
    if (value === null || typeof value !== "object") return value;
    if (seen.has(value)) return "[circular]";
    seen.add(value);
    if (Array.isArray(value)) return value.map((item) => redact(item, seen));
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      result[key] = SECRET_KEY.test(key) ? REDACTED : redact(item, seen);
    }
    return result;
  }

  async function writeLine(line: string): Promise<void> {
    try {
      const size = await sink.size(LOG_FILE);
      if (size > 0 && size + Buffer.byteLength(line) > MAX_LOG_BYTES) {
        await sink.rename(LOG_FILE, OLD_LOG_FILE);
      }
      await sink.append(LOG_FILE, line);
    } catch {
      // Logging must never break the app.
    }
  }

  function log(level: LogLevel, scope: string, message: string, data?: unknown): void {
    try {
      const entry: Record<string, unknown> = {
        time: clock().toISOString(),
        level,
        scope: redactString(scope),
        message: redactString(message),
      };
      if (data !== undefined) entry["data"] = redact(data, new WeakSet());
      const line = `${JSON.stringify(entry)}\n`;
      queue = queue.then(() => writeLine(line));
    } catch {
      // Logging must never break the app.
    }
  }

  return {
    debug: (scope, message, data) => log("debug", scope, message, data),
    info: (scope, message, data) => log("info", scope, message, data),
    warn: (scope, message, data) => log("warn", scope, message, data),
    error: (scope, message, data) => log("error", scope, message, data),
    registerSecret(value) {
      if (value.length > 0) secrets.add(value);
    },
    flush: () => queue,
  };
}
