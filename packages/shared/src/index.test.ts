import { describe, expect, it } from "vitest";
import { APP_NAME, IpcChannel } from "./index";

describe("shared", () => {
  it("exports the app name", () => {
    expect(APP_NAME).toBe("space-trader-leviathan");
  });

  it("names the IPC channel for the app info", () => {
    expect(IpcChannel.GetAppInfo).toBe("app:get-info");
  });
});
