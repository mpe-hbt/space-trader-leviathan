import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  ENCRYPTION_UNAVAILABLE_MESSAGE,
  type AgentResult,
  type AgentsStatus,
  type FactionOption,
} from "@leviathan/shared";
import {
  LOAD_AGENTS_FAILED_MESSAGE,
  REQUEST_FAILED_MESSAGE,
  STORED_ACCOUNT_TOKEN_HINT,
  formatCredits,
  statusLabel,
} from "./messages";

interface AgentsDialogProps {
  open: boolean;
  onClose(): void;
}

export function AgentsDialog({ open, onClose }: AgentsDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<AgentsStatus | null>(null);
  const [factions, setFactions] = useState<FactionOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [accountTokenEmpty, setAccountTokenEmpty] = useState(true);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;

    let active = true;
    window.leviathan.getAgents().then(
      (agents) => {
        if (!active) return;
        setStatus(agents);
        setError(null);
      },
      () => {
        if (active) setError(LOAD_AGENTS_FAILED_MESSAGE);
      },
    );
    window.leviathan.getFactions().then(
      (result) => {
        if (!active) return;
        if (result.ok) setFactions(result.factions);
        else setError(result.message);
      },
      () => {
        if (active) setError(REQUEST_FAILED_MESSAGE);
      },
    );
    const unsubscribe = window.leviathan.onCoreEvent((event) => {
      if (event.type === "agents-changed") setStatus(event.agents);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [open]);

  async function run(call: () => Promise<AgentResult>): Promise<boolean> {
    setBusy(true);
    try {
      const result = await call();
      if (result.ok) {
        setStatus(result.agents);
        setError(null);
        return true;
      }
      setError(result.message);
      return false;
    } catch {
      setError(REQUEST_FAILED_MESSAGE);
      return false;
    } finally {
      setBusy(false);
    }
  }

  function field(form: HTMLFormElement, name: string): HTMLInputElement | HTMLSelectElement | null {
    const element = form.elements.namedItem(name);
    return element instanceof HTMLInputElement || element instanceof HTMLSelectElement
      ? element
      : null;
  }

  async function onRegister(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const form = event.currentTarget;
    const accountToken = field(form, "accountToken");
    const symbol = field(form, "symbol");
    const faction = field(form, "faction");
    const tokenValue = accountToken?.value.trim() ?? "";
    if (accountToken) accountToken.value = "";
    setAccountTokenEmpty(true);
    const ok = await run(() =>
      window.leviathan.registerAgent({
        symbol: symbol?.value.trim() ?? "",
        faction: faction?.value ?? "",
        ...(tokenValue ? { accountToken: tokenValue } : {}),
      }),
    );
    if (ok && symbol) symbol.value = "";
  }

  async function onImport(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const input = field(event.currentTarget, "agentToken");
    const value = input?.value ?? "";
    if (input) input.value = "";
    await run(() => window.leviathan.importAgentToken(value));
  }

  const encryptionAvailable = status?.encryptionAvailable ?? true;
  const locked = busy || !encryptionAvailable;

  return (
    <dialog ref={dialogRef} onClose={onClose} aria-labelledby="agents-title">
      <h2 id="agents-title">Agents</h2>
      {error && <p role="alert">{error}</p>}
      {!encryptionAvailable && <p role="alert">{ENCRYPTION_UNAVAILABLE_MESSAGE}</p>}

      {status && status.agents.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Rufzeichen</th>
              <th>Fraktion</th>
              <th>Hauptquartier</th>
              <th>Credits</th>
              <th>Zustand</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {status.agents.map((agent) => {
              const isActive = agent.symbol === status.active;
              return (
                <tr key={agent.symbol} aria-current={isActive ? "true" : undefined}>
                  <td>
                    {agent.symbol}
                    {isActive && " (aktiv)"}
                  </td>
                  <td>{agent.faction}</td>
                  <td>{agent.headquarters}</td>
                  <td>{formatCredits(agent.credits)}</td>
                  <td>{statusLabel(agent.status)}</td>
                  <td>
                    <button
                      type="button"
                      disabled={busy || isActive}
                      onClick={() => void run(() => window.leviathan.selectAgent(agent.symbol))}
                    >
                      Aktivieren
                    </button>{" "}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => window.leviathan.checkAgents(agent.symbol))}
                    >
                      Prüfen
                    </button>{" "}
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void run(() => window.leviathan.removeAgent(agent.symbol))}
                    >
                      Entfernen
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {status && status.agents.length > 1 && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void run(() => window.leviathan.checkAgents())}
        >
          Alle prüfen
        </button>
      )}

      <h3>Neuen Agent registrieren</h3>
      <form onSubmit={(event) => void onRegister(event)}>
        <label htmlFor="register-account-token">Account-Token</label>{" "}
        <input
          id="register-account-token"
          name="accountToken"
          type="password"
          autoComplete="off"
          onChange={(event) => setAccountTokenEmpty(event.currentTarget.value.length === 0)}
        />{" "}
        {status?.accountTokenConfigured && accountTokenEmpty && (
          <span>{STORED_ACCOUNT_TOKEN_HINT}</span>
        )}
        <br />
        <label htmlFor="register-symbol">Rufzeichen</label>{" "}
        <input id="register-symbol" name="symbol" maxLength={14} autoComplete="off" required />
        <br />
        <label htmlFor="register-faction">Fraktion</label>{" "}
        <select id="register-faction" name="faction" required defaultValue="">
          <option value="" disabled>
            Fraktion wählen
          </option>
          {factions.map((faction) => (
            <option key={faction.symbol} value={faction.symbol} disabled={!faction.isRecruiting}>
              {faction.name}
              {faction.headquarters && ` (Hauptquartier ${faction.headquarters})`}
              {!faction.isRecruiting && " – rekrutiert nicht"}
            </option>
          ))}
        </select>
        <br />
        <button type="submit" disabled={locked}>
          Registrieren
        </button>
      </form>

      <h3>Agent-Token einfügen</h3>
      <form onSubmit={(event) => void onImport(event)}>
        <label htmlFor="agent-token">Agent-Token</label>{" "}
        <input id="agent-token" name="agentToken" type="password" autoComplete="off" required />{" "}
        <button type="submit" disabled={locked}>
          Agent-Token einfügen
        </button>
      </form>

      <form method="dialog">
        <button type="submit">Schließen</button>
      </form>
    </dialog>
  );
}
