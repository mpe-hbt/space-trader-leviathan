---
title: space-trader-leviathan
summary: Einstieg in das Projekt: Desktop-Client für SpaceTraders mit Grafik, Bedienbarkeit, Automatisierung und Board-Computer.
audience: [business, domain, tech]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# space-trader-leviathan

Desktop-Client für [SpaceTraders](https://spacetraders.io/), ein Mehrspieler-Weltraumspiel, das nur über eine HTTP-API gespielt wird. Schwerpunkte: schöne Grafik, einfache Bedienung, Automatisierung und ein Board-Computer auf Basis von Claude, der Fragen beantwortet, Aktionen nach Bestätigung ausführt und neue Aufgaben als GitHub-Issues vorschlägt.

Status: Planung. Die Roadmap steht in Issue #1, der Tech-Stack in ADR-01 ([Entscheidungen](docs/decisions.md)).

## Entwicklung

Voraussetzung ist Node.js in der Version aus `.nvmrc` (22). Die App besteht aus dem Kern (`src/main`), der IPC-Brücke (`src/preload`) und dem Renderer (`src/renderer`, React); gemeinsamer Code liegt in `packages/shared`, der SpaceTraders-Client in `packages/api-client`.

Der Kern schreibt seine Logs nach `<Benutzerdatenverzeichnis>/logs/leviathan.log` und speichert Anthropic-API-Key und GitHub-Token in `<Benutzerdatenverzeichnis>/secrets.json`, verschlüsselt über `safeStorage`; schließt man das Fenster, läuft die App im Tray weiter, und erst „Beenden“ im Tray-Menü beendet sie.

| Befehl | Zweck |
|---|---|
| `npm install` | Abhängigkeiten installieren, inklusive Electron |
| `npm run dev` | App lokal starten; Änderungen am Renderer erscheinen sofort, Änderungen an Kern oder Brücke starten die App neu |
| `npm test` | Unit-Tests mit Vitest ausführen |
| `npm run lint` | Code mit ESLint prüfen |
| `npm run typecheck` | Typen von Kern, Brücke, Paketen und Renderer prüfen |
| `npm run format` | Code mit Prettier formatieren (`npm run format:check` prüft nur) |
| `npm run build` | App nach `out/` bauen (`npm start` startet den Build) |
| `npm run api:generate` | Typen des SpaceTraders-Clients aus der gepinnten Spezifikation erzeugen |
| `npm run api:check` | Prüfen, ob die erzeugten Typen zur gepinnten Spezifikation passen (läuft auch in `npm test`) |
| `npm run api:update-spec` | Neue Spezifikation herunterladen (braucht Netz); danach `api:generate` ausführen |

Hinweis: `npm ci --ignore-scripts`, wie in der CI, lädt das Electron-Binary nicht. Lint, Typprüfung und Tests laufen damit; für `npm run dev` ist `npm install` nötig.

`npm run build` schreibt nach `out/`; der Ordner steht in `.gitignore` (#48).

## Dokumentation

| Bereich | Einstieg |
|---|---|
| Das Spiel SpaceTraders | [SpaceTraders im Überblick](docs/spacetraders/ueberblick.md) |
| Die SpaceTraders-API | [API-Überblick](docs/api/ueberblick.md) |
| Architektur (arc42) | [Kapitel 1: Einführung und Ziele](docs/arc42/01-einfuehrung-und-ziele.md) |
| Entscheidungen | [docs/decisions.md](docs/decisions.md) |
| Begriffe | [Glossar](docs/arc42/12-domaenensprache.md) |
| Arbeitsweise für Agenten | [AGENTS.md](AGENTS.md) |

## Mitarbeiten

Issues folgen dem Schema Ziel, Aufgaben, Akzeptanzkriterien, Abhängigkeiten. Begriffe kommen aus dem Glossar, neue Architekturentscheidungen werden als ADR festgehalten.
