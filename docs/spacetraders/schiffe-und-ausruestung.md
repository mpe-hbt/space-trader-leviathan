---
title: Schiffe und Ausrüstung
summary: Ein Schiff besteht aus festem Rahmen, Reaktor und Triebwerk sowie austauschbaren Modulen und Mounts, die seine Fähigkeiten bestimmen; gekauft und umgerüstet wird in der Werft.
audience: [domain, tech]
tags: [spacetraders, schiff, werft]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Schiffe und Ausrüstung

## Kurz gesagt

[Schiffe](../glossary/Schiff.md) sind das Werkzeug für fast alles im Spiel. Was ein Schiff kann, hängt von seinen Bauteilen ab: [Rahmen](../glossary/Rahmen.md), [Reaktor](../glossary/Reaktor.md) und [Triebwerk](../glossary/Triebwerk.md) sind fest eingebaut; [Module](../glossary/Modul.md) (innen) und [Mounts](../glossary/Mount.md) (außen) lassen sich tauschen. Gekauft, umgerüstet, repariert und verschrottet wird in einer [Werft](../glossary/Werft.md).

## Bauteile

| Bauteil | Bestimmt | Tauschbar |
|---|---|---|
| Rahmen | Plätze für Module und Mounts, Tankgröße | nein |
| Reaktor | verfügbare Leistung | nein |
| Triebwerk | Geschwindigkeit | nein |
| Modul | z. B. Frachtraum, Quartiere, Raffinerie, Warp- oder Sprungantrieb, Schild | ja |
| Mount | z. B. Bergbaulaser, Gassauger, Vermesser, Sensorarray, Waffen | ja |

- Jedes Bauteil braucht Leistung und Crew. Ein Schiff ist gültig, solange Reaktor und Quartiere den Bedarf decken.
- Zum Einbauen muss das Bauteil in der [Fracht](../glossary/Fracht.md) des Schiffs liegen, und das Schiff muss an einer Werft angedockt sein.
- Beispiele für Mounts: MOUNT_MINING_LASER_I bis III, MOUNT_SURVEYOR_I bis III, MOUNT_GAS_SIPHON_I bis III, MOUNT_SENSOR_ARRAY_I bis III.
- Beispiele für Module: MODULE_CARGO_HOLD_I bis III, MODULE_CREW_QUARTERS_I, MODULE_ORE_REFINERY_I, MODULE_FUEL_REFINERY_I, MODULE_WARP_DRIVE_I bis III, MODULE_JUMP_DRIVE_I bis III.

## Schiffstypen und Rollen

Die Werft verkauft [Schiffstypen](../glossary/Schiffstyp.md), unter anderem:

| Typ | Typischer Einsatz |
|---|---|
| SHIP_PROBE | [Sonde](../glossary/Sonde.md): Marktdaten beobachten |
| SHIP_MINING_DRONE | Erz abbauen (langsam, billig) |
| SHIP_SIPHON_DRONE | Gas absaugen |
| SHIP_SURVEYOR | Abbauorte vermessen |
| SHIP_LIGHT_HAULER, SHIP_HEAVY_FREIGHTER, SHIP_BULK_FREIGHTER | Fracht transportieren |
| SHIP_LIGHT_SHUTTLE | schneller kleiner Transporter |
| SHIP_ORE_HOUND | größeres Abbauschiff |
| SHIP_REFINING_FREIGHTER | Raffinieren unterwegs |
| SHIP_EXPLORER | Erkunden, Warp |
| SHIP_COMMAND_FRIGATE | Kommandoschiff (Start) |
| SHIP_INTERCEPTOR | Abfangjäger |

Die [Schiffsrolle](../glossary/Schiffsrolle.md) (z. B. COMMAND, HAULER, EXCAVATOR, SATELLITE, SURVEYOR, REFINERY) beschreibt die registrierte Aufgabe. Seltene Schiffstypen kommen nur in wenigen Werften vor, besonders in der äußeren Galaxie.

## Crew

- Die [Crew](../glossary/Crew.md)-Größe hängt von den Quartier-Modulen ab. Drohnen und Sonden brauchen keine Crew (negativer Bedarf).
- Die Moral hängt von aggressivem Fliegen, seltenen Hafenaufenthalten und Gefahren ab. Niedrige Moral kann Aktionen verhindern oder Schäden erhöhen.
- Geplant: Anheuern in Werften und Heuer beim Andocken.

## Werft

- Ohne eigenes Schiff vor Ort zeigt die Werft keine Preise; der Startagent hat dafür eine Sonde an der Werft.
- Kaufen: `POST /my/ships` mit `shipType` und `waypointSymbol`. Die Credits werden sofort abgezogen.
- [Reparatur](../glossary/Reparatur.md) und [Verschrotten](../glossary/Verschrotten.md): siehe [Wartung](wartung.md).

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Flotte / Schiff | `GET /my/ships`, `GET /my/ships/{shipSymbol}` |
| Fracht | `GET /my/ships/{shipSymbol}/cargo` |
| Werft ansehen | `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}/shipyard` |
| Schiff kaufen | `POST /my/ships` |
| Mounts | `GET /my/ships/{shipSymbol}/mounts`, `POST …/mounts/install`, `POST …/mounts/remove` |
| Module | `GET /my/ships/{shipSymbol}/modules`, `POST …/modules/install`, `POST …/modules/remove` |

Fehlercodes zu fehlender Leistung, Plätzen oder Crew: 4249 bis 4252, zu Modulen 4266 bis 4268 ([Fehlercodes](../api/fehlercodes.md)). Umsetzung: Issues #13 (Flottenansicht) und #17 (Werft).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/outfitting, https://docs.spacetraders.io/game-concepts/crew-morale und https://docs.spacetraders.io/quickstart/purchase-ship
