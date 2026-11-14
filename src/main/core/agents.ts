import {
  createSpaceTradersClient,
  SpaceTradersError,
  type components,
  type SpaceTradersClient,
} from "@leviathan/api-client";
import {
  ENCRYPTION_UNAVAILABLE_MESSAGE,
  INVALID_INPUT_MESSAGE,
  type AgentResult,
  type AgentsStatus,
  type AgentSummary,
  type AgentTokenStatus,
  type FactionOption,
  type FactionsResult,
} from "@leviathan/shared";
import { parseSecretValue } from "./ipc-validation";
import type { Logger } from "./logger";
import type { EventSink, FileStore, SecretCipher } from "./ports";
import { SAVE_FAILED_MESSAGE, type SecretStore } from "./secrets";

export const AGENTS_FILE = "agents.json";

export const NO_ACCOUNT_TOKEN_MESSAGE = "Kein Account-Token hinterlegt.";
export const REGISTERED_BUT_NOT_SAVED_MESSAGE = "Agent registriert, aber Speichern fehlgeschlagen.";
export const SYMBOL_TAKEN_MESSAGE = "Dieses Rufzeichen ist vergeben oder reserviert.";
export const INVALID_ACCOUNT_TOKEN_MESSAGE = "Der Account-Token ist ungültig.";
export const INVALID_AGENT_TOKEN_MESSAGE =
  "Der Agent-Token ist ungültig oder nach einem Server-Reset abgelaufen.";
export const TOO_MANY_REQUESTS_MESSAGE = "Zu viele Anfragen an SpaceTraders. Bitte kurz warten.";
export const UNREACHABLE_MESSAGE = "SpaceTraders ist nicht erreichbar.";

const SCOPE = "agents";
const FACTIONS_PAGE_LIMIT = 20;
const SYMBOL_PATTERN = /^[A-Za-z0-9_-]{3,14}$/;
const FACTION_PATTERN = /^[A-Z_]{1,32}$/;
const TOKEN_STATUSES: readonly AgentTokenStatus[] = ["valid", "expired", "unchecked"];

export type AgentErrorContext = "register" | "import" | "check" | "factions";

interface AgentEntry extends AgentSummary {
  /** base64 ciphertext of the Agent-Token from `SecretCipher.encrypt`. */
  cipherText: string;
}

interface StoredAgent {
  symbol: string;
  faction: string;
  headquarters: string;
  credits: number;
  status: AgentTokenStatus;
  token: string;
}

type ApiAgent = components["schemas"]["Agent"];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 401 or the token error codes 4100–4108: the token is invalid or gone after a reset. */
export function isExpiredTokenError(error: unknown): boolean {
  if (!(error instanceof SpaceTradersError)) return false;
  if (error.status === 401) return true;
  return error.code !== undefined && error.code >= 4100 && error.code <= 4108;
}

/** Short German message for the renderer; never contains the API message or a token. */
export function agentErrorMessage(error: unknown, context: AgentErrorContext): string {
  if (!(error instanceof SpaceTradersError)) return UNREACHABLE_MESSAGE;
  if (error.code !== undefined && error.code >= 4109 && error.code <= 4111) {
    return SYMBOL_TAKEN_MESSAGE;
  }
  if (isExpiredTokenError(error)) {
    return context === "register" ? INVALID_ACCOUNT_TOKEN_MESSAGE : INVALID_AGENT_TOKEN_MESSAGE;
  }
  if (error.status === 429) return TOO_MANY_REQUESTS_MESSAGE;
  return `SpaceTraders hat die Anfrage abgelehnt (Code ${error.code ?? error.status}).`;
}

function parseStoredAgent(value: unknown): StoredAgent | undefined {
  if (!isRecord(value)) return undefined;
  const { symbol, faction, headquarters, credits, status, token } = value;
  if (
    typeof symbol !== "string" ||
    typeof faction !== "string" ||
    typeof headquarters !== "string" ||
    typeof credits !== "number" ||
    typeof token !== "string"
  ) {
    return undefined;
  }
  const knownStatus = TOKEN_STATUSES.find((item) => item === status) ?? "unchecked";
  return { symbol, faction, headquarters, credits, status: knownStatus, token };
}

