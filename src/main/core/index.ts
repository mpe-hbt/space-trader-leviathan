import { AgentService } from "./agents";
import { BoardComputerService } from "./board-computer";
import { CacheService } from "./cache";
import { GitHubService } from "./github";
import { createLogger, type Logger } from "./logger";
import type { CorePorts } from "./ports";
import { RoutineEngine } from "./routines";
import { SecretStore } from "./secrets";
import { SettingsService } from "./settings";
import { SpaceTradersService } from "./spacetraders";

export type { CorePorts, EventSink, FileStore, SecretCipher } from "./ports";
export type { Logger } from "./logger";

export const SHUTDOWN_TIMEOUT_MS = 3000;

const SCOPE = "core";

export interface CoreOptions {
  clock?: () => Date;
  shutdownTimeoutMs?: number;
  /** fetch for all SpaceTraders calls of the core; the Request-Queue (#6) hooks in here. */
  fetch?: typeof fetch;
}

export interface Core {
  settings: SettingsService;
  secrets: SecretStore;
  agents: AgentService;
  routines: RoutineEngine;
  boardComputer: BoardComputerService;
  gitHub: GitHubService;
  spaceTraders: SpaceTradersService;
  cache: CacheService;
  logger: Logger;
  start(): Promise<void>;
  /** Pauses the routines and stops the services; gives up after the timeout. */
  shutdown(): Promise<void>;
}

export function createCore(ports: CorePorts, options: CoreOptions = {}): Core {
  const logger = createLogger(ports.files, options.clock);
  const secrets = new SecretStore(ports.cipher, ports.files, logger);
  const settings = new SettingsService(secrets, ports.events, logger);
  const agents = new AgentService(
    secrets,
    ports.cipher,
    ports.files,
    ports.events,
    logger,
    options.fetch,
  );
  const routines = new RoutineEngine(ports.files, ports.events, logger);
  const boardComputer = new BoardComputerService(secrets);
  const gitHub = new GitHubService(secrets);
  const spaceTraders = new SpaceTradersService();
  const cache = new CacheService();
  const timeoutMs = options.shutdownTimeoutMs ?? SHUTDOWN_TIMEOUT_MS;

  async function stopAll(): Promise<void> {
    await routines.pauseAll();
    cache.stop();
    logger.info(SCOPE, "Kern beendet");
    await logger.flush();
  }

  return {
    settings,
    secrets,
    agents,
    routines,
    boardComputer,
    gitHub,
    spaceTraders,
    cache,
    logger,
    async start() {
      logger.info(SCOPE, "Kern startet");
      await secrets.load();
      await agents.load();
      const active = agents.status().active;
      if (active !== null) {
        void agents.check(active).catch((error: unknown) => {
          logger.error(SCOPE, "Prüfung des aktiven Agents fehlgeschlagen", error);
        });
      }
      cache.start();
      await routines.start();
      logger.info(SCOPE, "Kern gestartet", {
        encryptionAvailable: secrets.status().encryptionAvailable,
        boardComputerAvailable: boardComputer.isAvailable(),
        gitHubAvailable: gitHub.isAvailable(),
      });
    },
    async shutdown() {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const timeout = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      });
      try {
        const result = await Promise.race([stopAll().then(() => "done" as const), timeout]);
        if (result === "timeout") {
          logger.warn(SCOPE, "Herunterfahren hat das Zeitlimit überschritten");
        }
      } catch (error) {
        logger.error(SCOPE, "Fehler beim Herunterfahren", error);
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
