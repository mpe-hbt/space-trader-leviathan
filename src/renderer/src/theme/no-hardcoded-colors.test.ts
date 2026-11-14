import { readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const rendererRoot = resolve(import.meta.dirname, "../..");
const themeDir = resolve(import.meta.dirname);
const extensions = new Set([".ts", ".tsx", ".css", ".html"]);

const patterns = [/#(?:[0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})\b/i, /\brgba?\(/i, /\bhsla?\(/i];

/** Returns the 1-based line numbers that contain a fixed color value (hex, rgb(, hsl(). */
function findHardcodedColors(source: string): number[] {
  return source
    .split(/\r?\n/)
    .flatMap((line, index) => (patterns.some((p) => p.test(line)) ? [index + 1] : []));
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === themeDir ? [] : sourceFiles(path);
    return extensions.has(extname(entry.name)) ? [path] : [];
  });
}

describe("findHardcodedColors", () => {
  it.each([
    "#0B0F17",
    "color: #fff;",
    "#0b0f17cc",
    "rgb(0 0 0)",
    "rgba(0, 0, 0, 0.5)",
    "hsl(1 2% 3%)",
    "HSLA(1, 2%, 3%, 1)",
  ])("finds %s", (sample) => {
    expect(findHardcodedColors(sample)).toEqual([1]);
  });

  it.each(["#root", 'getElementById("root")', "var(--stl-bg-base)", "#12345", "issue #27"])(
    "ignores %s",
    (sample) => {
      expect(findHardcodedColors(sample)).toEqual([]);
    },
  );
});

describe("renderer code outside theme/", () => {
  it("contains no fixed color values", () => {
    const files = sourceFiles(rendererRoot);
    expect(files.length).toBeGreaterThan(0);
    const findings = files.flatMap((file) =>
      findHardcodedColors(readFileSync(file, "utf8")).map(
        (line) => `${relative(rendererRoot, file)}:${line}`,
      ),
    );
    expect(findings).toEqual([]);
  });
});
