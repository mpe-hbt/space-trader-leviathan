import { useEffect, useState } from "react";
import type { AppInfo } from "@leviathan/shared";
import "./App.css";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void window.leviathan.getAppInfo().then(setInfo);
  }, []);

  return (
    <main className="app">
      <h1 className="app__title">{info?.name ?? "…"}</h1>
      <p className="app__version">Version {info?.version ?? "…"}</p>
    </main>
  );
}
