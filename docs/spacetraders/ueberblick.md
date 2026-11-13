---
title: SpaceTraders im Überblick
summary: SpaceTraders ist ein Mehrspieler-Weltraumspiel ohne eigene Oberfläche, das nur über eine HTTP-API gespielt wird; dieses Projekt baut dafür einen Client.
audience: [business, domain, tech]
tags: [spacetraders, einstieg]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# SpaceTraders im Überblick

## Kurz gesagt

SpaceTraders ist ein Weltraum-Handelsspiel, das sich ausschließlich über eine öffentliche HTTP-API steuern lässt. Es gibt keinen offiziellen Spiel-Client: Wer spielen will, schreibt sich seine eigene Oberfläche oder Automatisierung. Alle Spieler teilen sich ein Universum mit rund 8.500 Systemen. Das Spiel befindet sich in der Alpha-Phase und wird alle 7 bis 14 Tage komplett zurückgesetzt. Dieses Projekt baut einen solchen Client mit Fokus auf Grafik, einfache Bedienung, Automatisierung und einen Board-Computer.

## Worum es geht

Jeder Spieler steuert einen [Agent](../glossary/Agent.md), der für eine [Fraktion](../glossary/Fraktion.md) startet. Ziel ist, mit einer [Flotte](../glossary/Flotte.md) von [Schiffen](../glossary/Schiff.md) Gewinn zu machen:

- **Aufträge erfüllen:** Fraktionen zahlen für gelieferte Waren ([Auftrag](../glossary/Auftrag.md)).
- **Handeln:** Waren dort kaufen, wo sie hergestellt werden, und dort verkaufen, wo sie gebraucht werden ([Märkte und Handel](maerkte.md)).
- **Abbauen:** Erze an Asteroiden gewinnen und verkaufen ([Abbau](abbau.md)).
- **Erkunden:** neue Systeme kartieren und am Bau von Sprungtoren mitwirken ([Erkundung und Bauprojekte](erkundung.md)).

Die Wirtschaft ist simuliert: Preise reagieren auf Angebot und Nachfrage, und Spieler beeinflussen sie durch ihren Handel.

## Die Spielwelt in Stichworten

| Thema | Seite |
|---|---|
| Agent, Fraktion, Aufträge | [Agents, Fraktionen und Aufträge](agenten-und-fraktionen.md) |
| Systeme, Wegpunkte, Koordinaten | [Systeme und Wegpunkte](systeme-und-wegpunkte.md) |
| Fliegen, Tanken, Springen | [Navigation](navigation.md) |
| Schiffe, Module, Mounts, Crew | [Schiffe und Ausrüstung](schiffe-und-ausruestung.md) |
| Zustand, Reparatur, Verschrotten | [Wartung](wartung.md) |
| Märkte und Preise | [Märkte und Handel](maerkte.md) |
| Erze und Gase gewinnen | [Abbau](abbau.md) |
| Kartieren, Scannen, Bauprojekte | [Erkundung und Bauprojekte](erkundung.md) |
| Wöchentliches Zurücksetzen | [Server-Reset](server-reset.md) |
| Die ersten Schritte als neuer Agent | [Erster Spielablauf](erster-spielablauf.md) |

## Geplante Erweiterungen des Spiels

Die Betreiber nennen ohne festen Zeitplan unter anderem Piraterie und Patrouillen, Ansehen bei Fraktionen mit freischaltbaren Toren und Modulen, Kämpfe, eigene Stationen, Ereignisse sowie Webhooks und Websockets für Echtzeit-Benachrichtigungen. Der Client sollte deshalb keine Annahmen treffen, die solche Erweiterungen ausschließen. Heute gibt es keine Push-Benachrichtigungen; Zustände müssen abgefragt oder aus Ankunftszeiten berechnet werden.

## Für die Technik

- API-Basis: `https://api.spacetraders.io/v2`, Version der Spezifikation 2.3.0. Details in [API-Überblick](../api/ueberblick.md).
- Spielstatus und nächster Reset: `GET /` (Felder `status`, `version`, `resetDate`, `serverResets`, `stats`, `leaderboards`, `announcements`).
- Architektur des Clients: [arc42 Kapitel 1: Einführung und Ziele](../arc42/01-einfuehrung-und-ziele.md).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/getting-started und https://docs.spacetraders.io/roadmap
- OpenAPI-Repository: https://github.com/SpaceTradersAPI/api-docs
- Roadmap dieses Projekts: Issue #1
