import { useEffect, useState } from "react";
import type { AppInfo } from "@leviathan/shared";
import { SettingsDialog } from "./settings/SettingsDialog";
import "./App.css";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    window.leviathan.getAppInfo().then(setInfo, () => setInfo(null));
  }, []);

  return (
    <main className="app">
      <h1 className="app__title">{info?.name ?? "…"}</h1>
      <p className="app__version">Version {info?.version ?? "…"}</p>
      <button type="button" onClick={() => setSettingsOpen(true)}>
        Einstellungen
      </button>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
