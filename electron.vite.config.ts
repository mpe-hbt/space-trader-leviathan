import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "electron-vite";
import type { Plugin } from "vite";
import { contentSecurityPolicy, type BuildMode } from "./src/main/security";

const alias = {
  "@leviathan/shared": resolve(import.meta.dirname, "packages/shared/src"),
  "@leviathan/api-client": resolve(import.meta.dirname, "packages/api-client/src"),
};

// Writes the CSP from src/main/security.ts as a meta tag into index.html.
function cspPlugin(): Plugin {
  let mode: BuildMode = "production";
  return {
    name: "leviathan-csp",
    configResolved(config) {
      mode = config.command === "serve" ? "development" : "production";
    },
    transformIndexHtml() {
      return [
        {
          tag: "meta",
          attrs: { "http-equiv": "Content-Security-Policy", content: contentSecurityPolicy(mode) },
          injectTo: "head-prepend",
        },
      ];
    },
  };
}

export default defineConfig({
  main: {
    resolve: { alias },
  },
  preload: {
    resolve: { alias },
    build: {
      rollupOptions: {
        output: {
          // Sandboxed preload scripts cannot be ES modules.
          format: "cjs",
          entryFileNames: "[name].cjs",
        },
      },
    },
  },
  renderer: {
    resolve: { alias },
    plugins: [react(), cspPlugin()],
    build: {
      // Never inline fonts as data: URLs; the CSP only allows font-src 'self'.
      assetsInlineLimit: (file: string) => (/\.woff2?$/.test(file) ? false : undefined),
    },
  },
});
