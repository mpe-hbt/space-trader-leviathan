---
title: Märkte und Handel
summary: Märkte handeln Exporte, Importe und Austauschwaren zu Preisen aus Angebot und Nachfrage; Preise sieht nur, wer ein Schiff vor Ort hat.
audience: [business, domain, tech]
tags: [spacetraders, handel]
owner: Produktverantwortung
reviewed: 2026-11-13
---

# Märkte und Handel

## Kurz gesagt

An Wegpunkten mit dem Merkmal MARKETPLACE gibt es einen [Markt](../glossary/Markt.md). Jede [Handelsware](../glossary/Handelsware.md) ist dort entweder [Export](../glossary/Export.md) (wird hergestellt, meist billig), [Import](../glossary/Import.md) (wird verbraucht, meist teuer) oder [Austauschware](../glossary/Austauschware.md) (nur zwischen Agents gehandelt). Die einfachste Gewinnregel: am Export-Markt kaufen, am Import-Markt verkaufen. Preise und Transaktionen sieht man nur mit einem Schiff vor Ort, deshalb parkt man billige [Sonden](../glossary/Sonde.md) an Märkten. Aktuelle Marktdaten über die Zeit sind der größte Vorteil im Handel.

## Preisbildung

- **Exporte:** Der Kaufpreis fällt mit der Zeit, weil Produktion Angebot schafft. Kaufen Agents viel, steigt die Produktion, aber nur, wenn die nötigen Importe geliefert werden ([Lieferkette](../glossary/Lieferkette.md)).
- **Importe:** Der Verkaufspreis steigt mit der Zeit, weil Verbrauch das Angebot senkt. Liefern Agents viel, steigt der Verbrauch und der Preis fällt.
- **Austauschwaren:** Preis nur aus dem Handel der Agents. [Treibstoff](../glossary/Treibstoff.md) ist die häufigste; an belebten Orten kann er sehr teuer werden.
- **Wachstum:** Kleine Märkte starten mit wenigen Waren und wachsen durch Handel. Gut versorgte Märkte bieten stabilere Margen.

## Kennzahlen je Ware

| Feld | Bedeutung |
|---|---|
| `purchasePrice` / `sellPrice` | Kauf- bzw. Verkaufspreis für den Agent |
| `supply` | [Angebot](../glossary/Angebot.md): SCARCE, LIMITED, MODERATE, HIGH, ABUNDANT |
| `activity` | [Aktivität](../glossary/Aktivität.md): WEAK, GROWING, STRONG, RESTRICTED |
| `tradeVolume` | [Handelsvolumen](../glossary/Handelsvolumen.md): Höchstmenge je Transaktion; groß heißt stabiler Preis |
| `type` | EXPORT, IMPORT oder EXCHANGE |

Größere Mengen kauft oder verkauft man in mehreren Transaktionen; jede verschiebt den Preis.

## Ablauf: Waren verkaufen

1. Schiff am Markt andocken.
2. Markt abfragen, um aktuelle Preise und Handelsvolumen zu sehen.
3. Verkaufen mit Ware und Menge (höchstens Handelsvolumen je Transaktion).
4. Die Antwort enthält neue Credits, Fracht und die Transaktion mit `totalPrice`.

## Für die Technik

| Aktion | Endpunkt |
|---|---|
| Markt ansehen | `GET /systems/{systemSymbol}/waypoints/{waypointSymbol}/market` |
| Kaufen / Verkaufen | `POST /my/ships/{shipSymbol}/purchase`, `/sell` mit `symbol`, `units` |
| Lieferketten | `GET /market/supply-chain` |

Fehlercodes 4600 bis 4604 ([Fehlercodes](../api/fehlercodes.md)). Der Client speichert Marktpreise als Zeitreihe mit Zeitstempel (Issue #8), zeigt sie in der Marktansicht (#16), hält sie per Sonden-Routine aktuell (#36) und nutzt sie für Handelsrouten (#35).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/game-concepts/markets und https://docs.spacetraders.io/quickstart/sell-cargo
