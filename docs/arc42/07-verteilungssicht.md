---
title: "arc42 Kapitel 7: Verteilungssicht"
summary: Der Client wird als installierbare Desktop-App für Windows, macOS und Linux ausgeliefert und läuft vollständig auf dem Rechner des Spielers.
audience: [tech, business]
tags: [arc42, betrieb]
owner: Architektur
reviewed: 2026-11-13
---

# 7 Verteilungssicht

## Kurz gesagt

Es gibt keinen eigenen Server. Die App läuft auf dem Rechner des Spielers und speichert ihre Daten im Benutzerdatenverzeichnis. Routinen arbeiten, solange die App läuft, auch mit geschlossenem Fenster im Tray. Ein Dauerbetrieb rund um die Uhr setzt einen durchlaufenden Rechner voraus.

## Infrastruktur

```mermaid
flowchart LR
  subgraph PC[Rechner des Spielers]
    App[Electron-App: Renderer und Kern]
    DB[(SQLite im Benutzerdatenverzeichnis)]
    Keys[(Schlüsselspeicher des Betriebssystems)]
    App --- DB
    App --- Keys
  end
  App -->|HTTPS| ST[SpaceTraders-API]
  App -->|HTTPS| AN[Anthropic-API]
  App -->|HTTPS| GH[GitHub-API]
  Rel[GitHub Releases] -->|Auto-Update| App
```

| Element | Inhalt |
|---|---|
| Installationspaket | Windows (NSIS), macOS (dmg, signiert und notarisiert), Linux (AppImage), erzeugt mit `electron-builder` (Issue #40) |
| Benutzerdatenverzeichnis | SQLite-Cache, Logs, Einstellungen; Export und Import als Backup |
| Schlüsselspeicher | Tokens und Keys, verschlüsselt über `safeStorage` |
| GitHub Releases | Versionen und Auto-Update über `electron-updater` |

## Bezüge

- ADR-01 in [Entscheidungen](../decisions.md), [Kapitel 11: Risiken](11-risiken.md)
