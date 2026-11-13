---
title: Authentifizierung
summary: Die API nutzt zwei Bearer-Tokens, den Account-Token zum Registrieren von Agents und den Agent-Token für alle Spielaktionen; der Client speichert beide verschlüsselt im Kern.
audience: [tech, domain]
tags: [api, sicherheit]
owner: Entwicklung
reviewed: 2026-11-13
---

# Authentifizierung

## Kurz gesagt

Für fast alle Anfragen braucht man einen [Agent-Token](../glossary/Agent-Token.md). Ihn bekommt man beim Registrieren eines Agents oder im Dashboard my.spacetraders.io. Zum Registrieren per API braucht man den [Account-Token](../glossary/Account-Token.md) aus dem Dashboard. Beide sind geheim und werden als `Authorization: Bearer <token>` gesendet. Agent-Tokens werden mit jedem [Server-Reset](../spacetraders/server-reset.md) ungültig.

## Account-Token und Agent-Token im Vergleich

| Token | Woher | Wofür | Lebensdauer |
|---|---|---|---|
| Account-Token | Dashboard, Einstellungen, „Generate Account Token“ | nur `POST /register` | bis zum Widerruf |
| Agent-Token | Antwort von `POST /register` oder Dashboard, „Generate Token“ | alle Endpunkte unter `/my/…` und Spielaktionen | bis zum nächsten Reset |

1. Account im Dashboard anlegen.
2. Agent registrieren: im Dashboard oder per `POST /register` mit `symbol` (Rufzeichen), `faction` und Account-Token.
3. Die Antwort enthält den Agent-Token sowie Agent, Fraktion, Auftrag und Schiffe.
4. Alle weiteren Anfragen tragen den Agent-Token.

Öffentliche Endpunkte (`GET /`, Systeme, Fraktionen, Ranglisten) gehen auch ohne Token, zählen aber zum [Rate-Limit](rate-limits.md).

### Typische Fehler

- `Bearer` fehlt im Header: Fehler 4103.
- Token ungültig oder nach Reset abgelaufen: Fehler 4100 bis 4108.
- Rufzeichen vergeben oder reserviert: Fehler 4109 bis 4111.

## Für die Technik

- Gemäß ADR-01 (siehe [Entscheidungen](../decisions.md)) liegen alle Tokens im [Kern](../glossary/Kern.md), verschlüsselt über Electron `safeStorage`. Der [Renderer](../glossary/Renderer.md) und der Board-Computer sehen sie nie.
- Der Client verwaltet mehrere Agents und erkennt abgelaufene Tokens nach einem Reset (Issue #7).
- Tokens erscheinen nicht in Logs (Issue #41) und nie im Modellkontext des Board-Computers (Issue #26).

## Bezüge

- Offizielle Doku: https://docs.spacetraders.io/api-guide/authorization und https://docs.spacetraders.io/quickstart/new-game
- [Fehlercodes](fehlercodes.md)
