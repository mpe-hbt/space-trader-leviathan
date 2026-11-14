import type { Tokens } from "./tokens";

/** Prefix of all CSS custom properties generated from the tokens. */
export const CSS_PREFIX = "--stl-";

const units: Record<string, string> = {
  fontSize: "px",
  space: "px",
  radius: "px",
  duration: "ms",
};

function kebab(key: string): string {
  return key.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
}

function flatten(value: unknown, path: string[], unit: string, out: Record<string, string>): void {
  if (typeof value === "object" && value !== null) {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, [...path, key], unit, out);
    }
    return;
  }
  const name = CSS_PREFIX + path.map(kebab).join("-");
  out[name] = typeof value === "number" ? `${value}${unit}` : String(value);
}

/** Maps every token to a CSS custom property, e.g. `--stl-bg-base` or `--stl-space-16`. */
export function cssVariables(t: Tokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [group, value] of Object.entries(t)) {
    // Colors drop their group name: `--stl-bg-base` instead of `--stl-color-bg-base`.
    const path = group === "color" ? [] : [group];
    flatten(value, path, units[group] ?? "", out);
  }
  return out;
}

/** Names of the duration variables, generated from `tokens.duration`. */
export function durationVariables(t: Tokens): string[] {
  return Object.keys(t.duration).map((key) => `${CSS_PREFIX}duration-${kebab(key)}`);
}

/** CSS text with all variables on `:root` and all durations set to 0 for reduced motion. */
export function themeCss(t: Tokens): string {
  const declarations = Object.entries(cssVariables(t))
    .map(([name, value]) => `  ${name}: ${value};`)
    .join("\n");
  const reduced = durationVariables(t)
    .map((name) => `    ${name}: 0ms;`)
    .join("\n");
  return (
    `:root {\n${declarations}\n}\n` +
    `@media (prefers-reduced-motion: reduce) {\n  :root {\n${reduced}\n  }\n}\n`
  );
}
