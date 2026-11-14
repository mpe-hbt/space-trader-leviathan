---
title: "arc42 Kapitel 12: Domänensprache"
summary: Einstieg in die verbindliche Domänensprache; jeder Begriff ist eine eigene Notiz im Ordner docs/glossary.
audience: [business, domain, tech]
tags: [arc42, glossar]
owner: Architektur
reviewed: 2026-11-14
---

# 12 Domänensprache (Glossar)

## Kurz gesagt

Das Glossar ist die verbindliche Domänensprache des Projekts: ein Begriff je Sache, mit Code-Namen und Wörtern, die nicht verwendet werden. Jeder Begriff ist eine eigene Notiz in `docs/glossary/`. Code-Namen folgen der SpaceTraders-API. Neue Begriffe kommen zuerst ins Glossar (Werkzeug `term`), dann in Code, Oberfläche und Doku.

## Begriffe nach Bereich

| Bereich | Begriffe |
|---|---|
| Spieler und Organisation | [Agent](../glossary/Agent.md), [Account](../glossary/Account.md), [Account-Token](../glossary/Account-Token.md), [Agent-Token](../glossary/Agent-Token.md), [Rufzeichen](../glossary/Rufzeichen.md), [Fraktion](../glossary/Fraktion.md), [Hauptquartier](../glossary/Hauptquartier.md), [Credits](../glossary/Credits.md), [Auftrag](../glossary/Auftrag.md), [Server-Reset](../glossary/Server-Reset.md), [Rate-Limit](../glossary/Rate-Limit.md) |
| Schiffe | [Schiff](../glossary/Schiff.md), [Flotte](../glossary/Flotte.md), [Schiffstyp](../glossary/Schiffstyp.md), [Schiffsrolle](../glossary/Schiffsrolle.md), [Sonde](../glossary/Sonde.md), [Rahmen](../glossary/Rahmen.md), [Reaktor](../glossary/Reaktor.md), [Triebwerk](../glossary/Triebwerk.md), [Modul](../glossary/Modul.md), [Mount](../glossary/Mount.md), [Crew](../glossary/Crew.md), [Fracht](../glossary/Fracht.md), [Treibstoff](../glossary/Treibstoff.md), [Cooldown](../glossary/Cooldown.md), [Schiffszustand](../glossary/Schiffszustand.md), [Reparatur](../glossary/Reparatur.md), [Verschrotten](../glossary/Verschrotten.md) |
| Navigation | [Navigationsstatus](../glossary/Navigationsstatus.md), [Andocken](../glossary/Andocken.md), [Orbit](../glossary/Orbit.md), [Navigation](../glossary/Navigation.md), [Flugmodus](../glossary/Flugmodus.md), [Sprung](../glossary/Sprung.md), [Warp](../glossary/Warp.md) |
| Universum | [System](../glossary/System.md), [Sektor](../glossary/Sektor.md), [Wegpunkt](../glossary/Wegpunkt.md), [Orbital](../glossary/Orbital.md), [Wegpunkt-Merkmal](../glossary/Wegpunkt-Merkmal.md), [Wegpunkt-Modifikator](../glossary/Wegpunkt-Modifikator.md), [Sprungtor](../glossary/Sprungtor.md), [Bauprojekt](../glossary/Bauprojekt.md), [Kartieren](../glossary/Kartieren.md), [Scan](../glossary/Scan.md) |
| Handel | [Markt](../glossary/Markt.md), [Handelsware](../glossary/Handelsware.md), [Export](../glossary/Export.md), [Import](../glossary/Import.md), [Austauschware](../glossary/Austauschware.md), [Angebot](../glossary/Angebot.md), [Aktivität](../glossary/Aktivität.md), [Handelsvolumen](../glossary/Handelsvolumen.md), [Lieferkette](../glossary/Lieferkette.md), [Werft](../glossary/Werft.md) |
| Abbau | [Abbau](../glossary/Abbau.md), [Survey](../glossary/Survey.md), [Absaugen](../glossary/Absaugen.md), [Raffinieren](../glossary/Raffinieren.md), [Abwerfen](../glossary/Abwerfen.md), [Transfer](../glossary/Transfer.md) |
| Client | [Board-Computer](../glossary/Board-Computer.md), [Routine](../glossary/Routine.md), [Request-Queue](../glossary/Request-Queue.md), [Kern](../glossary/Kern.md), [Renderer](../glossary/Renderer.md), [Tray-Modus](../glossary/Tray-Modus.md), [Anthropic-API-Key](../glossary/Anthropic-API-Key.md), [GitHub-Token](../glossary/GitHub-Token.md) |

## Regeln

- In der Oberfläche heißt es zum Beispiel „Auftrag“, nicht „Vertrag“ oder „Mission“; „Treibstoff“, nicht „Sprit“.
- Englische API-Namen bleiben im Code unverändert; die Notiz nennt sie unter „code“.
- Die Oberfläche ist einsprachig Deutsch (ADR-02 in [Entscheidungen](../decisions.md)). UI-Texte nutzen den Glossarbegriff, also den Titel der Notiz; englische Aliase und Code-Namen stehen nur im Code.

## Bezüge

- [Kapitel 8: Konzepte](08-konzepte.md)
