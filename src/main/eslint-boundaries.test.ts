import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const eslint = new ESLint({ cwd: process.cwd() });

async function restrictedImports(filePath: string, code: string): Promise<number> {
  const [result] = await eslint.lintText(code, { filePath });
  return result?.messages.filter((m) => m.ruleId === "no-restricted-imports").length ?? 0;
}

// The first lintText loads the whole ESLint config, which takes over 5 s on Windows CI runners.
describe("import boundaries", { timeout: 30_000 }, () => {
  it("forbids electron in the core", async () => {
    expect(
      await restrictedImports("src/main/core/x.ts", 'import { app } from "electron";\nvoid app;\n'),
    ).toBe(1);
  });

  it("allows electron in the adapters", async () => {
    expect(
      await restrictedImports(
        "src/main/adapters/x.ts",
        'import { app } from "electron";\nvoid app;\n',
      ),
    ).toBe(0);
  });

  it.each([
    "electron",
    "node:fs",
    "fs",
    "@leviathan/api-client",
    "@anthropic-ai/sdk",
    "@octokit/rest",
  ])("forbids %s in the renderer", async (module) => {
    expect(
      await restrictedImports("src/renderer/src/x.ts", `import x from "${module}";\nvoid x;\n`),
    ).toBe(1);
  });

  it("allows the shared package in the renderer", async () => {
    expect(
      await restrictedImports(
        "src/renderer/src/x.ts",
        'import { APP_NAME } from "@leviathan/shared";\nvoid APP_NAME;\n',
      ),
    ).toBe(0);
  });
});
