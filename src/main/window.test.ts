import { describe, expect, it } from "vitest";
import { createWindowOptions } from "./window";

describe("createWindowOptions", () => {
  const { webPreferences } = createWindowOptions("/app/preload.cjs");

  it("uses the given preload script", () => {
    expect(webPreferences?.preload).toBe("/app/preload.cjs");
  });

  it("sets the Electron security settings", () => {
    expect(webPreferences?.contextIsolation).toBe(true);
    expect(webPreferences?.nodeIntegration).toBe(false);
    expect(webPreferences?.sandbox).toBe(true);
    expect(webPreferences?.webSecurity).toBe(true);
  });
});
