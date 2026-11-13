import { describe, expect, it } from "vitest";
import { name } from "./index.js";

describe("index", () => {
  it("exports the project name", () => {
    expect(name).toBe("space-trader-leviathan");
  });
});
