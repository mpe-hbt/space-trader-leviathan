import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@leviathan/shared": resolve(import.meta.dirname, "packages/shared/src"),
      "@leviathan/api-client": resolve(import.meta.dirname, "packages/api-client/src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "packages/**/*.test.ts"],
  },
});
