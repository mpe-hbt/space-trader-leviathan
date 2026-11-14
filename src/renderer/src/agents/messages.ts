import type { AgentsStatus, AgentSummary, AgentTokenStatus } from "@leviathan/shared";

export const NO_AGENT_MESSAGE =
  "Noch kein Agent. Registriere einen neuen Agent oder füge einen Agent-Token ein.";
export const LOAD_AGENTS_FAILED_MESSAGE = "Die Agents konnten nicht geladen werden.";
export const REQUEST_FAILED_MESSAGE = "Die Anfrage ist fehlgeschlagen.";
export const STORED_ACCOUNT_TOKEN_HINT = "gespeicherter Account-Token wird verwendet";

const STATUS_LABELS: Record<AgentTokenStatus, string> = {
  valid: "gültig",
  expired: "abgelaufen",
  unchecked: "ungeprüft",
};

export function statusLabel(status: AgentTokenStatus): string {
  return STATUS_LABELS[status];
}

export function expiredAgentMessage(symbol: string): string {
  return `Der Agent-Token von ${symbol} ist abgelaufen, vermutlich nach einem Server-Reset. Registriere einen neuen Agent oder füge einen neuen Agent-Token ein.`;
}

export function activeAgent(status: AgentsStatus): AgentSummary | undefined {
  return status.agents.find((agent) => agent.symbol === status.active);
}

/** Note for the main window: no agent or an expired active agent; otherwise null. */
export function agentNotice(status: AgentsStatus): string | null {
  const agent = activeAgent(status);
  if (!agent) return NO_AGENT_MESSAGE;
  if (agent.status === "expired") return expiredAgentMessage(agent.symbol);
  return null;
}

export function formatCredits(credits: number): string {
  return new Intl.NumberFormat("de-DE").format(credits);
}
