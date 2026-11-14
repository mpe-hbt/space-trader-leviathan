import { describe, expect, it } from "vitest";
import { ENCRYPTION_UNAVAILABLE_MESSAGE } from "@leviathan/shared";
import { LOG_FILE, createLogger } from "./logger";
import { SECRETS_FILE, SecretStore } from "./secrets";
import { FakeCipher, MemoryFileStore } from "./test-fakes";

function setup() {
  const cipher = new FakeCipher();
  const files = new MemoryFileStore();
  const logger = createLogger(files);
  const store = new SecretStore(cipher, files, logger);
  return { cipher, files, logger, store };
}

describe("SecretStore", () => {
  it("stores a secret encrypted and reports only whether it is configured", async () => {
    const { files, store } = setup();
    const result = await store.set("anthropicApiKey", "sk-ant-geheim");

    expect(result).toEqual({
      ok: true,
      settings: {
        encryptionAvailable: true,
        secrets: { anthropicApiKey: { configured: true }, githubToken: { configured: false } },
      },
    });
    const file = files.files.get(SECRETS_FILE) ?? "";
    expect(file).not.toContain("sk-ant-geheim");
    expect(JSON.stringify(store.status())).not.toContain("sk-ant-geheim");
    expect(store.get("anthropicApiKey")).toBe("sk-ant-geheim");
  });

  it("loads stored secrets after a restart", async () => {
    const { cipher, files, logger, store } = setup();
    await store.set("githubToken", "ghp_geheim");

    const reloaded = new SecretStore(cipher, files, logger);
    await reloaded.load();
    expect(reloaded.status().secrets.githubToken.configured).toBe(true);
    expect(reloaded.get("githubToken")).toBe("ghp_geheim");
  });

  it("clears a secret", async () => {
    const { files, store } = setup();
    await store.set("githubToken", "ghp_geheim");
    const result = await store.clear("githubToken");

    expect(result.ok && result.settings.secrets.githubToken.configured).toBe(false);
    expect(files.files.get(SECRETS_FILE)).toBe("{}");
  });

  it("writes nothing in plaintext without encryption", async () => {
    const { cipher, files, store } = setup();
    cipher.available = false;
    const result = await store.set("anthropicApiKey", "sk-ant-geheim");

    expect(result).toEqual({ ok: false, message: ENCRYPTION_UNAVAILABLE_MESSAGE });
    expect(files.files.has(SECRETS_FILE)).toBe(false);
    expect(store.status().encryptionAvailable).toBe(false);
  });

  it.each([
    ["broken JSON", "{not json"],
    ["wrong format", "[1,2]"],
    ["undecryptable entry", JSON.stringify({ anthropicApiKey: "AAAA", githubToken: 5 })],
  ])("treats a %s as not configured", async (_label, content) => {
    const { files, logger, store } = setup();
    files.files.set(SECRETS_FILE, content);
    await expect(store.load()).resolves.toBeUndefined();
    expect(store.status().secrets).toEqual({
      anthropicApiKey: { configured: false },
      githubToken: { configured: false },
    });
    await logger.flush();
    expect(files.files.get(LOG_FILE)).toContain('"level":"warn"');
  });

  it("treats a missing file as not configured", async () => {
    const { store } = setup();
    await store.load();
    expect(store.status().secrets.anthropicApiKey.configured).toBe(false);
  });

  it("registers loaded and saved secrets for redaction", async () => {
    const { cipher, files, logger, store } = setup();
    await store.set("githubToken", "ghp_geheim");
    const reloaded = new SecretStore(cipher, files, createLogger(files));
    await reloaded.load();
    logger.info("test", "token ghp_geheim");
    await logger.flush();
    expect(files.files.get(LOG_FILE)).not.toContain("ghp_geheim");
  });

  it("keeps the old state when writing fails", async () => {
    const { files, store } = setup();
    files.failWrites = true;
    const result = await store.set("githubToken", "ghp_geheim");
    expect(result).toEqual({ ok: false, message: "Speichern fehlgeschlagen." });
    expect(store.status().secrets.githubToken.configured).toBe(false);
  });
});
