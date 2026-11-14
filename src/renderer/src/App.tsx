import { useEffect, useState } from "react";
import type { AgentsStatus, AppInfo } from "@leviathan/shared";
import { AgentsDialog } from "./agents/AgentsDialog";
import { LOAD_AGENTS_FAILED_MESSAGE, agentNotice } from "./agents/messages";
import { SettingsDialog } from "./settings/SettingsDialog";
import "./App.css";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [agents, setAgents] = useState<AgentsStatus | null>(null);
  const [agentsError, setAgentsError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [agentsOpen, setAgentsOpen] = useState(false);

  useEffect(() => {
    window.leviathan.getAppInfo().then(setInfo, () => setInfo(null));
  }, []);

  useEffect(() => {
    let active = true;
    window.leviathan.getAgents().then(
      (status) => {
        if (active) setAgents(status);
      },
      () => {
        if (active) setAgentsError(LOAD_AGENTS_FAILED_MESSAGE);
      },
    );
    const unsubscribe = window.leviathan.onCoreEvent((event) => {
      if (event.type === "agents-changed") {
        setAgents(event.agents);
        setAgentsError(null);
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const notice = agents ? agentNotice(agents) : null;

  return (
    <main className="app">
      <h1 className="app__title">{info?.name ?? "…"}</h1>
      <p className="app__version">Version {info?.version ?? "…"}</p>
      {agents?.active && <p>Aktiver Agent: {agents.active}</p>}
      {agentsError && <p role="alert">{agentsError}</p>}
      {notice && (
        <p role="status">
          {notice}{" "}
          <button type="button" onClick={() => setAgentsOpen(true)}>
            Agents öffnen
          </button>
        </p>
      )}
      <button type="button" onClick={() => setAgentsOpen(true)}>
        Agents
      </button>{" "}
      <button type="button" onClick={() => setSettingsOpen(true)}>
        Einstellungen
      </button>
      <AgentsDialog open={agentsOpen} onClose={() => setAgentsOpen(false)} />
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
