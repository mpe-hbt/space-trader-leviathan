---
title: Server-Reset
summary: Das Spiel wird alle 7 oder 14 Tage komplett zurückgesetzt; alle Agents und Spieldaten verschwinden, der Account bleibt.
audience: [business, domain, tech]
tags: [spacetraders, betrieb]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Server-Reset

## Kurz gesagt

SpaceTraders setzt die Spielwelt regelmäßig zurück ([Server-Reset](../glossary/Server-Reset.md)), derzeit alle 7 oder 14 Kalendertage, meist am Wochenende um 22 Uhr japanischer Zeit. Dabei werden alle Agents, Schiffe, Fracht und Systeme gelöscht. Der [Account](../glossary/Account.md) bleibt; ein neuer Agent muss registriert werden, und alle alten [Agent-Tokens](../glossary/Agent-Token.md) sind ungültig. Für den Client heißt das: Er muss den Reset erkennen und den Spieler sauber in ein neues Spiel führen.

## Was beim Reset mit Agent, Schiffen, Tokens und Account passiert

1. Der nächste Reset steht im Statusendpunkt (`serverResets.next`, `serverResets.frequency`), das Datum des letzten Resets in `resetDate`.
2. Nach dem Reset liefert die API für alte Agent-Tokens Fehler.
3. Der Spieler registriert einen neuen Agent, über das Dashboard my.spacetraders.io oder über `POST /register` mit dem [Account-Token](../glossary/Account-Token.md).
4. Der Endstand des alten Agents bleibt im Account sichtbar.

Die Universumsgenerierung kann sich mit einem Reset ändern (Beispiel: im März 2025 mehr Monde, weniger, aber effizientere Sprungverbindungen, Systemnamen). Der Client darf deshalb keine Spielwelt-Daten über Resets hinweg als gültig annehmen.

## Für die Technik

- Erkennung: `GET /` beim Start und regelmäßig; ändert sich `resetDate`, beginnt ein neuer Datenstand.
- Daten werden je Reset getrennt gespeichert und alte Stände archiviert (Issue #8).
- Routinen werden beim Reset gestoppt; der Board-Computer meldet den Reset (Issue #25).
- Tokens und Account-Token: [Authentifizierung](../api/authentifizierung.md).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/server-resets
- [SpaceTraders im Überblick](ueberblick.md)
