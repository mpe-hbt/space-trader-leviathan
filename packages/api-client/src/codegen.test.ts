import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { SPACETRADERS_SPEC_VERSION } from "./index";

const packageDir = resolve(import.meta.dirname, "..");
const script = resolve(packageDir, "scripts/codegen.mjs");
const specPath = resolve(packageDir, "spec/SpaceTraders.json");

describe("Codegen", () => {
  it("erzeugte Typen passen zur gepinnten Spezifikation", () => {
    // Wirft, wenn das Skript mit einem Exit-Code ungleich 0 endet.
    expect(() =>
      execFileSync(process.execPath, [script, "--check"], { stdio: "pipe" }),
    ).not.toThrow();
  }, 60_000);

  it("SPACETRADERS_SPEC_VERSION entspricht info.version der Spezifikation", () => {
    const spec = JSON.parse(readFileSync(specPath, "utf8")) as { info: { version: string } };
    expect(spec.info.version).toBe(SPACETRADERS_SPEC_VERSION);
  });
});
