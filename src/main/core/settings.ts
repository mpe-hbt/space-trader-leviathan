import { INVALID_INPUT_MESSAGE, type SaveResult, type SettingsStatus } from "@leviathan/shared";
import { parseSecretName, parseSecretValue } from "./ipc-validation";
import type { Logger } from "./logger";
import type { EventSink } from "./ports";
import type { SecretStore } from "./secrets";

const SCOPE = "settings";

/** Entry point for the settings dialog. Checks every input from the renderer. */
export class SettingsService {
  constructor(
    private readonly secrets: SecretStore,
    private readonly events: EventSink,
    private readonly logger: Logger,
  ) {}

  status(): SettingsStatus {
    return this.secrets.status();
  }

  async setSecret(nameInput: unknown, valueInput: unknown): Promise<SaveResult> {
    const name = parseSecretName(nameInput);
    const value = parseSecretValue(valueInput);
    if (name === undefined || value === undefined) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Speichern eines Schlüssels", {
        validName: name !== undefined,
        validValue: value !== undefined,
      });
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    const result = await this.secrets.set(name, value);
    this.afterChange(result, "Schlüssel gespeichert", name);
    return result;
  }

  async clearSecret(nameInput: unknown): Promise<SaveResult> {
    const name = parseSecretName(nameInput);
    if (name === undefined) {
      this.logger.warn(SCOPE, "Ungültige Eingabe beim Entfernen eines Schlüssels");
      return { ok: false, message: INVALID_INPUT_MESSAGE };
    }
    const result = await this.secrets.clear(name);
    this.afterChange(result, "Schlüssel entfernt", name);
    return result;
  }

  private afterChange(result: SaveResult, message: string, name: string): void {
    if (!result.ok) {
      this.logger.warn(SCOPE, result.message, { name });
      return;
    }
    this.logger.info(SCOPE, message, { name });
    this.events.send({ type: "settings-changed", settings: result.settings });
  }
}
