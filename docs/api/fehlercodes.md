---
title: Fehlercodes
summary: Fehlerantworten der API haben ein einheitliches Format mit numerischem Code; die Codes sind nach Bereichen gruppiert und werden im Client in verständliche Meldungen übersetzt.
audience: [tech]
tags: [api, fehler]
owner: Entwicklung
reviewed: 2026-11-13
---

# Fehlercodes

## Kurz gesagt

Die API nutzt HTTP-Statuscodes: 2xx Erfolg, 4xx Fehler in der Anfrage, 5xx Fehler auf dem Server. Jede Fehlerantwort enthält ein Objekt `error` mit `code` (vierstellig), `message` und `data`. Der Client übersetzt die Codes in verständliche Meldungen mit Handlungsvorschlag (Issue #10) und entscheidet anhand des Codes, ob ein Wiederholen sinnvoll ist.

## Ablauf und Regeln

Die Codes sind nach Bereichen gruppiert. Die Liste unten ist die der offiziellen Doku; sie ist nicht vollständig, neue Codes kommen mit Spieländerungen dazu.

### Allgemein (40xx)

| Code | Bedeutung |
|---|---|
| 4000 | Schiff im [Cooldown](../glossary/Cooldown.md) |
| 4001 | kein Zugriff auf den Wegpunkt |

### Account und Token (41xx)

| Code | Bedeutung |
|---|---|
| 4100 bis 4105 | Token leer, ungültig oder fehlt (4103: `Bearer` fehlt) |
| 4106 bis 4108 | Account oder Agent existiert nicht, Account hat keinen Agent |
| 4109 bis 4111 | Rufzeichen existiert, ist reserviert oder kollidiert |

### Schiff (42xx)

| Code | Bedeutung |
|---|---|
| 4200 bis 4204 | Navigation: im Transit, ungültiges Ziel, außerhalb des Systems, zu wenig Treibstoff, Ziel = Standort |
| 4205, 4206 | Abbau am falschen Wegpunkt oder ohne Berechtigung |
| 4207 bis 4212, 4229, 4254 bis 4256, 4262 | Sprung: kein System, gleiches System, fehlendes Modul, kein gültiges Tor, keine Antimaterie, Tor zu Tor, Tor im Bau |
| 4214 | Schiff im Transit |
| 4215 | Sensorarray fehlt |
| 4216 | zu wenig Credits für Schiffskauf |
| 4217 bis 4219, 4228 | Fracht: Kapazität überschritten, Ware fehlt, Menge falsch, Frachtraum voll |
| 4220 bis 4224 | Survey ungültig, abgelaufen, falscher Wegpunkttyp, nicht im Orbit, erschöpft |
| 4225, 4226 | Tanken: nicht angedockt, kein Treibstoff am Ort |
| 4227, 4240 bis 4243, 4257, 4258 | fehlende Ausrüstung (Mounts, Vermesser, Warpantrieb, Prozessoren, Laser, Gassauger) |
| 4230 | Wegpunkt bereits kartiert |
| 4231 bis 4234 | Transfer: Schiff fehlt, fremder Agent, gleiches Schiff, anderer Ort |
| 4235 | Warp innerhalb des Systems |
| 4236, 4244 | nicht im Orbit, nicht angedockt |
| 4237 bis 4239 | Raffinieren: falsche Ware, falscher Typ, keine Raffinerie |
| 4245 bis 4252 | Werft: Schiff nicht vor Ort, keine Werft, Mount fehlt, zu wenig Credits, fehlende Leistung, Plätze oder Crew |
| 4253 | Asteroid destabilisiert |
| 4259 bis 4261 | Absaugen am falschen Ort, ohne Berechtigung, keine Ausbeute |
| 4266 bis 4268 | Module: keine Werft, nicht eingebaut, zu wenig Credits |

### Auftrag (45xx)

| Code | Bedeutung |
|---|---|
| 4500, 4501 | Annehmen nicht erlaubt oder Konflikt |
| 4502 | Erfüllen: Lieferung unvollständig |
| 4503 | Frist abgelaufen |
| 4504 bis 4506 | bereits erfüllt, nicht angenommen, nicht berechtigt |
| 4508 bis 4510 | Liefern: Bedingungen nicht erfüllt, bereits erfüllt, falscher Ort |
| 4511 | es gibt schon einen offenen Auftrag |

### Markt (46xx), Fraktion (47xx), Bauprojekt (48xx)

| Code | Bedeutung |
|---|---|
| 4600 | zu wenig Credits |
| 4601, 4602 | Ware hier nicht kaufbar bzw. verkaufbar |
| 4603 | Markt nicht gefunden |
| 4604 | Handelsvolumen überschritten |
| 4700 | Wegpunkt ohne Fraktion |
| 4800 bis 4802 | Material nicht benötigt, bereits geliefert, falscher Ort |

## Für die Technik

- Die vollständige, aktuelle Liste liefert die interaktive Referenz (Abschnitt „error codes“ unter https://spacetraders.io/openapi). Der Client führt eine Übersetzungstabelle und zeigt für unbekannte Codes die Originalmeldung.
- Wiederholen nur bei 429, 502 und 5xx; bei 4000 nach Ablauf des Cooldowns, bei 4214 nach der Ankunft.
- Der Board-Computer bekommt bei fehlgeschlagenen Aktionen den Code und die übersetzte Meldung als Werkzeugergebnis (Issue #23).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/api-guide/response-errors, Changelog https://docs.spacetraders.io/resources/changelog
- [Rate-Limits](rate-limits.md)
