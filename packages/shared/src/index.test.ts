import { describe, expect, it } from "vitest";
import { APP_NAME, IpcChannel, SECRET_NAMES } from "./index";

describe("shared", () => {
  it("exports the app name", () => {
    expect(APP_NAME).toBe("space-trader-leviathan");
  });

  it("names the IPC channel for the app info", () => {
    expect(IpcChannel.GetAppInfo).toBe("app:get-info");
  });

  it("names the IPC channels for settings and core events", () => {
    expect(IpcChannel.GetSettings).toBe("settings:get");
    expect(IpcChannel.SetSecret).toBe("settings:set-secret");
    expect(IpcChannel.ClearSecret).toBe("settings:clear-secret");
    expect(IpcChannel.CoreEvent).toBe("core:event");
    expect(IpcChannel.GetGameState).toBe("game-state:get");
  });

  it("names the IPC channels for agents", () => {
    expect(IpcChannel.GetAgents).toBe("agents:get");
    expect(IpcChannel.GetFactions).toBe("agents:get-factions");
    expect(IpcChannel.RegisterAgent).toBe("agents:register");
    expect(IpcChannel.ImportAgentToken).toBe("agents:import-token");
    expect(IpcChannel.SelectAgent).toBe("agents:select");
    expect(IpcChannel.RemoveAgent).toBe("agents:remove");
    expect(IpcChannel.CheckAgents).toBe("agents:check");
  });

  it("uses distinct channel names", () => {
    const names = Object.values(IpcChannel);
    expect(new Set(names).size).toBe(names.length);
  });

  it("lists the secret names", () => {
    expect(SECRET_NAMES).toEqual(["anthropicApiKey", "githubToken", "accountToken"]);
  });
});
