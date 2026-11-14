---
title: API-Überblick
summary: Die SpaceTraders-API ist eine REST-API mit OpenAPI-Spezifikation, aus der der Client seine typisierten Aufrufe erzeugt.
audience: [tech]
tags: [api]
owner: Entwicklung
reviewed: 2026-11-14
---

# API-Überblick

## Kurz gesagt

Jede Spielaktion ist ein HTTP-Endpunkt unter `https://api.spacetraders.io/v2`. Die API ist vollständig mit OpenAPI beschrieben (Version 2.3.0). Der Client erzeugt daraus seinen API-Client (Issue #5) und leitet alle Aufrufe durch die [Request-Queue](../glossary/Request-Queue.md), die das [Rate-Limit](rate-limits.md) einhält. Antworten sind JSON mit einem Feld `data`, Listen zusätzlich mit `meta` für die Seitenaufteilung.

## Bereiche

| Bereich (Tag) | Inhalt | Wichtige Endpunkte |
|---|---|---|
| Global | Status, Registrierung | `GET /`, `POST /register` |
| Agents | eigener und fremde Agents | `GET /my/agent`, `GET /agents` |
| Factions | Fraktionen | `GET /factions` |
| Contracts | Aufträge | `GET /my/contracts`, `POST …/accept`, `/deliver`, `/fulfill` |
| Fleet | alle Schiffsaktionen | `GET /my/ships`, `POST /my/ships`, `POST /my/ships/{shipSymbol}/…` |
| Systems | Systeme, Wegpunkte, Markt, Werft, Sprungtor, Bauprojekt | `GET /systems/{systemSymbol}/waypoints/…` |
| Data | Lieferketten | `GET /market/supply-chain` |

Die Schiffsaktionen unter `/my/ships/{shipSymbol}/` sind: `orbit`, `dock`, `navigate`, `nav` (PATCH), `jump`, `warp`, `refuel`, `extract`, `extract/survey`, `siphon`, `survey`, `refine`, `jettison`, `transfer`, `purchase`, `sell`, `chart`, `scan/systems`, `scan/waypoints`, `scan/ships`, `negotiate/contract`, `cooldown`, `cargo`, `mounts`, `modules`, `repair`, `scrap`.

## Konventionen

- **Symbole** statt IDs für Agents, Schiffe, Systeme, Wegpunkte und Waren (z. B. `X1-DF55-A1`, `IRON_ORE`). Aufträge haben eine `contractId`.
- **Seiten:** Listen akzeptieren `page` (ab 1) und `limit` (1 bis 20, Standard 10); `meta.total` nennt die Gesamtzahl.
- **Sichtbarkeit:** Preise in Markt und Werft fehlen in der Antwort, wenn kein eigenes Schiff vor Ort ist.
- **Antworten auf Aktionen** enthalten den geänderten Zustand (z. B. `nav`, `fuel`, `cargo`, `agent`, `transaction`, `cooldown`). Der Client übernimmt sie direkt in den Cache, statt neu abzufragen.
- **Fehler:** einheitliches Objekt `error` mit `code`, `message`, `data` ([Fehlercodes](fehlercodes.md)).

## Client erzeugen

- Quelle: Repository https://github.com/SpaceTradersAPI/api-docs (`reference/SpaceTraders.json` und `models/`). Für Generatoren eignet sich die gebündelte Datei https://spacetraders.io/SpaceTraders.json, in der alle `$ref` aufgelöst sind.
- Die Spezifikation ist unter `packages/api-client/spec/SpaceTraders.json` gepinnt (Version 2.3.0, festgehalten in `SPACETRADERS_SPEC_VERSION`). `npm run api:update-spec` lädt die gebündelte Datei neu herunter (braucht Netz); danach `SPACETRADERS_SPEC_VERSION` anpassen und das Ergebnis prüfen.
- `npm run api:generate` erzeugt daraus die Typen in `packages/api-client/src/generated/schema.d.ts` (mit `openapi-typescript`, offline). Die Datei liegt im Repository und wird nicht von Hand geändert.
- `npm test` prüft, dass die erzeugten Typen zur gepinnten Spezifikation passen und die Versionen übereinstimmen (einzeln: `npm run api:check`). Weil die CI die Tests ausführt, schlägt sie bei einer Abweichung fehl.
- `createSpaceTradersClient` (auf Basis von `openapi-fetch`) bietet je Tag eine Fassade (`global`, `agents`, `fleet`, `systems`, `contracts`, `factions`, `data`); die Methoden heißen wie die `operationId` in camelCase, z. B. `fleet.navigateShip`. Bei Erfolg liefern sie den ganzen Body mit `data` und `meta`, bei einer Fehlerantwort werfen sie einen `SpaceTradersError` mit `status`, `code`, `message` und `data`. `register` nutzt den Account-Token, alle anderen Endpunkte den Agent-Token.
- Der Client wird nur im Kern über die [Request-Queue](../glossary/Request-Queue.md) genutzt; niemand ruft die API direkt auf (#6).

## Für die Technik

- Wichtige Modelle: `Agent`, `Ship` (mit `nav`, `fuel`, `cargo`, `cooldown`, `frame`, `reactor`, `engine`, `modules`, `mounts`, `crew`), `Waypoint`, `System`, `Market`, `Shipyard`, `Contract`, `Survey`, `JumpGate`, `Construction`.
- Ladeaufwand: Rund 8.500 Systeme brauchen bei 20 je Seite etwa 425 Anfragen, rund 200.000 Wegpunkte etwa 10.000. Wegpunkte lädt der Client deshalb nur für Systeme, die er braucht (siehe [Risiken](../arc42/11-risiken.md)).
- Authentifizierung: [Authentifizierung](authentifizierung.md).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/api-guide/open-api-spec, interaktive Referenz https://spacetraders.io/openapi
- [Bausteinsicht](../arc42/05-bausteinsicht.md)
