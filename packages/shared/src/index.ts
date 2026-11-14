export const APP_NAME = "space-trader-leviathan";

export const IpcChannel = {
  GetAppInfo: "app:get-info",
  GetSettings: "settings:get",
  SetSecret: "settings:set-secret",
  ClearSecret: "settings:clear-secret",
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

export type CoreEvent =
  | { type: "settings-changed"; settings: SettingsStatus }
  | { type: "routines-changed"; state: RoutineEngineState };

export interface LeviathanApi {
  getAppInfo(): Promise<AppInfo>;
  getSettings(): Promise<SettingsStatus>;
  setSecret(name: SecretName, value: string): Promise<SaveResult>;
  clearSecret(name: SecretName): Promise<SaveResult>;
  onCoreEvent(listener: (event: CoreEvent) => void): () => void;
}

/** Shown in the settings and returned by the core when the OS key store is missing. */
export const ENCRYPTION_UNAVAILABLE_MESSAGE =
  "Der Schlüsselspeicher des Betriebssystems ist nicht verfügbar. Schlüssel können nicht gespeichert werden.";

/** Returned by the core for any invalid input from the renderer. */
export const INVALID_INPUT_MESSAGE = "Ungültige Eingabe.";
