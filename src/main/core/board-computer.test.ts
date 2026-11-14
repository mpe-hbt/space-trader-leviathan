import { describe, expect, it } from "vitest";
import { BoardComputerService } from "./board-computer";
import { GitHubService } from "./github";
import { createLogger } from "./logger";
import { SecretStore } from "./secrets";
import { FakeCipher, MemoryFileStore } from "./test-fakes";

function setup() {
  const files = new MemoryFileStore();
  const secrets = new SecretStore(new FakeCipher(), files, createLogger(files));
  return {
    secrets,
    boardComputer: new BoardComputerService(secrets),
    gitHub: new GitHubService(secrets),
  };
}

describe("BoardComputerService", () => {
  it("is not available without an Anthropic-API-Key instead of failing", async () => {
    const { secrets, boardComputer } = setup();
    await secrets.load();
    expect(() => boardComputer.isAvailable()).not.toThrow();
    expect(boardComputer.isAvailable()).toBe(false);
  });

  it("is available with an Anthropic-API-Key", async () => {
    const { secrets, boardComputer } = setup();
    await secrets.set("anthropicApiKey", "sk-ant-geheim");
    expect(boardComputer.isAvailable()).toBe(true);
  });
});

describe("GitHubService", () => {
  it("follows the GitHub-Token", async () => {
    const { secrets, gitHub } = setup();
    expect(gitHub.isAvailable()).toBe(false);
    await secrets.set("githubToken", "ghp_geheim");
    expect(gitHub.isAvailable()).toBe(true);
  });
});
