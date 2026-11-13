---
title: "arc42 Kapitel 1: Einführung und Ziele"
summary: space-trader-leviathan ist ein Desktop-Client für SpaceTraders mit schöner Grafik, einfacher Bedienung, Automatisierung und einem Board-Computer auf Basis von Claude.
audience: [business, domain, tech]
tags: [arc42, ziele]
owner: Architektur
reviewed: 2026-11-13
---

# 1 Einführung und Ziele

## Kurz gesagt

SpaceTraders hat keinen offiziellen Client ([SpaceTraders im Überblick](../spacetraders/ueberblick.md)). space-trader-leviathan schließt diese Lücke mit einer Desktop-App, die das Spiel anschaulich macht, mühsame Abläufe automatisiert und einen [Board-Computer](../glossary/Board-Computer.md) mitbringt, mit dem der Spieler sprechen kann. Die Roadmap steht in Issue #1.

## Aufgabenstellung

| Ziel | Bedeutung |
|---|---|
| Schöne Grafik | Galaxie- und Systemkarte mit eigenem Sci-Fi-Look und Animationen (Milestone M3) |
| Einfache Bedienung | jede Kernaktion in wenigen Klicks, Tastatur und Command-Palette, verständliche Fehler (M1, M3) |
| Automatisierung | [Routinen](../glossary/Routine.md) für Abbau, Handel, Aufträge und Scouting, die ohne offenes Fenster weiterlaufen (M4) |
| Board-Computer | Claude-Chat, der Fragen mit echten Spieldaten beantwortet, Aktionen nach Bestätigung ausführt und neue Aufgaben als GitHub-Issues vorschlägt (M2) |

## Qualitätsziele

| Priorität | Qualitätsziel | Konkret |
|---|---|---|
| 1 | Sicherheit | Tokens und API-Keys verlassen nie den [Kern](../glossary/Kern.md); Spieldaten können den Board-Computer nicht zu Aktionen verleiten |
| 2 | Zuverlässigkeit | Routinen laufen tagelang stabil und überstehen Neustarts und Rate-Limits |
| 3 | Benutzbarkeit | Ein neuer Spieler erfüllt den ersten Auftrag ohne externe Doku |
| 4 | Performance | Galaxiekarte flüssig mit 60 Bildern pro Sekunde bei rund 8.500 Systemen |

Details und Szenarien: [Kapitel 10](10-qualitaetsanforderungen.md).

## Stakeholder

| Rolle | Erwartung |
|---|---|
| Spieler | schöne, einfache Oberfläche; Automatisierung, der man vertrauen kann |
| Entwicklung | klare Architektur, typisierte API, testbarer Kern |
| Produktverantwortung | Roadmap, Priorisierung; neue Aufgaben aus dem Board-Computer |
| Betreiber von SpaceTraders | Clients halten Rate-Limits ein und belasten die API nicht unnötig |

## Alle Kapitel

1. Einführung und Ziele (diese Seite)
2. [Randbedingungen](02-randbedingungen.md)
3. [Kontextabgrenzung](03-kontextabgrenzung.md)
4. [Lösungsstrategie](04-loesungsstrategie.md)
5. [Bausteinsicht](05-bausteinsicht.md)
6. [Laufzeitsicht](06-laufzeitsicht.md)
7. [Verteilungssicht](07-verteilungssicht.md)
8. [Querschnittliche Konzepte](08-konzepte.md)
9. [Architekturentscheidungen](09-entscheidungen.md)
10. [Qualitätsanforderungen](10-qualitaetsanforderungen.md)
11. [Risiken und technische Schulden](11-risiken.md)
12. [Domänensprache](12-domaenensprache.md)
