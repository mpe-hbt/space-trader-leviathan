import { describe, expect, it } from "vitest";
import type { SettingsStatus } from "@leviathan/shared";
import { settingsMessages } from "./messages";

function status(anthropic: boolean, github: boolean, encryption = true): SettingsStatus {
  return {
    encryptionAvailable: encryption,
    // No note for a missing Account-Token; the agents dialog explains it.
    secrets: {
      anthropicApiKey: { configured: anthropic },
      githubToken: { configured: github },
      accountToken: { configured: false },
    },
  };
}

describe("settingsMessages", () => {
  it("shows nothing when everything is configured", () => {
    expect(settingsMessages(status(true, true))).toEqual([]);
  });

  it("explains a missing Anthropic-API-Key", () => {
    expect(settingsMessages(status(false, true))).toEqual([
      "Kein Anthropic-API-Key hinterlegt. Ohne Key ist der Board-Computer ausgeblendet.",
    ]);
  });

  it("explains a missing GitHub-Token", () => {
    expect(settingsMessages(status(true, false))).toEqual([
      "Kein GitHub-Token hinterlegt. Ohne Token kann der Board-Computer keine Issues anlegen.",
    ]);
  });

  it("explains a missing key store first", () => {
    expect(settingsMessages(status(true, true, false))).toEqual([
      "Der Schlüsselspeicher des Betriebssystems ist nicht verfügbar. Schlüssel können nicht gespeichert werden.",
    ]);
    expect(settingsMessages(status(false, false, false))).toHaveLength(3);
  });
});
