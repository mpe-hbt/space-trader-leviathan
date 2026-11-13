---
title: Wartung
summary: Schiffe verschleißen beim Fliegen und Abbauen; ihr Zustand lässt sich in der Werft gegen Credits reparieren, die Integrität sinkt dabei dauerhaft.
audience: [domain, tech]
tags: [spacetraders, schiff]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Wartung

## Kurz gesagt

Rahmen, Reaktor und Triebwerk haben einen [Schiffszustand](../glossary/Schiffszustand.md) aus zwei Werten: dem Zustand (kurzfristig, reparierbar) und der Integrität (langfristiger Verschleiß). Navigation und Abbau können negative Ereignisse auslösen, die den Zustand senken; bessere Schiffe verschleißen langsamer. Eine [Reparatur](../glossary/Reparatur.md) in der Werft stellt den Zustand wieder her, senkt aber die Integrität ein wenig. Ausgediente Schiffe kann man [verschrotten](../glossary/Verschrotten.md). Die Betreiber kennzeichnen das System als Vorschau; Werte können sich ändern.

## Ablauf und Regeln

- **Negative Ereignisse:** zum Beispiel Mikrometeoriten, Kühlmittellecks, Vibrationsschäden beim Bohren oder Hitzestress. Die Antworten auf Navigation und Abbau melden sie mit betroffenem Bauteil.
- **Reparatur:** nur angedockt an einer Werft. Die Kosten hängen von Bauteil, Schaden und den Marktpreisen für Schiffsteile und Panzerung ab. Alle Bauteile kommen auf Zustand 1.
- **Verschrotten:** nur an einer Werft. Der Erlös richtet sich nach Schiffspreis, Zustand, Ausrüstung und Teilepreisen. Wertvolle Module und Mounts vorher ausbauen; Fracht wird vernichtet.
- Beides lässt sich vorher als Kostenvoranschlag abfragen.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Reparaturkosten schätzen / reparieren | `GET` / `POST /my/ships/{shipSymbol}/repair` |
| Schrottwert schätzen / verschrotten | `GET` / `POST /my/ships/{shipSymbol}/scrap` |

Ereignisse heißen im Modell `ShipConditionEvent` mit `component` (FRAME, REACTOR, ENGINE). Routinen (Issue #32) sollten den Zustand überwachen und rechtzeitig zur Werft fliegen; Verschrotten verlangt im Client immer eine Bestätigung (Issue #17).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/maintenance
- [Schiffe und Ausrüstung](schiffe-und-ausruestung.md)
