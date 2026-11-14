export type BuildMode = "development" | "production";

const productionDirectives: Record<string, string[]> = {
  "default-src": ["'self'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"],
  "img-src": ["'self'", "data:"],
  "font-src": ["'self'"],
  "connect-src": ["'self'"],
  "object-src": ["'none'"],
  "base-uri": ["'none'"],
  "form-action": ["'none'"],
  "frame-ancestors": ["'none'"],
};

// Only what Vite HMR and React Refresh need in the dev server; never used in a build.
const developmentAdditions: Record<string, string[]> = {
  "script-src": ["'unsafe-inline'"],
  "style-src": ["'unsafe-inline'"],
  "connect-src": ["ws://localhost:*", "http://localhost:*"],
};

export function contentSecurityPolicy(mode: BuildMode): string {
  return Object.entries(productionDirectives)
    .map(([directive, sources]) => {
      const extra = mode === "development" ? (developmentAdditions[directive] ?? []) : [];
      return [directive, ...sources, ...extra].join(" ");
    })
    .join("; ");
}
