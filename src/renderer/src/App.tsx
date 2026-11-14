import { useEffect, useState } from "react";
import type { AppInfo } from "@leviathan/shared";
import { SettingsDialog } from "./settings/SettingsDialog";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    window.leviathan.getAppInfo().then(setInfo, () => setInfo(null));
  }, []);

  return (
    <main>
      <h1>{info?.name ?? "…"}</h1>
      <p>Version {info?.version ?? "…"}</p>
      <button type="button" onClick={() => setSettingsOpen(true)}>
        Einstellungen
      </button>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
