import type { components } from "@leviathan/api-client";

export const APP_NAME = "space-trader-leviathan";

export const IpcChannel = {
  GetAppInfo: "app:get-info",
  GetSettings: "settings:get",
  SetSecret: "settings:set-secret",
  ClearSecret: "settings:clear-secret",
  GetAgents: "agents:get",
  GetFactions: "agents:get-factions",
  RegisterAgent: "agents:register",
  ImportAgentToken: "agents:import-token",
  SelectAgent: "agents:select",
  RemoveAgent: "agents:remove",
  CheckAgents: "agents:check",
  GetGameState: "game-state:get",
  CoreEvent: "core:event",
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];

export interface AppInfo {
  name: string;
  version: string;
}

/** Names of the fixed secrets the core keeps. Agent-Tokens live in `agents.json` (#7). */
export type SecretName = "anthropicApiKey" | "githubToken" | "accountToken";

export const SECRET_NAMES: readonly SecretName[] = [
  "anthropicApiKey",
  "githubToken",
  "accountToken",
];

export interface SettingsStatus {
  encryptionAvailable: boolean;
  secrets: Record<SecretName, { configured: boolean }>;
}

export type SaveResult = { ok: true; settings: SettingsStatus } | { ok: false; message: string };

export type RoutineEngineState = "running" | "paused";

/** State of an Agent-Token as last seen by the core. */
export type AgentTokenStatus = "valid" | "expired" | "unchecked";

/** What the renderer learns about an agent; never contains a token. */
export interface AgentSummary {
  symbol: string;
  faction: string;
  headquarters: string;
  credits: number;
  status: AgentTokenStatus;
}

export interface AgentsStatus {
  encryptionAvailable: boolean;
  accountTokenConfigured: boolean;
  active: string | null;
  agents: AgentSummary[];
}

export interface FactionOption {
  symbol: string;
  name: string;
  headquarters: string;
  isRecruiting: boolean;
}

export interface RegisterAgentInput {
  symbol: string;
  faction: string;
  /** Optional; without it the stored Account-Token is used. */
  accountToken?: string;
}

export type AgentResult = { ok: true; agents: AgentsStatus } | { ok: false; message: string };

export type FactionsResult =
  { ok: true; factions: FactionOption[] } | { ok: false; message: string };

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
  | { type: "game-state-changed"; resetDate: string; areas: GameStateArea[] }
  | { type: "agents-changed"; agents: AgentsStatus };

export interface LeviathanApi {
  getAppInfo(): Promise<AppInfo>;
  getSettings(): Promise<SettingsStatus>;
  setSecret(name: SecretName, value: string): Promise<SaveResult>;
  clearSecret(name: SecretName): Promise<SaveResult>;
  getAgents(): Promise<AgentsStatus>;
  getFactions(): Promise<FactionsResult>;
  registerAgent(input: RegisterAgentInput): Promise<AgentResult>;
  importAgentToken(token: string): Promise<AgentResult>;
  selectAgent(symbol: string): Promise<AgentResult>;
  removeAgent(symbol: string): Promise<AgentResult>;
  checkAgents(symbol?: string): Promise<AgentResult>;
  getGameState(): Promise<GameStateSnapshot>;
  onCoreEvent(listener: (event: CoreEvent) => void): () => void;
}

/** Shown in the settings and returned by the core when the OS key store is missing. */
export const ENCRYPTION_UNAVAILABLE_MESSAGE =
  "Der Schlüsselspeicher des Betriebssystems ist nicht verfügbar. Schlüssel können nicht gespeichert werden.";

/** Returned by the core for any invalid input from the renderer. */
export const INVALID_INPUT_MESSAGE = "Ungültige Eingabe.";