/**
 * Keeps the agents and their Agent-Tokens in `agents.json`, each token encrypted with
 * the `SecretCipher`. Tokens never leave the core: results and events only carry
 * symbol, faction, headquarters, credits and token state.
 */
export class AgentService {
  private entries: AgentEntry[] = [];
  private active: string | null = null;
  private factionCache: FactionOption[] | undefined;

  constructor(
    private readonly secrets: SecretStore,
    private readonly cipher: SecretCipher,
    private readonly files: FileStore,
    private readonly events: EventSink,
    private readonly logger: Logger,
    private readonly fetchFn?: typeof fetch,
  ) {}

  /** Loads the file; anything missing or broken counts as no agents. */
  async load(): Promise<void> {
    this.entries = [];
    this.active = null;
    let text: string | undefined;
    try {
      text = await this.files.read(AGENTS_FILE);
    } catch (error) {
      this.logger.warn(SCOPE, "Agents-Datei nicht lesbar", error);
      return;
    }
    if (text === undefined) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.logger.warn(SCOPE, "Agents-Datei ist kein gültiges JSON");
      return;
    }
    if (!isRecord(parsed) || !Array.isArray(parsed["agents"])) {
      this.logger.warn(SCOPE, "Agents-Datei hat ein unbekanntes Format");
      return;
    }

