import { describe, expect, it } from "vitest";
import type { AgentsStatus } from "@leviathan/shared";
import {
  NO_AGENT_MESSAGE,
  activeAgent,
  agentNotice,
  expiredAgentMessage,
  formatCredits,
  statusLabel,
} from "./messages";

function status(overrides: Partial<AgentsStatus> = {}): AgentsStatus {
  return {
    encryptionAvailable: true,
    accountTokenConfigured: false,
    active: "LEVI",
    agents: [
      { symbol: "LEVI", faction: "COSMIC", headquarters: "X1-A", credits: 175000, status: "valid" },
    ],
    ...overrides,
  };
}

describe("agent messages", () => {
  it("shows no note for a valid active agent", () => {
    expect(agentNotice(status())).toBeNull();
    expect(activeAgent(status())?.symbol).toBe("LEVI");
  });

  it("asks for an agent when none is active", () => {
    expect(agentNotice(status({ active: null }))).toBe(NO_AGENT_MESSAGE);
    expect(agentNotice(status({ active: null, agents: [] }))).toBe(NO_AGENT_MESSAGE);
    expect(NO_AGENT_MESSAGE).toContain("Agent-Token");
  });

  it("explains an expired agent", () => {
    const expired = status({
      agents: [
        { symbol: "LEVI", faction: "COSMIC", headquarters: "X1-A", credits: 0, status: "expired" },
      ],
    });
    expect(agentNotice(expired)).toBe(expiredAgentMessage("LEVI"));
    expect(expiredAgentMessage("LEVI")).toContain("Server-Reset");
    expect(expiredAgentMessage("LEVI")).toContain("LEVI");
  });

  it("names the token states in German", () => {
    expect(statusLabel("valid")).toBe("gültig");
    expect(statusLabel("expired")).toBe("abgelaufen");
    expect(statusLabel("unchecked")).toBe("ungeprüft");
  });

  it("formats credits", () => {
    expect(formatCredits(175000)).toBe("175.000");
  });

  it("never says import", () => {
    const texts = [NO_AGENT_MESSAGE, expiredAgentMessage("LEVI")].join(" ");
    expect(texts).not.toMatch(/import/i);
  });
});
