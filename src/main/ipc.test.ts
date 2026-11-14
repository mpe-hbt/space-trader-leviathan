import { describe, expect, it } from "vitest";
import { INVALID_INPUT_MESSAGE, IpcChannel } from "@leviathan/shared";
import { createCore } from "./core";
import { LOG_FILE } from "./core/logger";
import { fakePorts } from "./core/test-fakes";
import {
  FOREIGN_SENDER_MESSAGE,
  isAllowedSender,
  registerIpcHandlers,
  type InvokeHandler,
} from "./ipc";

const DEV_URL = "http://localhost:5173";
const FILE_URL = "file:///opt/leviathan/out/renderer/index.html";

async function setup(allowedRendererUrl = DEV_URL) {
  const ports = fakePorts();
  const core = createCore(ports);
  await core.start();
  const handlers = new Map<string, InvokeHandler>();
  registerIpcHandlers((channel, handler) => handlers.set(channel, handler), {
    core,
    appInfo: () => ({ name: "space-trader-leviathan", version: "0.1.0" }),
    allowedRendererUrl,
  });
  const own = { senderFrame: { url: `${DEV_URL}/` } };
  const invoke = (channel: string, ...args: unknown[]) => {
    const handler = handlers.get(channel);
    if (!handler) throw new Error(`no handler for ${channel}`);
    return Promise.resolve(handler(own, ...args));
  };
  return { ports, core, handlers, invoke };
}

describe("isAllowedSender", () => {
  it("accepts the dev server origin", () => {
    expect(isAllowedSender(`${DEV_URL}/index.html#x`, DEV_URL)).toBe(true);
  });

  it("accepts the bundled renderer file", () => {
    expect(isAllowedSender(FILE_URL, FILE_URL)).toBe(true);
  });

  it.each([
    ["foreign host", "https://evil.example/", DEV_URL],
    ["other port", "http://localhost:9999/", DEV_URL],
    ["other file", "file:///tmp/evil.html", FILE_URL],
    ["http in production", "http://localhost:5173/", FILE_URL],
    ["missing url", undefined, DEV_URL],
    ["invalid url", "nicht-url", DEV_URL],
  ])("rejects a %s", (_label, url, allowed) => {
    expect(isAllowedSender(url, allowed)).toBe(false);
  });
});

describe("registerIpcHandlers", () => {
  it("registers a handler for every invoke channel", async () => {
    const { handlers } = await setup();
    expect([...handlers.keys()].sort()).toEqual(
      [
        IpcChannel.GetAppInfo,
        IpcChannel.GetSettings,
        IpcChannel.SetSecret,
        IpcChannel.ClearSecret,
        IpcChannel.GetAgents,
        IpcChannel.GetFactions,
        IpcChannel.RegisterAgent,
        IpcChannel.ImportAgentToken,
        IpcChannel.SelectAgent,
        IpcChannel.RemoveAgent,
        IpcChannel.CheckAgents,
      ].sort(),
    );
  });

  it("accepts valid calls", async () => {
    const { invoke } = await setup();
    await expect(invoke(IpcChannel.GetAppInfo)).resolves.toEqual({
      name: "space-trader-leviathan",
      version: "0.1.0",
    });
    await expect(invoke(IpcChannel.GetSettings)).resolves.toMatchObject({
      secrets: { anthropicApiKey: { configured: false } },
    });
    const saved = await invoke(IpcChannel.SetSecret, "githubToken", "ghp_geheim", "extra");
    expect(saved).toMatchObject({
      ok: true,
      settings: { secrets: { githubToken: { configured: true } } },
    });
    expect(JSON.stringify(saved)).not.toContain("ghp_geheim");
    await expect(invoke(IpcChannel.ClearSecret, "githubToken")).resolves.toMatchObject({
      ok: true,
    });
  });

  it.each([
    ["unknown name", ["agentToken", "abc"]],
    ["empty value", ["githubToken", ""]],
    ["too long value", ["githubToken", "a".repeat(5000)]],
    ["value with spaces", ["githubToken", "a b"]],
    ["wrong type", ["githubToken", 123]],
    ["no arguments", []],
  ])("answers an invalid set call (%s) with a clear message", async (_label, args) => {
    const { invoke, ports } = await setup();
    await expect(invoke(IpcChannel.SetSecret, ...args)).resolves.toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
    expect(ports.events.events).toEqual([]);
  });

  it("answers an invalid clear call with a clear message", async () => {
    const { invoke } = await setup();
    await expect(invoke(IpcChannel.ClearSecret, { name: "githubToken" })).resolves.toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
  });

  it("rejects calls from a foreign sender and logs a warning", async () => {
    const { handlers, core, ports } = await setup();
    const handler = handlers.get(IpcChannel.GetSettings);
    expect(() => handler?.({ senderFrame: { url: "https://evil.example/" } })).toThrow(
      FOREIGN_SENDER_MESSAGE,
    );
    expect(() => handler?.({ senderFrame: null })).toThrow(FOREIGN_SENDER_MESSAGE);
    await core.logger.flush();
    expect(ports.files.files.get(LOG_FILE)).toContain("fremden Absenders");
  });

  it.each([
    IpcChannel.GetAgents,
    IpcChannel.GetFactions,
    IpcChannel.RegisterAgent,
    IpcChannel.ImportAgentToken,
    IpcChannel.SelectAgent,
    IpcChannel.RemoveAgent,
    IpcChannel.CheckAgents,
  ])("rejects a foreign sender on %s", async (channel) => {
    const { handlers } = await setup();
    const handler = handlers.get(channel);
    expect(() => handler?.({ senderFrame: { url: "https://evil.example/" } })).toThrow(
      FOREIGN_SENDER_MESSAGE,
    );
  });

  it("answers agent calls without token", async () => {
    const { invoke } = await setup();
    await expect(invoke(IpcChannel.GetAgents)).resolves.toEqual({
      encryptionAvailable: true,
      accountTokenConfigured: false,
      active: null,
      agents: [],
    });
    await expect(invoke(IpcChannel.SelectAgent, "UNKNOWN")).resolves.toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
    await expect(invoke(IpcChannel.ImportAgentToken, 5)).resolves.toEqual({
      ok: false,
      message: INVALID_INPUT_MESSAGE,
    });
  });
});
