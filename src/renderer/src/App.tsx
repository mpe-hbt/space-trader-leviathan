import { useEffect, useState } from "react";
import type { AppInfo, GameStateSnapshot } from "@leviathan/shared";
import { SettingsDialog } from "./settings/SettingsDialog";

function gameStateLine(state: GameStateSnapshot | null): string {
  if (!state?.resetDate) return "Noch kein Spielstand";
  if (!state.agent) return `Spielstand vom ${state.resetDate}: noch kein Agent`;
  return `Spielstand vom ${state.resetDate}: Agent ${state.agent.symbol}, ${state.agent.credits} Credits, ${state.ships.length} Schiffe`;
}

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [gameState, setGameState] = useState<GameStateSnapshot | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    window.leviathan.getAppInfo().then(setInfo, () => setInfo(null));
  }, []);

  useEffect(() => {
    const load = () => {
      window.leviathan.getGameState().then(setGameState, () => setGameState(null));
    };
    load();
    return window.leviathan.onCoreEvent((event) => {
      if (event.type === "game-state-changed") load();
    });
  }, []);

  return (
    <main>
      <h1>{info?.name ?? "…"}</h1>
      <p>Version {info?.version ?? "…"}</p>
      <p>{gameStateLine(gameState)}</p>
      <button type="button" onClick={() => setSettingsOpen(true)}>
        Einstellungen
      </button>
      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </main>
  );
}
