---
title: Systeme und Wegpunkte
summary: Das Universum besteht aus rund 8.500 Systemen mit zusammen etwa 200.000 Wegpunkten, die über Symbole wie X1-DF55-A1 adressiert werden.
audience: [domain, tech]
tags: [spacetraders, karte]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Systeme und Wegpunkte

## Kurz gesagt

Das Universum ist in [Systeme](../glossary/System.md) gegliedert, jedes mit galaktischen x/y-Koordinaten. In jedem System liegen [Wegpunkte](../glossary/Wegpunkt.md): Planeten, Monde, Stationen, Asteroidenfelder, Sprungtore und mehr. Schiffe fliegen innerhalb eines Systems zwischen Wegpunkten und wechseln per Sprung oder Warp in andere Systeme. Trägt man die Systemkoordinaten auf, ergibt sich grob eine Spiralgalaxie, die Grundlage der Galaxiekarte im Client.

## Symbole

Jeder Ort hat ein Symbol aus drei Teilen, zum Beispiel `X1-DF55-A1`:

| Teil | Beispiel | Bedeutung |
|---|---|---|
| [Sektor](../glossary/Sektor.md) | `X1` | oberste Ebene |
| System | `X1-DF55` | Sternsystem |
| Wegpunkt | `X1-DF55-A1` | Ort im System |

Seit März 2025 haben Systeme zusätzlich einen lesbaren Namen und ein Sternbild (Felder `name` und `constellation`).

## Systeme

- Typen: NEUTRON_STAR, RED_STAR, ORANGE_STAR, BLUE_STAR, YOUNG_STAR, WHITE_DWARF, BLACK_HOLE, HYPERGIANT, NEBULA, UNSTABLE. Die meisten sind Sterne.
- Systemkoordinaten sind absolute Einheiten auf galaktischer Ebene.
- Systeme werden intern in Stufen eingeteilt; die besten liegen seit 2025 außerhalb der Heimatsysteme.

## Wegpunkte

- Wegpunktkoordinaten sind relativ zum Systemmittelpunkt (0,0).
- Typen: PLANET, GAS_GIANT, MOON, ORBITAL_STATION, JUMP_GATE, ASTEROID_FIELD, ASTEROID, ENGINEERED_ASTEROID, ASTEROID_BASE, NEBULA, DEBRIS_FIELD, GRAVITY_WELL, ARTIFICIAL_GRAVITY_WELL, FUEL_STATION.
- Ein [Orbital](../glossary/Orbital.md) umkreist einen anderen Wegpunkt und hat dieselben Koordinaten; das Feld `orbits` nennt den Mutterkörper, `orbitals` die Trabanten. Beispiel: Ein Planet mit Station und zwei Monden.
- Ein Startsystem enthält einen ENGINEERED_ASTEROID nahe dem Hauptquartier, der sich gut für den ersten Abbau eignet.

### Merkmale und Modifikatoren

- [Wegpunkt-Merkmale](../glossary/Wegpunkt-Merkmal.md) gelten für die Dauer eines Resets (69 Arten). Die wichtigsten: MARKETPLACE (es gibt einen [Markt](maerkte.md)) und SHIPYARD (es gibt eine [Werft](../glossary/Werft.md)).
- [Wegpunkt-Modifikatoren](../glossary/Wegpunkt-Modifikator.md) kommen und gehen: STRIPPED, UNSTABLE, RADIATION_LEAK, CRITICAL_LIMIT, CIVIL_UNREST. Spürbare Wirkung hat heute vor allem CRITICAL_LIMIT: Der Asteroid ist übernutzt.

### Sichtbarkeit

Ohne [Kartierung](../glossary/Kartieren.md) zeigt ein Wegpunkt nur Grunddaten. Merkmale werden sichtbar, wenn jemand ihn kartiert hat, ein Schiff dort ist oder ein Scan ihn erfasst.

## Für die Technik

| Abfrage | Endpunkt |
|---|---|
| Alle Systeme (paginiert) | `GET /systems` |
| Ein System | `GET /systems/{systemSymbol}` |
| Wegpunkte eines Systems, filterbar nach `type` und `traits` | `GET /systems/{systemSymbol}/waypoints` |
| Ein Wegpunkt | `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}` |

Systeme und Wegpunkte ändern sich innerhalb eines Resets kaum; der Client lädt sie einmal je Reset und hält sie im Cache (Issue #8). Die Galaxiekarte (#28) muss rund 8.500 Systeme, die Systemkarte (#29) Orbitale gruppiert darstellen.

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/systems-waypoints und https://docs.spacetraders.io/quickstart/new-game
- [Navigation](navigation.md), [Erkundung und Bauprojekte](erkundung.md)
