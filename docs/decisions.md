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

## ADR-03: Art Direction: dunkles Sci-Fi-Theme „Tiefsee-Leviathan“

- **Status:** gilt (#27)
- **Kontext:** Ziel 1 des Clients ist schöne Grafik mit eigenem Sci-Fi-Look ([Kapitel 1](arc42/01-einfuehrung-und-ziele.md)), Ziel 3 einfache Bedienung. Die Gestaltung muss eigenständig sein und darf nichts aus anderen Spielen übernehmen ([Kapitel 2](arc42/02-randbedingungen.md)). Der [Renderer](glossary/Renderer.md) läuft mit strikter CSP ohne Remote-Inhalte (ADR-01), die Oberfläche ist deutsch (ADR-02). Issue #27 bündelte die Stilrichtung mit der Umsetzung; die Stilrichtung braucht eine feste Entscheidung, damit Design-Tokens, Komponenten und Icons ohne weitere Geschmacksfragen entstehen.
- **Entscheidung:** Der Client hat genau ein dunkles Theme mit dem Leitbild „Tiefsee-Leviathan“: Das All ist eine ruhige, dunkle Tiefe, Informationen leuchten darin wie Instrumente eines Cockpits. Flächen sind flach (keine Texturen, keine Glas- oder Blur-Effekte, keine Verläufe auf Steuerelementen); Leuchten gibt es nur für Fokus, Auswahl und laufende Vorgänge.
  - **Farben:** Tokens mit festen Werten. Statusfarben werden nie allein verwendet, immer mit Icon oder Text. Getönte Hintergründe sind die Statusfarbe mit 16 % Deckkraft über der Fläche; Text darauf ist `text.primary`.

    | Token | Wert | Verwendung |
    |---|---|---|
    | `bg.base` | `#0B0F17` | App-Hintergrund, Hintergrund der Karten |
    | `bg.surface1` | `#121826` | Seitenleiste, Panels |
    | `bg.surface2` | `#1A2233` | Karten (Kacheln), Tabellenzeilen, Eingabefelder |
    | `bg.surface3` | `#232D42` | Hover, ausgewählte Zeile, Tooltip |
    | `border.subtle` | `#2C3850` | Trennlinien (nur dekorativ) |
    | `border.control` | `#64779A` | Rahmen von Eingaben und Steuerelementen |
    | `text.primary` | `#E6EBF5` | Fließtext, Werte |
    | `text.secondary` | `#A7B2C6` | Beschriftungen, Tabellenköpfe |
    | `text.muted` | `#8C99B2` | Hinweise, Zeitstempel, Datenalter |
    | `accent.primary` | `#3DD6D0` | Primäraktion, Auswahl, Links, eigene Schiffe |
    | `accent.primaryHover` | `#6BE3DE` | Hover der Primäraktion |
    | `accent.onPrimary` | `#0B0F17` | Text und Icons auf Akzentflächen |
    | `accent.boardComputer` | `#B69CFF` | Board-Computer (Chat, Vorschläge) |
    | `focus` | `#7FEFEA` | Fokusring |
    | `credits` | `#F2B544` | Credits und Preise |
    | `status.success` | `#4FD18B` | Erfolg, Gewinn, angedockt/bereit |
    | `status.warning` | `#F59E3D` | Warnung, wenig Treibstoff, Cooldown |
    | `status.danger` | `#FF7A7A` | Fehler, Verlust, destruktive Aktion |
    | `status.info` | `#6DB3FF` | Hinweis, unterwegs |

  - **Typografie:** drei Schriften unter SIL Open Font License 1.1, lokal gebündelt über die `@fontsource`-Pakete (keine Remote-Inhalte): **Space Grotesk** (500, 600) für Überschriften und Navigation, **IBM Plex Sans** (400, 500, 600) für Fließtext und Steuerelemente, **JetBrains Mono** (400, 500) für Symbole, Rufzeichen, Koordinaten, Credits und alle Zahlen in Tabellen (`font-variant-numeric: tabular-nums`). Fallbacks `system-ui, sans-serif` bzw. `ui-monospace, monospace`. Skala in px: 12 (Hinweis), 14 (Basis), 16 (Hervorhebung), 20 (H3), 24 (H2), 32 (H1); Zeilenhöhe 1,5 für Text, 1,25 für Überschriften. Überschriften nie in Versalien; Versalien mit 0,08 em Laufweite nur für Abschnittsbeschriftungen in 12 px.
  - **Abstände, Radien, Ebenen:** 4-px-Raster mit den Stufen 4, 8, 12, 16, 24, 32, 48. Radien 2 px (Badges), 4 px (Buttons, Eingaben), 8 px (Karten, Dialoge), Fortschrittsringe rund. Linien 1 px. Ebenen entstehen über die Flächenfarben `bg.surface1` bis `bg.surface3`, nicht über Schatten; einzige Ausnahme ist der Dialog (`0 8px 32px rgb(0 0 0 / 0.5)`). Aktive oder ausgewählte Panels tragen oben eine 2-px-Linie in `accent.primary`.
  - **Icons:** Allgemeine UI-Icons aus Lucide (ISC-Lizenz) mit Strichstärke 1,5. Fachliche Icons (Schiffsrollen, Typen von Wegpunkten, Gruppen von Handelswaren) sind eigene SVGs im gleichen Stil: 24-px-Raster mit 2 px Innenabstand, auch in 16 px lesbar, Kontur mit 1,5 px Strich, runde Enden und Ecken, keine Flächenfüllung außer einem Akzentpunkt, Farbe immer `currentColor`. Handelswaren bekommen ein Icon je Warengruppe, nicht je Ware.
  - **Bewegung:** Bewegung zeigt Zustand (Ankunft, Cooldown, Fortschritt, neue Daten), nie Dekoration. Dauern: 120 ms (Hover, Fokus), 200 ms (Ein- und Ausblenden, Tooltips, Panels), 320 ms (Dialoge, Ansichtswechsel). Easing beim Hereinkommen `cubic-bezier(0.2, 0, 0, 1)`, beim Verlassen `cubic-bezier(0.4, 0, 1, 1)`. Endlos-Animationen nur bei laufenden Vorgängen (Fortschrittsring, Schiff unterwegs). Bei `prefers-reduced-motion: reduce` sind alle Dauern 0 und Pulsieren aus; Fortschritt bleibt statisch sichtbar.
  - **Barrierefreiheit:** WCAG 2.2 Stufe AA. Text mindestens 4,5:1, großer Text, Steuerelement-Rahmen und Fokusring mindestens 3:1 gegen jede Fläche `bg.base` bis `bg.surface3`. Fokusring 2 px `focus` mit 2 px Abstand, bei Tastaturbedienung immer sichtbar (`:focus-visible`). Klickziele mindestens 24 × 24 px.
  - **Technik:** Die Tokens sind eine einzige Quelle in TypeScript im Renderer, aus der CSS Custom Properties mit dem Präfix `--stl-` entstehen. Komponenten und Ansichten nutzen nur Tokens, keine festen Farb-, Abstands- oder Schriftwerte.
- **Konsequenzen:**
  - Kein heller Modus; ein zweites Theme braucht eine neue ADR.
  - Neue Abhängigkeiten im Renderer: `@fontsource/space-grotesk`, `@fontsource/ibm-plex-sans`, `@fontsource/jetbrains-mono`, `lucide-react`.
  - Ein automatisierter Kontrasttest (vitest) prüft alle Text-Hintergrund-Paare aus der Tabelle; eine neue Farbe kommt nur mit bestandenem Test hinzu.
  - Die Karten (#28, #29) und Animationen (#30) übernehmen Farben und Bewegungsregeln aus diesen Tokens.
  - Umsetzung in eigenen Issues: Design-Tokens und Theme, Komponentenbibliothek mit Storybook, fachliche Icons (siehe #27).
