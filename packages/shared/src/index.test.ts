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
  });

  it("uses distinct channel names", () => {
    const names = Object.values(IpcChannel);
    expect(new Set(names).size).toBe(names.length);
  });

  it("lists the secret names", () => {
    expect(SECRET_NAMES).toEqual(["anthropicApiKey", "githubToken"]);
  });
});
