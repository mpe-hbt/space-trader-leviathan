import { resolve } from "node:path";
import type { StorybookConfig } from "@storybook/react-vite";

const root = resolve(import.meta.dirname, "..");

const config: StorybookConfig = {
  framework: "@storybook/react-vite",
  stories: ["../src/renderer/src/**/*.stories.tsx"],
  core: { disableTelemetry: true },
  viteFinal(viteConfig) {
    viteConfig.resolve ??= {};
    viteConfig.resolve.alias = {
      ...(viteConfig.resolve.alias as Record<string, string> | undefined),
      "@leviathan/shared": resolve(root, "packages/shared/src"),
      "@leviathan/api-client": resolve(root, "packages/api-client/src"),
    };
    return viteConfig;
  },
};

export default config;
