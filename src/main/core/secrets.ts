import {
  ENCRYPTION_UNAVAILABLE_MESSAGE,
  SECRET_NAMES,
  type SaveResult,
  type SecretName,
  type SettingsStatus,
} from "@leviathan/shared";
import type { Logger } from "./logger";
import type { FileStore, SecretCipher } from "./ports";

export const SECRETS_FILE = "secrets.json";
export const SAVE_FAILED_MESSAGE = "Speichern fehlgeschlagen.";

const SCOPE = "secrets";

/**
 * Keeps the secrets encrypted in `secrets.json`. Values never leave the core:
 * the renderer only learns whether a secret is configured.
 */
export class SecretStore {
  private entries = new Map<SecretName, string>();

  constructor(
    private readonly cipher: SecretCipher,
    private readonly files: FileStore,
    private readonly logger: Logger,
  ) {}

  /** Loads the file; anything missing, broken or undecryptable counts as not configured. */
  async load(): Promise<void> {
    this.entries = new Map();
    let text: string | undefined;
    try {
      text = await this.files.read(SECRETS_FILE);
    } catch (error) {
      this.logger.warn(SCOPE, "Secrets-Datei nicht lesbar", error);
      return;
    }
    if (text === undefined) return;

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      this.logger.warn(SCOPE, "Secrets-Datei ist kein gültiges JSON");
      return;
    }
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      this.logger.warn(SCOPE, "Secrets-Datei hat ein unbekanntes Format");
      return;
    }

    const stored = parsed as Record<string, unknown>;
    for (const name of SECRET_NAMES) {
      const cipherText = stored[name];
      if (cipherText === undefined) continue;
      if (typeof cipherText !== "string" || !this.cipher.isAvailable()) {
        this.logger.warn(SCOPE, "Secret nicht lesbar", { name });
        continue;
      }
      try {
        this.logger.registerSecret(this.cipher.decrypt(cipherText));
        this.entries.set(name, cipherText);
      } catch {
        this.logger.warn(SCOPE, "Secret nicht entschlüsselbar", { name });
      }
    }
  }

  status(): SettingsStatus {
    const secrets = {} as SettingsStatus["secrets"];
    for (const name of SECRET_NAMES) secrets[name] = { configured: this.entries.has(name) };
    return { encryptionAvailable: this.cipher.isAvailable(), secrets };
  }

  async set(name: SecretName, value: string): Promise<SaveResult> {
    if (!this.cipher.isAvailable()) return { ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE };
    this.logger.registerSecret(value);
    let cipherText: string;
    try {
      cipherText = this.cipher.encrypt(value);
    } catch (error) {
      this.logger.error(SCOPE, "Secret konnte nicht verschlüsselt werden", { name, error });
      return { ok: false, message: SAVE_FAILED_MESSAGE };
    }
    const next = new Map(this.entries).set(name, cipherText);
    return this.persist(next);
  }

  async clear(name: SecretName): Promise<SaveResult> {
    const next = new Map(this.entries);
    next.delete(name);
    return this.persist(next);
  }

  /** Core-internal only; never send the result to the renderer or into a log. */
  get(name: SecretName): string | undefined {
    const cipherText = this.entries.get(name);
    if (cipherText === undefined || !this.cipher.isAvailable()) return undefined;
    try {
      return this.cipher.decrypt(cipherText);
    } catch {
      this.logger.warn(SCOPE, "Secret nicht entschlüsselbar", { name });
      return undefined;
    }
  }

  private async persist(next: Map<SecretName, string>): Promise<SaveResult> {
    try {
      await this.files.write(SECRETS_FILE, JSON.stringify(Object.fromEntries(next), null, 2));
    } catch (error) {
      this.logger.error(SCOPE, "Secrets-Datei konnte nicht geschrieben werden", error);
      return { ok: false, message: SAVE_FAILED_MESSAGE };
    }
    this.entries = next;
    return { ok: true, settings: this.status() };
  }
}
