---
title: "arc42 Kapitel 9: Architekturentscheidungen"
summary: Die Architekturentscheidungen stehen als ADRs im Entscheidungsregister; dieses Kapitel ordnet sie ein.
audience: [tech]
tags: [arc42, entscheidungen]
owner: Architektur
reviewed: 2026-11-14
---

# 9 Architekturentscheidungen

## Kurz gesagt

Alle Architekturentscheidungen stehen als ADR in [Entscheidungen](../decisions.md). Neue Entscheidungen legt man mit dem Wissenswerkzeug `decide` an; abgelöste bleiben mit Verweis auf die Nachfolgerin stehen.

## Übersicht

| ADR | Titel | Status | Kern der Entscheidung |
|---|---|---|---|
| ADR-01 | Desktop-App mit Electron und durchgehend TypeScript | gilt | Electron statt Web-App oder Tauri; Kern im Hauptprozess mit Queue, Cache, Routinen, Claude und GitHub; Geheimnisse über `safeStorage` |
| ADR-02 | Oberfläche einsprachig Deutsch | gilt | Alle UI-Texte deutsch mit den Glossarbegriffen; englische API-Namen nur im Code; kein i18n-Framework |
| ADR-03 | Art Direction: dunkles Sci-Fi-Theme „Tiefsee-Leviathan“ | gilt | Ein dunkles Theme mit festen Farb-Tokens; Space Grotesk, IBM Plex Sans und JetBrains Mono; eigene Icons im Konturstil; Bewegung nur für Zustände; WCAG 2.2 AA |
| ADR-04 | Lokaler Spielstand in SQLite über node:sqlite | gilt | `node:sqlite` hinter dem Port `SqlDatabase`; eine Datei `leviathan.db` mit `reset_date` in jedem Schlüssel; Reset-Prüfung über `GET /` alle 30 Minuten; Ereignisse nur mit geänderten Bereichen |

## Offene Entscheidungen

| Thema | Issue |
|---|---|
| Hosting der Releases und Code-Signing-Zertifikate | #40 |

## Bezüge

- [Kapitel 4: Lösungsstrategie](04-loesungsstrategie.md)
