import { useEffect, useState } from "react";
import type { AppInfo } from "@leviathan/shared";

export function App() {
  const [info, setInfo] = useState<AppInfo | null>(null);

  useEffect(() => {
    void window.leviathan.getAppInfo().then(setInfo);
  }, []);

  return (
    <main>
      <h1>{info?.name ?? "…"}</h1>
      <p>Version {info?.version ?? "…"}</p>
    </main>
  );
}
