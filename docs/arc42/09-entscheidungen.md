---
title: "arc42 Kapitel 9: Architekturentscheidungen"
summary: Die Architekturentscheidungen stehen als ADRs im Entscheidungsregister; dieses Kapitel ordnet sie ein.
audience: [tech]
tags: [arc42, entscheidungen]
owner: Architektur
reviewed: 2026-11-13
---

# 9 Architekturentscheidungen

## Kurz gesagt

Alle Architekturentscheidungen stehen als ADR in [Entscheidungen](../decisions.md). Neue Entscheidungen legt man mit dem Wissenswerkzeug `decide` an; abgelöste bleiben mit Verweis auf die Nachfolgerin stehen.

## Übersicht

| ADR | Titel | Status | Kern der Entscheidung |
|---|---|---|---|
| ADR-01 | Desktop-App mit Electron und durchgehend TypeScript | gilt | Electron statt Web-App oder Tauri; Kern im Hauptprozess mit Queue, Cache, Routinen, Claude und GitHub; Geheimnisse über `safeStorage` |

## Offene Entscheidungen

| Thema | Issue |
|---|---|
| Sprache der Oberfläche (Deutsch, Englisch oder beides) | #4 |
| Hosting der Releases und Code-Signing-Zertifikate | #40 |

## Bezüge

- [Kapitel 4: Lösungsstrategie](04-loesungsstrategie.md)
