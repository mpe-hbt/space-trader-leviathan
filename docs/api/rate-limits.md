---
title: Rate-Limits
summary: Die API erlaubt 2 Anfragen pro Sekunde mit einem Burst von 30 Anfragen in 60 Sekunden, je IP-Adresse und je Account; Überschreitungen enden mit HTTP 429.
audience: [tech]
tags: [api, betrieb]
owner: Entwicklung
reviewed: 2026-11-13
---

# Rate-Limits

## Kurz gesagt

Die SpaceTraders-API begrenzt die Zahl der Anfragen ([Rate-Limit](../glossary/Rate-Limit.md)). Dauerhaft sind 2 Anfragen pro Sekunde erlaubt, kurzfristig zusätzlich ein Burst von 30 Anfragen innerhalb von 60 Sekunden. Das gilt getrennt je IP-Adresse und je Account. Wer zu viel sendet, bekommt HTTP 429; ein Schutz gegen Überlastung antwortet mit 502. Weil Oberfläche, Board-Computer und Routinen dasselbe Kontingent teilen, laufen im Client alle Anfragen durch eine zentrale [Request-Queue](../glossary/Request-Queue.md).

## Ablauf und Regeln

| Art | Status | Grenze | Burst | Burst-Dauer |
|---|---|---|---|---|
| IP-Adresse | 429 | 2 pro Sekunde | 30 | 60 Sekunden |
| Account | 429 | 2 pro Sekunde | 30 | 60 Sekunden |
| Überlastschutz | 502 | nicht veröffentlicht | – | – |

### Antwort-Header bei 429

| Header | Bedeutung |
|---|---|
| `retry-after` | Sekunden bis zum nächsten Versuch |
| `x-ratelimit-type` | welche Grenze überschritten wurde |
| `x-ratelimit-limit-per-second` | Dauergrenze |
| `x-ratelimit-limit-burst` | Burst-Grenze |
| `x-ratelimit-remaining` | verbleibende Anfragen im Zeitraum |
| `x-ratelimit-reset` | Zeitpunkt, an dem der Zeitraum endet |

Das JSON der Antwort enthält dieselben Werte unter `error.data` (Fehlercode 429).

### Regeln für den Client

1. Nur 429 mit `x-ratelimit-*`-Headern stammt vom Rate-Limiter. Auch die Cloud-Infrastruktur kann 429 liefern, dann ohne diese Header: exponentiell zurückweichen.
2. Bei 502 einige Minuten warten, nicht sofort wiederholen.
3. 4xx-Fehler außer 429 nicht wiederholen; sie sind fachliche Fehler ([Fehlercodes](fehlercodes.md)).
4. Prioritäten: Nutzeraktion vor Board-Computer vor Routinen vor Hintergrund-Scouting.

## Für die Technik

- Die Request-Queue im [Kern](../glossary/Kern.md) arbeitet als Token-Bucket mit 2 pro Sekunde und Burst-Reserve; sie passt sich an die Header an (Issue #6).
- Durchsatz-Rechnung: 2 Anfragen pro Sekunde sind 7.200 pro Stunde für alle Schiffe zusammen. Eine Abbau-Routine braucht je Zyklus etwa 5 bis 10 Anfragen; viele Schiffe teilen sich dieses Budget.
- Kennzahlen (Queue-Länge, Wartezeit, 429-Anzahl) zeigt die Diagnose-Ansicht (Issue #41).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/api-guide/rate-limits
- [Querschnittliche Konzepte](../arc42/08-konzepte.md)
