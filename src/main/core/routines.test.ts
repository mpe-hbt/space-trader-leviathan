import { describe, expect, it } from "vitest";
import { createLogger, LOG_FILE } from "./logger";
import { ROUTINES_FILE, RoutineEngine } from "./routines";
import { MemoryFileStore, RecordingEventSink } from "./test-fakes";

function setup(files = new MemoryFileStore()) {
  const events = new RecordingEventSink();
  const logger = createLogger(files);
  return { files, events, logger, engine: new RoutineEngine(files, events, logger) };
}

describe("RoutineEngine", () => {
  it("runs after start when the state file is missing", async () => {
    const { engine, events } = setup();
    await engine.start();
    expect(engine.state()).toBe("running");
    expect(events.events).toEqual([]);
  });

  it("runs after start when the state file is broken", async () => {
    const files = new MemoryFileStore();
    files.files.set(ROUTINES_FILE, "{kaputt");
    const { engine } = setup(files);
    await engine.start();
    expect(engine.state()).toBe("running");
  });

  it("pauses all routines and remembers it", async () => {
    const { engine, events, files } = setup();
    await engine.start();
    await engine.pauseAll();

    expect(engine.state()).toBe("paused");
    expect(JSON.parse(files.files.get(ROUTINES_FILE) ?? "")).toEqual({ pausedByQuit: true });
    expect(events.events).toEqual([{ type: "routines-changed", state: "paused" }]);
  });

  it("resumes paused routines on the next start", async () => {
    const first = setup();
    await first.engine.start();
    await first.engine.pauseAll();

    const second = setup(first.files);
    await second.engine.start();
    await second.logger.flush();

    expect(second.engine.state()).toBe("running");
    expect(JSON.parse(first.files.files.get(ROUTINES_FILE) ?? "")).toEqual({ pausedByQuit: false });
    expect(second.events.events).toEqual([{ type: "routines-changed", state: "running" }]);
    expect(first.files.files.get(LOG_FILE)).toContain("Routinen fortgesetzt");
  });
});
