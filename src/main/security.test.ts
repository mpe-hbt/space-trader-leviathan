import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./security";

describe("contentSecurityPolicy", () => {
  const csp = contentSecurityPolicy("production");

  it("allows only own sources by default", () => {
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it("allows neither inline code nor eval", () => {
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows no foreign host", () => {
    expect(csp).not.toMatch(/https?:|wss?:|\*/);
  });

  it("relaxes the development policy only for HMR", () => {
    const dev = contentSecurityPolicy("development");
    expect(dev).not.toContain("unsafe-eval");
    expect(dev).toContain("ws://localhost:*");
  });
});