    for (const item of parsed["agents"]) {
      const stored = parseStoredAgent(item);
      if (!stored) {
        this.logger.warn(SCOPE, "Agent-Eintrag hat ein unbekanntes Format");
        continue;
      }
      if (this.entries.some((entry) => entry.symbol === stored.symbol)) continue;
      if (this.decrypt(stored.token, stored.symbol) === undefined) continue;
      const { token, ...summary } = stored;
      this.entries.push({ ...summary, cipherText: token });
    }
    const active = parsed["active"];
    this.active = typeof active === "string" && this.find(active) !== undefined ? active : null;
  }

  status(): AgentsStatus {
    return {
      encryptionAvailable: this.cipher.isAvailable(),
      accountTokenConfigured: this.secrets.status().secrets.accountToken.configured,
      active: this.active,
      agents: this.entries.map(({ symbol, faction, headquarters, credits, status }) => ({
        symbol,
        faction,
        headquarters,
        credits,
        status,
      })),
    };
  }

  /** All factions over all pages, sorted by name; kept in memory until the app ends. */
  async factions(): Promise<FactionsResult> {
    if (this.factionCache) return { ok: true, factions: [...this.factionCache] };
    const client = this.client({});
    const factions: FactionOption[] = [];
    try {
      for (let page = 1; ; page++) {
        const result = await client.factions.getFactions({ page, limit: FACTIONS_PAGE_LIMIT });
        for (const faction of result.data) {
          factions.push({
            symbol: faction.symbol,
            name: faction.name,
            headquarters: faction.headquarters ?? "",
            isRecruiting: faction.isRecruiting,
          });
        }
        if (result.data.length === 0 || factions.length >= result.meta.total) break;
      }
    } catch (error) {
      return { ok: false, message: this.failure(error, "factions") };
    }
    factions.sort((a, b) => a.name.localeCompare(b.name));
    this.factionCache = factions;
    return { ok: true, factions: [...factions] };
  }

  async register(input: unknown): Promise<AgentResult> {
    const parsed = this.parseRegisterInput(input);
    if (!parsed) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Registrieren");
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    if (!this.cipher.isAvailable()) return { ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE };

    const accountToken = parsed.accountToken ?? this.secrets.get("accountToken");
    if (accountToken === undefined) return { ok: false, message: NO_ACCOUNT_TOKEN_MESSAGE };
    this.logger.registerSecret(accountToken);
    if (parsed.accountToken !== undefined) {
      const saved = await this.secrets.set("accountToken", parsed.accountToken);
      if (!saved.ok) {
        this.logger.warn(SCOPE, saved.message, { name: "accountToken" });
        return { ok: false, message: saved.message };
      }
      this.logger.info(SCOPE, "Schlüssel gespeichert", { name: "accountToken" });
      this.events.send({ type: "settings-changed", settings: saved.settings });
    }

    let token: string;
    let agent: ApiAgent;
    try {
      const result = await this.client({ accountToken }).global.register({
        symbol: parsed.symbol,
        faction: parsed.faction as components["schemas"]["FactionSymbol"],
      });
      token = result.data.token;
      agent = result.data.agent;
    } catch (error) {
      return { ok: false, message: this.failure(error, "register", parsed.symbol) };
    }
    this.logger.registerSecret(token);

    const entry = this.toEntry(agent, token);
    if (!entry) return { ok: false, message: REGISTERED_BUT_NOT_SAVED_MESSAGE };
    this.upsert(entry);
    this.active = entry.symbol;
    this.logger.info(SCOPE, "Agent registriert", { symbol: entry.symbol });
    const saved = await this.persistAndNotify();
    return saved
      ? { ok: true, agents: this.status() }
      : { ok: false, message: REGISTERED_BUT_NOT_SAVED_MESSAGE };
  }

  /** Takes over an existing Agent-Token after GET /my/agent confirmed it. */
  async importToken(input: unknown): Promise<AgentResult> {
    const token = parseSecretValue(input);
    if (token === undefined) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Einfügen eines Agent-Tokens");
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    if (!this.cipher.isAvailable()) return { ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE };
    this.logger.registerSecret(token);

    let agent: ApiAgent;
    try {
      agent = (await this.client({ agentToken: token }).agents.getMyAgent()).data;
    } catch (error) {
      return { ok: false, message: this.failure(error, "import") };
    }

    const entry = this.toEntry(agent, token);
    if (!entry) return { ok: false, message: SAVE_FAILED_MESSAGE };
    this.upsert(entry);
    this.active = entry.symbol;
    this.logger.info(SCOPE, "Agent-Token eingefügt", { symbol: entry.symbol });
    return this.saveResult(await this.persistAndNotify());
  }

  /** Makes the agent active and checks its token afterwards. */
  async select(input: unknown): Promise<AgentResult> {
    const entry = typeof input === "string" ? this.find(input) : undefined;
    if (!entry) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Wechseln des Agents");
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    this.active = entry.symbol;
    this.logger.info(SCOPE, "Aktiver Agent gewechselt", { symbol: entry.symbol });
    if (!(await this.persistAndNotify())) return this.saveResult(false);
    return this.check(entry.symbol);
  }

  async remove(input: unknown): Promise<AgentResult> {
    const entry = typeof input === "string" ? this.find(input) : undefined;
    if (!entry) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Entfernen eines Agents");
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    this.entries = this.entries.filter((item) => item !== entry);
    if (this.active === entry.symbol) this.active = null;
    this.logger.info(SCOPE, "Agent entfernt", { symbol: entry.symbol });
    return this.saveResult(await this.persistAndNotify());
  }

  /** Checks one agent or, without a symbol, all agents one after another. */
  async check(input?: unknown): Promise<AgentResult> {
    let targets: AgentEntry[];
    if (input === undefined) {
      targets = [...this.entries];
    } else {
      const entry = typeof input === "string" ? this.find(input) : undefined;
      if (!entry) {
        this.logger.warn(SCOPE, "Ungültige Eingabe beim Prüfen eines Agents");
        return { ok: false, message: INVALID_INPUT_MESSAGE };
      }
      targets = [entry];
    }
    if (targets.length > 0 && !this.cipher.isAvailable()) {
      return { ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE };
    }

    let message: string | undefined;
    let changed = false;
    for (const entry of targets) {
      const token = this.decrypt(entry.cipherText, entry.symbol);
      if (token === undefined) {
        message ??= INVALID_AGENT_TOKEN_MESSAGE;
        continue;
      }
      try {
        const agent = (await this.client({ agentToken: token }).agents.getMyAgent()).data;
        entry.status = "valid";
        entry.credits = agent.credits;
        entry.headquarters = agent.headquarters;
        changed = true;
      } catch (error) {
        const text = this.failure(error, "check", entry.symbol);
        if (isExpiredTokenError(error)) {
          entry.status = "expired";
          changed = true;
        } else {
          message ??= text;
        }
      }
    }

    if (changed && !(await this.persistAndNotify())) return this.saveResult(false);
    return message === undefined ? { ok: true, agents: this.status() } : { ok: false, message };
  }

  /** Core-internal only: a client with the Agent-Token of the active agent. */
  activeClient(): SpaceTradersClient | undefined {
    const entry = this.active === null ? undefined : this.find(this.active);
    if (!entry) return undefined;
    const token = this.decrypt(entry.cipherText, entry.symbol);
    return token === undefined ? undefined : this.client({ agentToken: token });
  }

  private client(tokens: { agentToken?: string; accountToken?: string }): SpaceTradersClient {
    return createSpaceTradersClient({
      ...tokens,
      ...(this.fetchFn ? { fetch: this.fetchFn } : {}),
    });
  }

  private parseRegisterInput(
    input: unknown,
  ): { symbol: string; faction: string; accountToken?: string } | undefined {
    if (!isRecord(input)) return undefined;
    const { symbol, faction, accountToken } = input;
    if (typeof symbol !== "string" || !SYMBOL_PATTERN.test(symbol)) return undefined;
    if (typeof faction !== "string" || !FACTION_PATTERN.test(faction)) return undefined;
    if (accountToken === undefined) return { symbol: symbol.toUpperCase(), faction };
    const token = parseSecretValue(accountToken);
    if (token === undefined) return undefined;
    return { symbol: symbol.toUpperCase(), faction, accountToken: token };
  }

  private find(symbol: string): AgentEntry | undefined {
    return this.entries.find((entry) => entry.symbol === symbol);
  }

  private upsert(entry: AgentEntry): void {
    const index = this.entries.findIndex((item) => item.symbol === entry.symbol);
    if (index >= 0) this.entries[index] = entry;
    else this.entries.push(entry);
  }

  private toEntry(agent: ApiAgent, token: string): AgentEntry | undefined {
    let cipherText: string;
    try {
      cipherText = this.cipher.encrypt(token);
    } catch {
      this.logger.error(SCOPE, "Agent-Token konnte nicht verschlüsselt werden", {
        symbol: agent.symbol,
      });
      return undefined;
    }
    return {
      symbol: agent.symbol,
      faction: agent.startingFaction,
      headquarters: agent.headquarters,
      credits: agent.credits,
      status: "valid",
      cipherText,
    };
  }

  private decrypt(cipherText: string, symbol: string): string | undefined {
    if (!this.cipher.isAvailable()) {
      this.logger.warn(SCOPE, "Agent-Token nicht lesbar", { symbol });
      return undefined;
    }
    try {
      const token = this.cipher.decrypt(cipherText);
      this.logger.registerSecret(token);
      return token;
    } catch {
      this.logger.warn(SCOPE, "Agent-Token nicht entschlüsselbar", { symbol });
      return undefined;
    }
  }

  private failure(error: unknown, context: AgentErrorContext, symbol?: string): string {
    const status = error instanceof SpaceTradersError ? error.status : undefined;
    const code = error instanceof SpaceTradersError ? error.code : undefined;
    this.logger.warn(SCOPE, "Anfrage an SpaceTraders fehlgeschlagen", { symbol, status, code });
    return agentErrorMessage(error, context);
  }

  private saveResult(saved: boolean): AgentResult {
    return saved
      ? { ok: true, agents: this.status() }
      : {
          ok: false,
          message: this.cipher.isAvailable() ? SAVE_FAILED_MESSAGE : ENCRYPTION_UNAVAILABLE_MESSAGE,
        };
  }

  /** Writes the file and sends `agents-changed`; the in-memory state stays either way. */
  private async persistAndNotify(): Promise<boolean> {
    let saved = false;
    if (!this.cipher.isAvailable()) {
      this.logger.warn(SCOPE, "Agents nicht gespeichert: keine Verschlüsselung verfügbar");
    } else {
      const stored: StoredAgent[] = this.entries.map(({ cipherText, ...summary }) => ({
        ...summary,
        token: cipherText,
      }));
      try {
        await this.files.write(
          AGENTS_FILE,
          JSON.stringify({ active: this.active, agents: stored }, null, 2),
        );
        saved = true;
      } catch (error) {
        this.logger.error(SCOPE, "Agents-Datei konnte nicht geschrieben werden", error);
      }
    }
    this.events.send({ type: "agents-changed", agents: this.status() });
    return saved;
  }
}
