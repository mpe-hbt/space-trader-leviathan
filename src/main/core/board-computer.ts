import type { SecretStore } from "./secrets";

/** The Board-Computer (Claude). Only available with an Anthropic-API-Key; requests follow in #21. */
export class BoardComputerService {
  constructor(private readonly secrets: SecretStore) {}

  isAvailable(): boolean {
    return this.secrets.status().secrets.anthropicApiKey.configured;
  }
}
