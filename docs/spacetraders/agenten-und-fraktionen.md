---
title: Agents, Fraktionen und Aufträge
summary: Ein Spieler steuert einen Agent, der für eine Fraktion startet und mit Aufträgen dieser Fraktion Credits verdient.
audience: [business, domain, tech]
tags: [spacetraders, auftrag]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Agents, Fraktionen und Aufträge

## Kurz gesagt

Der [Agent](../glossary/Agent.md) ist die Spielfigur. Ihm gehören alle Schiffe, Credits und Aufträge. Er ist nicht dasselbe wie der [Account](../glossary/Account.md): Der Account ist das dauerhafte Benutzerkonto, der Agent lebt nur bis zum nächsten [Server-Reset](server-reset.md). Beim Registrieren wählt man ein [Rufzeichen](../glossary/Rufzeichen.md) und eine [Fraktion](../glossary/Fraktion.md). Fraktionen vergeben [Aufträge](../glossary/Auftrag.md), die am Anfang die wichtigste Einnahmequelle sind.

## Agent

- Ein Spieler kann mehrere Agents nacheinander oder parallel haben; jeder hat einen eigenen [Agent-Token](../glossary/Agent-Token.md).
- Ein neuer Agent erhält ein Kommandoschiff, eine [Sonde](../glossary/Sonde.md), 175.000 [Credits](../glossary/Credits.md) und einen Startauftrag. Das Kommandoschiff liegt am [Hauptquartier](../glossary/Hauptquartier.md) im Heimatsystem der Fraktion.
- Ein Agent hat Rufzeichen, Credits, Hauptquartier, Startfraktion und eine Schiffszahl.
- Der Endstand eines Agents bleibt nach einem Reset im Account gespeichert.

## Fraktionen

- Fraktionen sind die Nicht-Spieler-Organisationen des Universums, zum Beispiel COSMIC, VOID, GALACTIC, QUANTUM oder DOMINION (19 insgesamt).
- Heute bestimmen sie vor allem den Startort und geben dem Spiel Atmosphäre. Ansehen bei einer Fraktion ist angelegt und soll künftig Tore, Module und bessere Aufträge freischalten.
- Weitere Fraktionen findet man beim Erkunden.

## Aufträge

### Arten

Die API kennt drei Arten: PROCUREMENT (Waren beschaffen und liefern), TRANSPORT und SHUTTLE. In der Praxis begegnen einem vor allem Beschaffungsaufträge.

### Ablauf

1. **Ansehen:** Ein Auftrag nennt Fraktion, Bezahlung (Vorschuss und Restzahlung), Annahmefrist und Lieferbedingungen (Ware, Menge, Zielwegpunkt, Lieferfrist).
2. **Annehmen:** Vor Ablauf der Annahmefrist. Der Agent bekommt einen Vorschuss.
3. **Liefern:** Ein Schiff mit der Ware an Bord fliegt zum Zielwegpunkt, dockt an und liefert eine Teilmenge oder alles. Das geht mehrmals.
4. **Erfüllen:** Sind alle Mengen geliefert, schließt der Agent den Auftrag ab und erhält die Restzahlung.
5. **Fristüberschreitung:** Die Fraktion zieht den Auftrag zurück und fordert den Vorschuss zurück; das Ansehen sinkt.

### Neue Aufträge

Neue Aufträge werden von einem angedockten Schiff bei der Fraktion ausgehandelt. Ein Agent kann nur einen offenen, nicht erfüllten Auftrag gleichzeitig haben (Fehler 4511). Der Startauftrag verfällt, wenn man lange wartet; dann handelt man einfach einen neuen aus.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Eigener Agent | `GET /my/agent` |
| Öffentliche Agents (Rangliste) | `GET /agents`, `GET /agents/{agentSymbol}` |
| Fraktionen | `GET /factions`, `GET /factions/{factionSymbol}` |
| Aufträge auflisten | `GET /my/contracts` |
| Annehmen, liefern, erfüllen | `POST /my/contracts/{contractId}/accept`, `/deliver`, `/fulfill` |
| Neuen Auftrag aushandeln | `POST /my/ships/{shipSymbol}/negotiate/contract` |

Das Aushandeln liegt unter `/my/ships`, weil es eine Schiffsaktion ist; alle anderen Auftragsaktionen laufen auf Ebene des Agents. Fehlercodes 4500 bis 4511 in [Fehlercodes](../api/fehlercodes.md). Umsetzung im Client: Issues #15 (UI) und #37 (Routine).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/agents-and-factions und https://docs.spacetraders.io/quickstart/first-mission
- [Erster Spielablauf](erster-spielablauf.md)
