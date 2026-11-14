import { ENCRYPTION_UNAVAILABLE_MESSAGE, type SettingsStatus } from "@leviathan/shared";

export const MISSING_ANTHROPIC_API_KEY_MESSAGE =
  "Kein Anthropic-API-Key hinterlegt. Ohne Key ist der Board-Computer ausgeblendet.";
export const MISSING_GITHUB_TOKEN_MESSAGE =
  "Kein GitHub-Token hinterlegt. Ohne Token kann der Board-Computer keine Issues anlegen.";
export const LOAD_FAILED_MESSAGE = "Die Einstellungen konnten nicht geladen werden.";
export const SAVE_FAILED_MESSAGE = "Speichern fehlgeschlagen.";

/** Clear notes for the settings dialog about what is missing. */
export function settingsMessages(status: SettingsStatus): string[] {
  const messages: string[] = [];
  if (!status.encryptionAvailable) messages.push(ENCRYPTION_UNAVAILABLE_MESSAGE);
  if (!status.secrets.anthropicApiKey.configured) messages.push(MISSING_ANTHROPIC_API_KEY_MESSAGE);
  if (!status.secrets.githubToken.configured) messages.push(MISSING_GITHUB_TOKEN_MESSAGE);
  return messages;
}
