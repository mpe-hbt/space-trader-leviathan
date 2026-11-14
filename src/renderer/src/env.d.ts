/// <reference types="vite/client" />

import type { LeviathanApi } from "@leviathan/shared";

declare global {
  interface Window {
    leviathan: LeviathanApi;
  }
}

export {};
