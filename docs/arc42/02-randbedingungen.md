---
title: "arc42 Kapitel 2: Randbedingungen"
summary: Vorgaben, die die Architektur einschränken, vor allem die Regeln der SpaceTraders-API und die Entscheidung für Electron mit TypeScript.
audience: [tech, domain]
tags: [arc42]
owner: Architektur
reviewed: 2026-11-13
---

# 2 Randbedingungen

## Kurz gesagt

Die Architektur wird vor allem von außen bestimmt: Die SpaceTraders-API erlaubt nur 2 Anfragen pro Sekunde, liefert höchstens 20 Einträge pro Seite, kennt keine Push-Benachrichtigungen und wird alle 7 bis 14 Tage zurückgesetzt. Technisch ist eine Electron-Desktop-App in TypeScript festgelegt (ADR-01).

## Technische Randbedingungen

| Randbedingung | Folge |
|---|---|
| [Rate-Limit](../api/rate-limits.md) 2/s, Burst 30 in 60 s, je IP und Account | zentrale [Request-Queue](../glossary/Request-Queue.md), Prioritäten, Cache statt wiederholter Abfragen |
| Seitengröße höchstens 20 | große Datenmengen (Systeme, Wegpunkte) nur schrittweise und bei Bedarf laden |
| keine Webhooks oder Websockets | Zustände aus Ankunfts- und Cooldown-Zeiten berechnen, gezielt nachfragen |
| [Server-Reset](../spacetraders/server-reset.md) alle 7 oder 14 Tage | Daten je Reset trennen, Tokens erneuern |
| Preise nur mit Schiff vor Ort | Marktdaten mit Zeitstempel speichern, Sonden einsetzen |
| API im Alpha-Stadium, Änderungen per Changelog | Spezifikation pinnen, Codegen aus OpenAPI, Fehler tolerant behandeln |
| Electron, TypeScript, React, PixiJS, SQLite (ADR-01) | siehe [Kapitel 4](04-loesungsstrategie.md) |
| Claude über das offizielle SDK, eigener API-Key des Spielers | Board-Computer nur mit Key; Kosten trägt der Spieler |

## Organisatorische Randbedingungen

- Aufgaben werden als GitHub-Issues mit Ziel, Aufgaben, Akzeptanzkriterien und Abhängigkeiten geführt; die Roadmap ist Issue #1.
- Architekturentscheidungen stehen als ADR in [Entscheidungen](../decisions.md).
- Begriffe kommen aus dem [Glossar](12-domaenensprache.md).
- Eigene Gestaltung, keine Übernahme von Grafiken oder Namen anderer Spiele.

## Bezüge

- [Kapitel 3: Kontextabgrenzung](03-kontextabgrenzung.md), [Kapitel 11: Risiken](11-risiken.md)
