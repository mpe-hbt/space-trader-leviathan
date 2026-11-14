import { describe, expect, it } from "vitest";
import { cssVariables, themeCss } from "./css";
import { tokens } from "./tokens";

// Expected values, copied from the table and text of ADR-03 in docs/decisions.md.
const expected: Record<string, string | number> = {
  "color.bg.base": "#0B0F17",
  "color.bg.surface1": "#121826",
  "color.bg.surface2": "#1A2233",
  "color.bg.surface3": "#232D42",
  "color.border.subtle": "#2C3850",
  "color.border.control": "#64779A",
  "color.text.primary": "#E6EBF5",
  "color.text.secondary": "#A7B2C6",
  "color.text.muted": "#8C99B2",
  "color.accent.primary": "#3DD6D0",
  "color.accent.primaryHover": "#6BE3DE",
  "color.accent.onPrimary": "#0B0F17",
  "color.accent.boardComputer": "#B69CFF",
  "color.focus": "#7FEFEA",
  "color.credits": "#F2B544",
  "color.status.success": "#4FD18B",
  "color.status.warning": "#F59E3D",
  "color.status.danger": "#FF7A7A",
  "color.status.info": "#6DB3FF",
  "fontFamily.heading": '"Space Grotesk", system-ui, sans-serif',
  "fontFamily.body": '"IBM Plex Sans", system-ui, sans-serif',
  "fontFamily.mono": '"JetBrains Mono", ui-monospace, monospace',
  "fontSize.hint": 12,
  "fontSize.base": 14,
  "fontSize.emphasis": 16,
  "fontSize.h3": 20,
  "fontSize.h2": 24,
  "fontSize.h1": 32,
  "lineHeight.text": 1.5,
  "lineHeight.heading": 1.25,
  "space.4": 4,
  "space.8": 8,
  "space.12": 12,
  "space.16": 16,
  "space.24": 24,
  "space.32": 32,
  "space.48": 48,
  "radius.sm": 2,
  "radius.md": 4,
  "radius.lg": 8,
  "shadow.dialog": "0 8px 32px rgb(0 0 0 / 0.5)",
  "duration.fast": 120,
  "duration.normal": 200,
  "duration.slow": 320,
  "easing.enter": "cubic-bezier(0.2, 0, 0, 1)",
  "easing.exit": "cubic-bezier(0.4, 0, 1, 1)",
};

function flatten(value: unknown, path = ""): Record<string, string | number> {
  if (typeof value !== "object" || value === null) return { [path]: value as string | number };
  return Object.entries(value).reduce<Record<string, string | number>>(
    (acc, [key, child]) => ({ ...acc, ...flatten(child, path ? `${path}.${key}` : key) }),
    {},
  );
}

describe("tokens", () => {
  it("match ADR-03 exactly", () => {
    expect(flatten(tokens)).toEqual(expected);
  });
});

describe("cssVariables", () => {
  const vars = cssVariables(tokens);

  it("prefixes every variable with --stl-", () => {
    for (const name of Object.keys(vars)) expect(name).toMatch(/^--stl-[a-z0-9-]+$/);
  });

  it("creates one variable per token", () => {
    expect(Object.keys(vars)).toHaveLength(Object.keys(expected).length);
  });

  it("names colors without group and others with group, with units", () => {
    expect(vars).toMatchObject({
      "--stl-bg-base": "#0B0F17",
      "--stl-accent-primary-hover": "#6BE3DE",
      "--stl-accent-on-primary": "#0B0F17",
      "--stl-accent-board-computer": "#B69CFF",
      "--stl-focus": "#7FEFEA",
      "--stl-credits": "#F2B544",
      "--stl-status-success": "#4FD18B",
      "--stl-font-family-body": '"IBM Plex Sans", system-ui, sans-serif',
      "--stl-font-size-base": "14px",
      "--stl-font-size-h1": "32px",
      "--stl-line-height-text": "1.5",
      "--stl-space-16": "16px",
      "--stl-space-48": "48px",
      "--stl-radius-md": "4px",
      "--stl-shadow-dialog": "0 8px 32px rgb(0 0 0 / 0.5)",
      "--stl-duration-fast": "120ms",
      "--stl-duration-slow": "320ms",
      "--stl-easing-enter": "cubic-bezier(0.2, 0, 0, 1)",
    });
  });
});

describe("themeCss", () => {
  const css = themeCss(tokens);

  it("declares the variables on :root", () => {
    expect(css).toMatch(/^:root \{/);
    expect(css).toContain("--stl-bg-base: #0B0F17;");
    expect(css).toContain("--stl-space-48: 48px;");
    expect(css).toContain("--stl-duration-slow: 320ms;");
  });

  it("sets all durations to 0ms for reduced motion", () => {
    const block = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(block).not.toBe(css);
    const zeroed = [...block.matchAll(/(--stl-[a-z-]+): 0ms;/g)].map((m) => m[1]);
    expect(zeroed).toEqual(["--stl-duration-fast", "--stl-duration-normal", "--stl-duration-slow"]);
  });
});
