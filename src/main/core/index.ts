import { BoardComputerService } from "./board-computer";
import { CacheService } from "./cache";
import { GitHubService } from "./github";
import { createLogger, type Logger } from "./logger";
import type { CorePorts } from "./ports";
import { RequestQueue } from "./request-queue";
import { RoutineEngine } from "./routines";
import { SecretStore } from "./secrets";
import { SettingsService } from "./settings";
import { SpaceTradersService } from "./spacetraders";

export type { CorePorts, EventSink, FileStore, SecretCipher } from "./ports";
export type { Logger } from "./logger";
export type { RequestPriority, RequestQueue, RequestQueueMetrics } from "./request-queue";

export const SHUTDOWN_TIMEOUT_MS = 3000;

const SCOPE = "core";

export interface CoreOptions {
  clock?: () => Date;
  shutdownTimeoutMs?: number;
}

export interface Core {
  settings: SettingsService;
  secrets: SecretStore;
  routines: RoutineEngine;
  boardComputer: BoardComputerService;
  gitHub: GitHubService;
  spaceTraders: SpaceTradersService;
  requestQueue: RequestQueue;
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
  const routines = new RoutineEngine(ports.files, ports.events, logger);
  const boardComputer = new BoardComputerService(secrets);
  const gitHub = new GitHubService(secrets);
  const requestQueue = new RequestQueue({ logger });
  const spaceTraders = new SpaceTradersService(requestQueue);
  const cache = new CacheService();
  const timeoutMs = options.shutdownTimeoutMs ?? SHUTDOWN_TIMEOUT_MS;

  async function stopAll(): Promise<void> {
    await routines.pauseAll();
    requestQueue.stop();
    cache.stop();
    logger.info(SCOPE, "Kern beendet");
    await logger.flush();
  }

  return {
    settings,
    secrets,
    routines,
    boardComputer,
    gitHub,
    spaceTraders,
    requestQueue,
    cache,
    logger,
    async start() {
      logger.info(SCOPE, "Kern startet");
      await secrets.load();
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
