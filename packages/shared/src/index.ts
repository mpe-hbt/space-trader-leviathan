import type { components } from "@leviathan/api-client";

export const APP_NAME = "space-trader-leviathan";

export const IpcChannel = {
  GetAppInfo: "app:get-info",
  GetSettings: "settings:get",
  SetSecret: "settings:set-secret",
  ClearSecret: "settings:clear-secret",
  GetGameState: "game-state:get",
  CoreEvent: "core:event",
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];

export interface AppInfo {
  name: string;
  version: string;
}

/** Names of the secrets the core keeps. #7 adds Agent-Token and Account-Token. */
export type SecretName = "anthropicApiKey" | "githubToken";

export const SECRET_NAMES: readonly SecretName[] = ["anthropicApiKey", "githubToken"];

export interface SettingsStatus {
  encryptionAvailable: boolean;
  secrets: Record<SecretName, { configured: boolean }>;
}

export type SaveResult = { ok: true; settings: SettingsStatus } | { ok: false; message: string };

export type RoutineEngineState = "running" | "paused";

/** Parts of the Spielstand a `game-state-changed` event can name. */
export type GameStateArea =
  | "reset"
  | "agent"
  | "ships"
  | "systems"
  | "waypoints"
  | "markets"
  | "shipyards"
  | "contracts"
  | "transactions";

/** The Spielstand of the current Server-Reset as the renderer sees it. */
export interface GameStateSnapshot {
  resetDate: string | null;
  nextReset: string | null;
  agent: components["schemas"]["Agent"] | null;
  ships: components["schemas"]["Ship"][];
  contracts: components["schemas"]["Contract"][];
}

export type CoreEvent =
  | { type: "settings-changed"; settings: SettingsStatus }
  | { type: "routines-changed"; state: RoutineEngineState }
  /** Names only the changed areas; the renderer fetches the data itself. */
  | { type: "game-state-changed"; resetDate: string; areas: GameStateArea[] };

export interface LeviathanApi {
  getAppInfo(): Promise<AppInfo>;
  getSettings(): Promise<SettingsStatus>;
  setSecret(name: SecretName, value: string): Promise<SaveResult>;
  clearSecret(name: SecretName): Promise<SaveResult>;
  getGameState(): Promise<GameStateSnapshot>;
  onCoreEvent(listener: (event: CoreEvent) => void): () => void;
}

/** Shown in the settings and returned by the core when the OS key store is missing. */
export const ENCRYPTION_UNAVAILABLE_MESSAGE =
  "Der Schlüsselspeicher des Betriebssystems ist nicht verfügbar. Schlüssel können nicht gespeichert werden.";

/** Returned by the core for any invalid input from the renderer. */
export const INVALID_INPUT_MESSAGE = "Ungültige Eingabe.";
