---
title: "arc42 Kapitel 8: Querschnittliche Konzepte"
summary: Konzepte, die den ganzen Client betreffen, darunter Request-Queue, Cache, Routinen, Board-Computer, Sicherheit, Fehlerbehandlung und Domänensprache.
audience: [tech, domain]
tags: [arc42, konzepte, board-computer]
owner: Architektur
reviewed: 2026-11-13
---

# 8 Querschnittliche Konzepte

## Kurz gesagt

Sieben Konzepte ziehen sich durch den ganzen Client: eine gemeinsame [Request-Queue](../glossary/Request-Queue.md), ein lokaler Cache als einzige Datenquelle der Oberfläche, [Routinen](../glossary/Routine.md) als Zustandsautomaten, der [Board-Computer](../glossary/Board-Computer.md) mit Bestätigungspflicht, strikte Trennung der Geheimnisse, einheitliche Fehlerbehandlung und die Domänensprache aus dem Glossar.

## Request-Queue

- Alle Anfragen an SpaceTraders laufen durch eine Queue im [Kern](../glossary/Kern.md); niemand ruft die API direkt auf.
- Token-Bucket nach den [Rate-Limits](../api/rate-limits.md), angepasst an die Antwort-Header.
- Prioritäten: Nutzeraktion > Board-Computer > Routine > Hintergrund.
- Wiederholen nur bei 429 (mit `retry-after`), 502 (Minuten warten) und 5xx (exponentiell).

## Cache und Datenaktualität

- SQLite hält den Spielzustand je [Server-Reset](../spacetraders/server-reset.md).
- Antworten auf Aktionen werden direkt übernommen (sie enthalten `nav`, `fuel`, `cargo`, `agent` usw.), statt neu abzufragen.
- Marktpreise sind Zeitreihen mit Zeitstempel; jede Anzeige nennt das Alter der Daten.
- Systeme und Wegpunkte werden einmal je Reset und nur bei Bedarf geladen.
- Der Kern meldet Änderungen als Ereignisse an den Renderer.

## Routinen

- Eine Routine ist ein Zustandsautomat je [Schiff](../glossary/Schiff.md); ein Schiff hat höchstens eine.
- Der Scheduler weckt Routinen zur Ankunfts- oder Cooldown-Zeit, statt zu pollen.
- Der Zustand wird nach jedem Schritt gespeichert; nach Neustart werden verpasste Zeitpunkte nachgeholt.
- Eine manuelle Aktion am Schiff pausiert dessen Routine. Ein Not-Aus stoppt alle.

## Board-Computer

- **Rolle:** Schiffs-KI des Spielers mit eigener Persona. Er beantwortet Fragen mit echten Daten, schlägt Aktionen vor und erkennt Aufgaben für dieses Projekt.
- **Modell:** Standard `claude-opus-5-5` mit adaptivem Denken und einstellbarem Aufwand, Streaming, Prompt-Caching über einen stabilen Systemprompt und eine feste Werkzeugliste. Das Modell ist einstellbar.
- **Werkzeuge:** lesend (aus dem Cache, mit Datenalter) und schreibend (nur über Bestätigung). Werkzeuge sind mit `strict: true` definiert; erzwungene Werkzeugwahl wird nicht genutzt.
- **Bestätigung:** Jede schreibende Aktion und jedes Issue zeigt eine Karte mit Was, Kosten und Folgen; ohne Klick geschieht nichts. Abgelehnte Aktionen gehen als abgelehnt an Claude zurück.
- **Issue-Anlage:** Vorschlag mit Ziel, Aufgaben, Akzeptanzkriterien und Labels, Duplikatsuche, Anlage nach Bestätigung über die GitHub-API.
- **Kosten:** Tageslimit je Agent; Verbrauch in Tokens und Kosten sichtbar.
- **Stoppgründe:** `refusal` und `max_tokens` werden verständlich angezeigt.

## Sicherheit: wo Tokens und API-Keys gespeichert werden

- Geheimnisse (Agent-Token, Account-Token, Anthropic-Key, GitHub-Token) liegen nur im Kern, verschlüsselt über `safeStorage`. Sie erscheinen nie im Renderer, in Logs oder im Modellkontext.
- Renderer: `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`, strikte CSP, keine Remote-Inhalte.
- IPC-Eingaben werden im Kern geprüft.
- **Prompt-Injection:** Namen von Agents, Schiffen und Wegpunkten stammen von Dritten. Werkzeugergebnisse kennzeichnen sie als Daten; schreibende Aktionen und Issues brauchen immer eine Bestätigung. Ein Audit-Log hält alle Werkzeugaufrufe fest.

## Fehlerbehandlung

- Der API-Client bildet jede Fehlerantwort auf ein einheitliches Objekt ab ([Fehlercodes](../api/fehlercodes.md)).
- Die Oberfläche zeigt eine verständliche Meldung mit Handlungsvorschlag statt eines Codes.
- Routinen unterscheiden wiederholbare von fachlichen Fehlern.

## Domänensprache

- Begriffe in Code, Oberfläche, Doku und Board-Computer kommen aus dem [Glossar](12-domaenensprache.md). Code-Namen folgen der SpaceTraders-API (z. B. `Ship`, `Waypoint`, `Contract`).
- Neue Begriffe kommen zuerst ins Glossar.

## Bezüge

- [Kapitel 5: Bausteinsicht](05-bausteinsicht.md), [Kapitel 6: Laufzeitsicht](06-laufzeitsicht.md), Issues #6, #8, #21 bis #26, #32
