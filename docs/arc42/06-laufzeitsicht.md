---
title: "arc42 Kapitel 6: Laufzeitsicht"
summary: Die wichtigsten Abläufe zur Laufzeit, von der Navigation per Klick über einen Routinen-Zyklus bis zur Frage an den Board-Computer und zur Issue-Anlage.
audience: [tech, domain]
tags: [arc42, ablauf]
owner: Architektur
reviewed: 2026-11-13
---

# 6 Laufzeitsicht

## Kurz gesagt

Vier Abläufe prägen den Client: eine Nutzeraktion wie die Navigation, ein Zyklus einer [Routine](../glossary/Routine.md), eine Frage an den [Board-Computer](../glossary/Board-Computer.md) mit Werkzeugaufrufen und die Anlage eines GitHub-Issues aus dem Chat. Allen gemeinsam: Jede Anfrage an SpaceTraders läuft durch die [Request-Queue](../glossary/Request-Queue.md), und jede Antwort aktualisiert den Cache, der die Oberfläche benachrichtigt.

## Navigation per Klick

```mermaid
sequenceDiagram
  participant R as Renderer
  participant K as Kern
  participant Q as Request-Queue
  participant S as SpaceTraders
  R->>K: navigiere(Schiff, Ziel, Flugmodus)
  K->>K: Treibstoff prüfen, ggf. Route mit Tankstopp
  K->>Q: orbit (falls angedockt), Priorität hoch
  Q->>S: POST /orbit
  K->>Q: navigate
  Q->>S: POST /navigate
  S-->>K: nav (Ankunft), fuel
  K-->>R: Ereignis: Schiff im Transit bis …
  K->>K: Ankunft vormerken
```

## Routinen-Zyklus Abbau und Verkauf

1. Scheduler weckt die Routine, wenn Ankunft oder Cooldown abgelaufen ist.
2. Routine liest den Zustand aus dem Cache und wählt den nächsten Schritt: Survey, Abbau, Abwerfen, Navigation zum Markt, Verkaufen, Tanken oder Rückflug.
3. Der Schritt geht mit Priorität „Automatisierung“ in die Queue.
4. Die Antwort aktualisiert Cache und Protokoll; der neue Zustand wird gespeichert.
5. Fehler: wiederholbar wird später erneut versucht, fachlich pausiert die Routine und benachrichtigt den Spieler.

## Frage an den Board-Computer

1. Der Spieler fragt im Chat, optional mit Kontext (aktuelle Ansicht, gewähltes Schiff).
2. Der Kern sendet Verlauf, Systemprompt und Werkzeugliste an Claude (Streaming).
3. Claude ruft lesende Werkzeuge auf; der Kern beantwortet sie aus dem Cache, gekennzeichnet als Daten.
4. Schreibende Werkzeuge erzeugen eine Bestätigungskarte. Erst nach „Ausführen“ geht die Aktion in die Queue; das Ergebnis oder die Ablehnung geht an Claude zurück.
5. Die Antwort erscheint gestreamt; Verweise auf Schiffe und Wegpunkte sind klickbar.

## Wie der Board-Computer ein GitHub-Issue anlegt

1. Claude erkennt eine fehlende Funktion oder einen Fehler und ruft das Issue-Werkzeug mit Titel, Ziel, Aufgaben und Akzeptanzkriterien auf.
2. Der Kern sucht offene Issues nach Duplikaten und zeigt Vorschlag und Treffer als Karte.
3. Der Spieler bearbeitet, verwirft oder bestätigt.
4. Nach Bestätigung legt der GitHub-Dienst das Issue an; der Link erscheint im Chat und im Audit-Log.

## Server-Reset

Beim Start und regelmäßig prüft der Kern `GET /`. Ändert sich `resetDate`, stoppt er alle Routinen, archiviert den alten Datenstand und führt den Spieler zur Registrierung eines neuen Agents ([Server-Reset](../spacetraders/server-reset.md)).

## Bezüge

- [Kapitel 5: Bausteinsicht](05-bausteinsicht.md), [Navigation](../spacetraders/navigation.md), [Abbau](../spacetraders/abbau.md)
