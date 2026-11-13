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
