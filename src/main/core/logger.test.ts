import { describe, expect, it } from "vitest";
import { LOG_FILE, MAX_LOG_BYTES, OLD_LOG_FILE, createLogger } from "./logger";
import { MemoryFileStore } from "./test-fakes";

const clock = () => new Date("2026-11-14T10:00:00.000Z");

function lines(files: MemoryFileStore, name = LOG_FILE): Record<string, unknown>[] {
  return (files.files.get(name) ?? "")
    .split("\n")
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}

describe("createLogger", () => {
  it("writes one JSON object per line with time, level, scope and message", async () => {
    const files = new MemoryFileStore();
    const logger = createLogger(files, clock);
    logger.info("core", "Kern gestartet");
    logger.warn("ipc", "abgelehnt", { channel: "settings:get" });
    await logger.flush();

    expect(lines(files)).toEqual([
      { time: "2026-11-14T10:00:00.000Z", level: "info", scope: "core", message: "Kern gestartet" },
      {
        time: "2026-11-14T10:00:00.000Z",
        level: "warn",
        scope: "ipc",
        message: "abgelehnt",
        data: { channel: "settings:get" },
      },
    ]);
  });

  it("serializes errors with name, message and stack", async () => {
    const files = new MemoryFileStore();
    const logger = createLogger(files, clock);
    logger.error("main", "Fehler", new TypeError("kaputt"));
    await logger.flush();

    const data = lines(files)[0]?.["data"] as Record<string, unknown>;
    expect(data["name"]).toBe("TypeError");
    expect(data["message"]).toBe("kaputt");
    expect(typeof data["stack"]).toBe("string");
  });

  it("redacts fields named like secrets", async () => {
    const files = new MemoryFileStore();
    const logger = createLogger(files, clock);
    logger.info("x", "y", {
      token: "a",
      apiKey: "b",
      nested: { clientSecret: "c", password: "d", Authorization: "Bearer e" },
      name: "githubToken",
    });
    await logger.flush();

    expect(lines(files)[0]?.["data"]).toEqual({
      token: "[redacted]",
      apiKey: "[redacted]",
      nested: { clientSecret: "[redacted]", password: "[redacted]", Authorization: "[redacted]" },
      name: "githubToken",
    });
  });

  it("redacts registered secrets in message, data and stack", async () => {
    const files = new MemoryFileStore();
    const logger = createLogger(files, clock);
    logger.registerSecret("sk-geheim");
    const error = new Error("failed with sk-geheim");
    logger.warn("x", "value sk-geheim here", { text: "a sk-geheim b", list: ["sk-geheim"], error });
    await logger.flush();

    const raw = files.files.get(LOG_FILE) ?? "";
    expect(raw).not.toContain("sk-geheim");
    expect(raw).toContain("[redacted]");
    expect(lines(files)[0]?.["message"]).toBe("value [redacted] here");
  });

  it("rotates the log file above 5 MB", async () => {
    const files = new MemoryFileStore();
    files.files.set(LOG_FILE, "x".repeat(MAX_LOG_BYTES - 10));
    const logger = createLogger(files, clock);
    logger.info("core", "neue Zeile");
    await logger.flush();

    expect(files.files.get(OLD_LOG_FILE)).toHaveLength(MAX_LOG_BYTES - 10);
    expect(lines(files)).toHaveLength(1);
  });

  it("never throws when writing fails", async () => {
    const files = new MemoryFileStore();
    files.failWrites = true;
    const logger = createLogger(files, clock);
    expect(() => logger.error("x", "y")).not.toThrow();
    await expect(logger.flush()).resolves.toBeUndefined();
  });
});
