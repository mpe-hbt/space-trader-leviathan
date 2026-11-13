---
title: Abbau
summary: Schiffe gewinnen Erze an Asteroiden und Gase an Gasriesen; ein Survey verbessert die Ausbeute, und nach jeder Gewinnung folgt ein Cooldown.
audience: [domain, tech]
tags: [spacetraders, abbau]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Abbau

## Kurz gesagt

Mit einem Bergbaulaser baut ein Schiff Erze und Minerale an Asteroiden ab ([Abbau](../glossary/Abbau.md)), mit Gassauger und Gasprozessor saugt es Gase an Gasriesen ab ([Absaugen](../glossary/Absaugen.md)). Die Ausbeute ist zufällig und hängt von Ausrüstung und Ort ab. Ein [Survey](../glossary/Survey.md) findet ergiebigere Stellen. Nach jeder Gewinnung hat das Schiff einen [Cooldown](../glossary/Cooldown.md). Übernutzte Asteroiden können kollabieren und liefern dann deutlich weniger.

## Ablauf und Regeln

1. Zum Asteroiden fliegen (für den Anfang: den ENGINEERED_ASTEROID im Startsystem).
2. Optional andocken und tanken, dann in den Orbit.
3. Optional einen Survey erstellen; er liefert mehrere Vorkommen mit Rohstoffen, Größe (SMALL, MODERATE, LARGE) und Ablaufzeit.
4. Abbauen, mit oder ohne Survey. Ein Survey muss unverändert und vollständig übergeben werden.
5. Cooldown abwarten (Navigation ist währenddessen möglich), dann wiederholen, bis die Fracht voll ist.
6. Unerwünschte Ware [abwerfen](../glossary/Abwerfen.md) oder per [Transfer](../glossary/Transfer.md) an einen Frachter übergeben.
7. Zum Markt fliegen und verkaufen oder für einen Auftrag liefern.

### Regeln

- Surveys verfallen und erschöpfen sich; ein erschöpfter Survey führt beim Abbau zu einem Fehler (4221, 4224).
- Der Modifikator CRITICAL_LIMIT warnt vor Übernutzung; weiterer Abbau kann den Asteroiden destabilisieren (Fehler 4253).
- Mit einem Raffinerie-Modul lassen sich Erze an Bord [raffinieren](../glossary/Raffinieren.md).
- Abbaubare Rohstoffe sind unter anderem QUARTZ_SAND, SILICON_CRYSTALS, PRECIOUS_STONES, ICE_WATER, AMMONIA_ICE, IRON_ORE, COPPER_ORE, SILVER_ORE, ALUMINUM_ORE, GOLD_ORE, PLATINUM_ORE, DIAMONDS, URANITE_ORE und MERITIUM_ORE.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Survey | `POST /my/ships/{shipSymbol}/survey` |
| Abbau | `POST /my/ships/{shipSymbol}/extract`, mit Survey `POST …/extract/survey` |
| Absaugen | `POST /my/ships/{shipSymbol}/siphon` |
| Raffinieren | `POST /my/ships/{shipSymbol}/refine` |
| Abwerfen | `POST /my/ships/{shipSymbol}/jettison` |
| Transfer | `POST /my/ships/{shipSymbol}/transfer` |
| Cooldown | `GET /my/ships/{shipSymbol}/cooldown` |

Fehlercodes 4205, 4206, 4220 bis 4224, 4228, 4240, 4242, 4243, 4253, 4257 bis 4261 ([Fehlercodes](../api/fehlercodes.md)). Umsetzung: Issues #18 (UI) und #34 (Routine Abbau und Verkauf).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/extracting-resources, https://docs.spacetraders.io/game-concepts/exploration und https://docs.spacetraders.io/quickstart/mine-asteroids
- [Märkte und Handel](maerkte.md)
