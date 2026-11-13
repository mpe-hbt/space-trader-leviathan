---
title: Erkundung und Bauprojekte
summary: Schiffe kartieren und scannen Wegpunkte, um Informationen für alle sichtbar zu machen, und beliefern Bauprojekte wie Sprungtore.
audience: [domain, tech]
tags: [spacetraders, erkundung]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Erkundung und Bauprojekte

## Kurz gesagt

Viele Wegpunkte sind anfangs nur grob bekannt. Ein Schiff vor Ort kann sie [kartieren](../glossary/Kartieren.md); danach sehen alle Spieler ihre Merkmale. Mit einem Sensorarray [scannt](../glossary/Scan.md) ein Schiff Systeme, Wegpunkte und Schiffe in der Umgebung. Fraktionen am Rand des Universums handeln eher seltene Technik. Manche Sprungtore sind noch im Bau; sie werden durch [Bauprojekte](../glossary/Bauprojekt.md) fertiggestellt, die Agents mit Material beliefern.

## Kartieren und Scannen

- **Kartieren:** Schiff am Wegpunkt, ein Aufruf. Bereits kartierte Wegpunkte melden Fehler 4230.
- **Scannen:** braucht ein Sensorarray (Fehler 4215 ohne) und löst einen Cooldown aus.
- **Gefahren:** Manche Systeme bergen Gefahren für Schiff und Crew; Erkundung ist riskant, kann sich aber lohnen.

## Bauprojekt am Sprungtor beliefern

1. Ein Wegpunkt mit `isUnderConstruction` (meist ein Sprungtor) hat eine Materialliste mit benötigter und bereits gelieferter Menge.
2. Ein Schiff lädt das Material, fliegt zum Bauprojekt und dockt an.
3. Es liefert Material aus seiner Fracht; jede Lieferung erhöht die gelieferte Menge.
4. Ist alles geliefert, wird das Sprungtor nutzbar. Bis dahin sind Sprünge dorthin und von dort gesperrt.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Kartieren | `POST /my/ships/{shipSymbol}/chart` |
| Scannen | `POST /my/ships/{shipSymbol}/scan/systems`, `/scan/waypoints`, `/scan/ships` |
| Bauprojekt ansehen | `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}/construction` |
| Material liefern | `POST /systems/{systemSymbol}/waypoints/{waypointSymbol}/construction/supply` |

Fehlercodes 4800 bis 4802 ([Fehlercodes](../api/fehlercodes.md)). Umsetzung: Issue #19; Scan-Ergebnisse fließen in den Cache (#8) und auf die Karten (#28, #29).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/exploration
- [Systeme und Wegpunkte](systeme-und-wegpunkte.md), [Navigation](navigation.md)
