---
title: Entscheidungen
summary: Register der Architekturentscheidungen (ADRs) des Clients.
audience: [tech]
owner: Architektur
reviewed: 2026-11-14
---

# Decisions

Each decision is a section `## ADR-nn: Title` with **Status**, **Context**, **Decision** and **Consequences**; add new ones via `decide public`.

## ADR-01: Desktop-App mit Electron und durchgehend TypeScript

- **Status:** gilt (#2)
- **Kontext:** Der Client soll schöne 2D-Grafik mit vielen Objekten (Galaxiekarte), einfache Bedienung und Automatisierung bieten. Dazu kommt ein Board-Computer, der Claude über die Anthropic-API nutzt. Geheimnisse (Agent-Token, Account-Token, Anthropic-API-Key, GitHub-Token) dürfen nie in ungeschütztem Code oder Speicher liegen. Geprüft wurden drei Varianten:
  - Web-App mit eigenem Backend: braucht Hosting und Betrieb.
  - Tauri: kleine Installationsdatei, aber der Kern ist in Rust geschrieben, und für Rust gibt es kein offizielles Anthropic-SDK.
  - Electron: durchgehend TypeScript, und das offizielle Anthropic-SDK läuft im Node-Hauptprozess.
- **Entscheidung:** Der Client ist eine Desktop-App auf Basis von Electron, durchgehend in TypeScript.
  - **Hauptprozess (Kern):** Request-Queue für die SpaceTraders-API mit Rate-Limit, lokaler Cache in SQLite, Automations-Engine, Claude-Anbindung über `@anthropic-ai/sdk`, GitHub-API für die Issue-Anlage.
  - **Renderer (Oberfläche):** React mit Vite (`electron-vite`), PixiJS (WebGL) für die Karten, TanStack Query für den Datenzustand.
  - **Verbindung:** Renderer und Hauptprozess sprechen nur über eine typisierte IPC-Schnittstelle, die per `contextBridge` im Preload-Skript bereitgestellt wird. Dabei gilt `contextIsolation: true`, `nodeIntegration: false` und `sandbox: true`.
  - **Geheimnisse:** Sie liegen im Schlüsselspeicher des Betriebssystems, verschlüsselt über Electron `safeStorage`. Jeder Spieler hinterlegt seinen eigenen Anthropic-API-Key.
  - **Routinen:** Sie laufen weiter, wenn das Fenster geschlossen ist (Tray-Modus). Beim Beenden der App werden sie pausiert und beim nächsten Start fortgesetzt.
  - **Auslieferung:** `electron-builder` für Windows, macOS und Linux. Updates kommen über GitHub Releases.
- **Konsequenzen:**
  - Kein Server-Hosting nötig. Statt Deployment gibt es Packaging, Code-Signing und Releases.
  - Automatisierung läuft nur, solange die App (mindestens im Tray) läuft. Ein 24/7-Betrieb setzt einen dauerhaft laufenden Rechner voraus.
  - Jeder Spieler bezahlt seine Claude-Nutzung über den eigenen API-Key. Ohne Key ist der Board-Computer ausgeblendet.
  - Größere Installationsdatei (ca. 100 MB) und mehr Arbeitsspeicher als bei Tauri.
  - Electron-Sicherheitsrichtlinien sind Pflicht: keine Remote-Inhalte im Renderer, strikte CSP, IPC-Eingaben prüfen.
  - Ein späterer Web- oder Server-Betrieb bleibt möglich, weil der Kern keine Electron-APIs außerhalb einer dünnen Adapterschicht nutzt.

## ADR-02: Oberfläche einsprachig Deutsch

- **Status:** gilt (#4)
- **Kontext:** Das Glossar ist deutsch, mit englischen Code-Namen und Aliasen aus der SpaceTraders-API. Issue #4 hat offen gelassen, ob die Oberfläche deutsch, englisch oder zweisprachig wird. Bevor die ersten fachlichen UI-Texte entstehen, braucht es dazu eine feste Regel.
- **Entscheidung:** Die Oberfläche ist einsprachig Deutsch.
  - **UI-Texte:** Alle Texte der Oberfläche sind deutsch und nutzen den Glossarbegriff, also den Titel der Notiz in `docs/glossary/`, nicht den englischen Alias (zum Beispiel „Schiff“, nicht „Ship“).
  - **Code:** Englische API-Namen stehen nur im Code; die Notiz nennt sie unter „code“.
  - **Kein i18n-Framework:** Es gibt keine Übersetzungsschicht. `lang="de"` in `src/renderer/index.html` bleibt.
- **Konsequenzen:**
  - Keine Übersetzungsdateien und kein Sprachumschalter.
  - Eine englische Oberfläche gibt es später nur mit einer neuen ADR, die diese ablöst.
  - Das Glossar bleibt die Quelle der Wörter in der Oberfläche; ein neuer Begriff kommt zuerst ins Glossar, dann in die UI.
