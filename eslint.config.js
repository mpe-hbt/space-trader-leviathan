import { builtinModules } from "node:module";
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "out/", "node_modules/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["src/renderer/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ["src/main/**/*.ts", "src/preload/**/*.ts", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
  },
  {
    // The core runs without Electron; Electron APIs go through src/main/adapters.
    files: ["src/main/core/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "electron",
              message: "Der Kern nutzt Electron nur über die Adapter in src/main/adapters.",
            },
          ],
        },
      ],
    },
  },
  {
    // The renderer talks to the core only via IPC (window.leviathan).
    files: ["src/renderer/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "electron",
                "electron/*",
                "node:*",
                ...builtinModules,
                ...builtinModules.map((name) => `${name}/*`),
                "@leviathan/api-client",
                "@anthropic-ai/sdk",
                "@anthropic-ai/sdk/*",
                "@octokit/*",
              ],
              message: "Der Renderer spricht nur per IPC mit dem Kern; nutze window.leviathan.",
            },
          ],
        },
      ],
    },
  },
  prettier,
);
