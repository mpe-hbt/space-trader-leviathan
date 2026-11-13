---
title: Erster Spielablauf
summary: Der typische Einstieg eines neuen Agents vom Registrieren über den Kauf einer Bergbaudrohne bis zum ersten erfüllten Auftrag.
audience: [domain, tech]
tags: [spacetraders, einstieg, onboarding]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Erster Spielablauf

## Kurz gesagt

Die offizielle Schnellstart-Anleitung führt in etwa fünf Minuten durch die Grundaktionen. Der Ablauf ist die Vorlage für das Onboarding des Clients (Issue #11) und für die erste Abbau-Routine. Ziel ist der Startauftrag: Erz abbauen und bei der Fraktion abliefern.

## Ablauf und Regeln

1. **Account anlegen** auf my.spacetraders.io.
2. **Agent registrieren:** [Rufzeichen](../glossary/Rufzeichen.md) und Startfraktion wählen. Ergebnis: [Agent-Token](../glossary/Agent-Token.md), Kommandoschiff, Sonde, 175.000 Credits, Startauftrag.
3. **Agent und Startort ansehen:** Hauptquartier, System, Wegpunkt mit Merkmalen.
4. **Startauftrag ansehen und annehmen:** Vorschuss erhalten. Ist er abgelaufen, mit dem Kommandoschiff einen neuen aushandeln.
5. **Werft finden:** Wegpunkte des Systems nach dem Merkmal SHIPYARD filtern. Die Startsonde liegt dort, deshalb sind Preise sichtbar.
6. **Bergbaudrohne kaufen** (SHIP_MINING_DRONE).
7. **Zum Asteroiden fliegen:** Wegpunkte nach Typ ENGINEERED_ASTEROID filtern, Drohne in den Orbit, navigieren. Drohnen sind langsam.
8. **Tanken:** andocken, tanken, zurück in den Orbit.
9. **Abbauen**, bis die Fracht voll ist; Cooldown beachten. Nicht benötigtes Erz abwerfen oder später verkaufen.
10. **Überschuss verkaufen:** Markt am Asteroiden ansehen, andocken, verkaufen.
11. **Liefern:** zum Lieferwegpunkt fliegen, andocken, Auftragsware liefern. Wiederholen, bis die Menge erreicht ist.
12. **Auftrag erfüllen** und Restzahlung erhalten.

## Für die Technik

| Schritt | Endpunkt |
|---|---|
| 2 | `POST /register` mit `symbol`, `faction` (Account-Token) |
| 3 | `GET /my/agent`, `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}` |
| 4 | `GET /my/contracts`, `POST /my/contracts/{contractId}/accept` |
| 5 | `GET /systems/{systemSymbol}/waypoints?traits=SHIPYARD`, `GET …/shipyard` |
| 6 | `POST /my/ships` |
| 7 | `GET /systems/{systemSymbol}/waypoints?type=ENGINEERED_ASTEROID`, `POST …/orbit`, `POST …/navigate` |
| 8 | `POST …/dock`, `POST …/refuel` |
| 9 | `POST …/extract`, `POST …/jettison`, `GET …/cargo` |
| 10 | `GET …/market`, `POST …/sell` |
| 11 und 12 | `POST /my/contracts/{contractId}/deliver`, `/fulfill` |

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/quickstart/new-game bis https://docs.spacetraders.io/quickstart/last-steps
- [Agents, Fraktionen und Aufträge](agenten-und-fraktionen.md), [Abbau](abbau.md), [Märkte und Handel](maerkte.md)
