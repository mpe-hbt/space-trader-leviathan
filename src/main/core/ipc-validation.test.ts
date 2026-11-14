import { describe, expect, it } from "vitest";
import { MAX_SECRET_LENGTH, parseSecretName, parseSecretValue } from "./ipc-validation";

describe("parseSecretName", () => {
  it("accepts the known secret names", () => {
    expect(parseSecretName("anthropicApiKey")).toBe("anthropicApiKey");
    expect(parseSecretName("githubToken")).toBe("githubToken");
  });

  it.each(["agentToken", "", "__proto__", 1, null, undefined, {}])("rejects %s", (input) => {
    expect(parseSecretName(input)).toBeUndefined();
  });
});

describe("parseSecretValue", () => {
  it("accepts and trims a valid value", () => {
    expect(parseSecretValue("  sk-ant-123  ")).toBe("sk-ant-123");
  });

  it("accepts a value of maximum length", () => {
    expect(parseSecretValue("a".repeat(MAX_SECRET_LENGTH))).toHaveLength(MAX_SECRET_LENGTH);
  });

  it.each([
    ["empty", ""],
    ["blank", "   "],
    ["too long", "a".repeat(MAX_SECRET_LENGTH + 1)],
    ["inner space", "abc def"],
    ["tab", "abc\tdef"],
    ["newline", "abc\ndef"],
    ["control character", "abc\u0007def"],
    ["number", 42],
    ["object", { value: "x" }],
    ["undefined", undefined],
  ])("rejects %s", (_label, input) => {
    expect(parseSecretValue(input)).toBeUndefined();
  });
});
