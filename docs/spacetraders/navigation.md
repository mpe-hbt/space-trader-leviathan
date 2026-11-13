---
title: Navigation
summary: Schiffe fliegen innerhalb eines Systems zwischen Wegpunkten, wechseln per Sprungtor oder Warp das System und müssen dafür im Orbit sein und Treibstoff haben.
audience: [domain, tech]
tags: [spacetraders, navigation]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Navigation

## Kurz gesagt

Ein Schiff ist immer in einem von drei Zuständen ([Navigationsstatus](../glossary/Navigationsstatus.md)): angedockt, im Orbit oder im Transit. Zum Fliegen muss es im [Orbit](../glossary/Orbit.md) sein, zum Handeln und Tanken [angedockt](../glossary/Andocken.md). Ein Flug dauert Zeit und kostet [Treibstoff](../glossary/Treibstoff.md); der [Flugmodus](../glossary/Flugmodus.md) tauscht Zeit gegen Treibstoff. Andere Systeme erreicht man per [Sprung](../glossary/Sprung.md) über ein [Sprungtor](../glossary/Sprungtor.md) oder per [Warp](../glossary/Warp.md).

## Ablauf und Regeln

### Orbit und Andocken

- Vor jeder [Navigation](../glossary/Navigation.md) muss das Schiff im Orbit sein.
- Orbit und Andocken sind idempotent: Ein zweiter Aufruf ändert nichts. Der Client kann sie also gefahrlos vorsorglich aufrufen.

### Flugmodi

| Modus | Geschwindigkeit | Treibstoff | Zweck |
|---|---|---|---|
| CRUISE | normal | normal | Standard |
| BURN | schnell | hoch | Eile |
| DRIFT | sehr langsam | minimal | fast leerer Tank |
| STEALTH | reduziert | normal | schwer zu entdecken |

Seit Februar 2025 lässt sich der Modus auch während des Fluges ändern. Schneller kostet zusätzlichen Treibstoff und verkürzt die Ankunft; langsamer ist im Flug nicht erlaubt, und bereits verbrauchter Treibstoff kommt nicht zurück.

### Navigation im System

1. Schiff in den Orbit bringen.
2. Navigation zum Zielwegpunkt im selben System starten.
3. Das Schiff ist im Transit; die Antwort nennt Abflug- und Ankunftszeit. Während des Transits schlagen fast alle anderen Aktionen fehl (Fehler 4214).
4. Nach der Ankunftszeit ist das Schiff im Orbit des Ziels.

Der Verbrauch hängt von der Entfernung und dem Flugmodus ab. Reicht der Treibstoff nicht, lehnt die API ab (Fehler 4203).

### In ein anderes System wechseln: Sprung und Warp

- **Sprung:** Nur von einem Sprungtor zu einem verbundenen Sprungtor. Der Sprung ist sofort, verbraucht eine Einheit Antimaterie zum Marktpreis am Tor und löst einen [Cooldown](../glossary/Cooldown.md) aus. Tore im Bau sind gesperrt (Fehler 4256, 4262).
- **Warp:** Braucht einen Warpantrieb. Verhält sich wie eine Navigation, dauert also und kostet normalen Treibstoff.

### Tanken

- Tanken geht angedockt an jedem Markt, der Treibstoff (FUEL) führt.
- Eine Markteinheit FUEL füllt 100 Einheiten im Tank. Preise schwanken stark; an belebten Orten kann Treibstoff teuer sein.
- Mit `fromCargo: true` tankt ein Schiff aus seiner eigenen Fracht.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Orbit / Andocken | `POST /my/ships/{shipSymbol}/orbit`, `/dock` |
| Navigieren | `POST /my/ships/{shipSymbol}/navigate` mit `waypointSymbol` |
| Flugmodus ändern | `PATCH /my/ships/{shipSymbol}/nav` mit `flightMode`; liefert `nav` und `fuel` |
| Status | `GET /my/ships/{shipSymbol}/nav` |
| Sprung | `POST /my/ships/{shipSymbol}/jump` mit `waypointSymbol` des Ziel-Tors |
| Warp | `POST /my/ships/{shipSymbol}/warp` |
| Tanken | `POST /my/ships/{shipSymbol}/refuel` (optional `units`, `fromCargo`) |
| Sprungtor-Verbindungen | `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}/jump-gate` |

Der Client berechnet die Position im Transit aus Abflug, Ankunft und Koordinaten (Issue #29) und plant Routen mit Tankstopps (Issue #33). Es gibt keine Benachrichtigung bei Ankunft; der [Kern](../glossary/Kern.md) plant Folgeaktionen anhand der Ankunftszeit.

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/ship-navigation und https://docs.spacetraders.io/quickstart/mine-asteroids
- [Systeme und Wegpunkte](systeme-und-wegpunkte.md), [Fehlercodes](../api/fehlercodes.md)
