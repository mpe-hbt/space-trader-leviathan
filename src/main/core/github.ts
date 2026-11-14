import type { SecretStore } from "./secrets";

/** GitHub connection for issues from the Board-Computer. Requests follow in #24. */
export class GitHubService {
  constructor(private readonly secrets: SecretStore) {}

  isAvailable(): boolean {
    return this.secrets.status().secrets.githubToken.configured;
  }
}
