import type { RoutineEngineState } from "@leviathan/shared";
import type { Logger } from "./logger";
import type { EventSink, FileStore } from "./ports";

export const ROUTINES_FILE = "routines.json";

const SCOPE = "routines";

/**
 * Runs the routines (glossary: Routine). „Beenden“ pauses them all; the next
 * start resumes them. Closing the window does not touch them.
 */
export class RoutineEngine {
  private current: RoutineEngineState = "paused";

  constructor(
    private readonly files: FileStore,
    private readonly events: EventSink,
    private readonly logger: Logger,
  ) {}

  state(): RoutineEngineState {
    return this.current;
  }

  async start(): Promise<void> {
    if (await this.readPausedByQuit()) {
      this.current = "running";
      await this.writePausedByQuit(false);
      this.events.send({ type: "routines-changed", state: "running" });
      this.logger.info(SCOPE, "Routinen fortgesetzt");
      return;
    }
    this.current = "running";
    this.logger.info(SCOPE, "Routinen gestartet");
  }

  async pauseAll(): Promise<void> {
    this.current = "paused";
    await this.writePausedByQuit(true);
    this.events.send({ type: "routines-changed", state: "paused" });
    this.logger.info(SCOPE, "Routinen pausiert");
  }

  private async readPausedByQuit(): Promise<boolean> {
    try {
      const text = await this.files.read(ROUTINES_FILE);
      if (text === undefined) return false;
      const parsed: unknown = JSON.parse(text);
      return (
        typeof parsed === "object" &&
        parsed !== null &&
        (parsed as { pausedByQuit?: unknown }).pausedByQuit === true
      );
    } catch {
      this.logger.warn(SCOPE, "Zustandsdatei der Routinen nicht lesbar");
      return false;
    }
  }

  private async writePausedByQuit(pausedByQuit: boolean): Promise<void> {
    try {
      await this.files.write(ROUTINES_FILE, JSON.stringify({ pausedByQuit }));
    } catch (error) {
      this.logger.error(SCOPE, "Zustandsdatei der Routinen nicht schreibbar", error);
    }
  }
}
