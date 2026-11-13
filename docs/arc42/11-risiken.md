---
title: "arc42 Kapitel 11: Risiken und technische Schulden"
summary: Bekannte Risiken des Clients, vor allem durch das enge Rate-Limit, die Alpha-API, Prompt-Injection und Kosten des Board-Computers, jeweils mit Gegenmaßnahme.
audience: [tech, business]
tags: [arc42, risiken]
owner: Architektur
reviewed: 2026-11-13
---

# 11 Risiken und technische Schulden

## Kurz gesagt

Die größten Risiken kommen von außen: Das Rate-Limit begrenzt, wie viel Automatisierung möglich ist, und das Laden großer Datenmengen dauert lange. Die API ist im Alpha-Stadium und ändert sich. Der Board-Computer bringt Kosten und das Risiko von Prompt-Injection mit. Für jedes Risiko gibt es eine Gegenmaßnahme.

## Risiken (u. a. Ladedauer für Systeme und Wegpunkte)

| Nr. | Risiko | Auswirkung | Gegenmaßnahme |
|---|---|---|---|
| R1 | [Rate-Limit](../api/rate-limits.md) von 2 Anfragen pro Sekunde für alle Schiffe zusammen | Routinen vieler Schiffe stauen sich; Oberfläche wirkt träge | Prioritäten in der Queue, Antworten direkt in den Cache, Routinen ohne Polling, Durchsatz je Routine messen |
| R2 | Ladeaufwand: rund 425 Anfragen für alle Systeme, rund 10.000 für alle Wegpunkte (höchstens 20 je Seite) | Erststart nach Reset dauert lange | Systeme im Hintergrund laden, Wegpunkte nur für benötigte Systeme; Fortschritt anzeigen; geladene Daten je Reset behalten |
| R3 | API im Alpha-Stadium, Änderungen auch mit Bruch (z. B. Februar 2025: neue Antwort beim Flugmodus) | Fehler nach einem Update der API | Spezifikation pinnen, Codegen in der CI prüfen, Changelog beobachten, tolerante Verarbeitung |
| R4 | [Server-Reset](../spacetraders/server-reset.md) alle 7 oder 14 Tage | Routinen laufen ins Leere, Tokens ungültig | Reset-Erkennung, Routinen stoppen, geführter Neustart |
| R5 | Prompt-Injection über Namen anderer Spieler | unerwünschte Aktionen oder Issues | Bestätigungspflicht, Daten-Kennzeichnung, Audit-Log, Tests (#26) |
| R6 | Kosten der Claude-Nutzung | unerwartete Rechnung für den Spieler | Tageslimit, Verbrauchsanzeige, Prompt-Caching (#21, #41) |
| R7 | Automatisierung nur bei laufender App | weniger Ertrag als bei Server-Clients | Tray-Modus, Nachholen nach Neustart; Kern ohne Electron-Abhängigkeit für späteren Serverbetrieb |
| R8 | Code-Signing für macOS und Windows | Warnungen bei der Installation | Zertifikate früh beschaffen (#40) |

## Technische Schulden

Noch keine; es gibt noch keinen Code. Neue Schulden werden hier mit Issue-Verweis eingetragen.

## Bezüge

- [Kapitel 2: Randbedingungen](02-randbedingungen.md), [Kapitel 10: Qualitätsanforderungen](10-qualitaetsanforderungen.md)
