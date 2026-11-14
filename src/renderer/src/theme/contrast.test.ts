import { describe, expect, it } from "vitest";
import { contrastRatio } from "./contrast";
import { tokens } from "./tokens";

const { color } = tokens;

const surfaces = Object.entries(color.bg).map(([name, hex]) => [`bg.${name}`, hex] as const);

const textColors = [
  ["text.primary", color.text.primary],
  ["text.secondary", color.text.secondary],
  ["text.muted", color.text.muted],
  ["status.success", color.status.success],
  ["status.warning", color.status.warning],
  ["status.danger", color.status.danger],
  ["status.info", color.status.info],
  ["credits", color.credits],
  ["accent.primary", color.accent.primary],
  ["accent.primaryHover", color.accent.primaryHover],
  ["accent.boardComputer", color.accent.boardComputer],
] as const;

const nonTextColors = [
  ["border.control", color.border.control],
  ["focus", color.focus],
] as const;

function pairs(foregrounds: readonly (readonly [string, string])[], min: number) {
  return foregrounds.flatMap(([fgName, fg]) =>
    surfaces.map(([bgName, bg]) => ({ fgName, fg, bgName, bg, min })),
  );
}

describe("contrastRatio", () => {
  it("is 21 for black on white", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 5);
  });

  it("is 1 for equal colors", () => {
    expect(contrastRatio("#3DD6D0", "#3DD6D0")).toBe(1);
  });
});

describe("theme contrast (WCAG 2.2 AA)", () => {
  it.each([
    ...pairs(textColors, 4.5),
    ...pairs(nonTextColors, 3),
    ...[
      ["accent.primary", color.accent.primary],
      ["accent.primaryHover", color.accent.primaryHover],
    ].map(([bgName, bg]) => ({
      fgName: "accent.onPrimary",
      fg: color.accent.onPrimary,
      bgName: bgName as string,
      bg: bg as string,
      min: 4.5,
    })),
  ])("$fgName on $bgName has at least $min:1", ({ fg, bg, min }) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(min);
  });
});
