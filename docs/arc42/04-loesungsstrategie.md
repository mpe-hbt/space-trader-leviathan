---
title: "arc42 Kapitel 4: Lösungsstrategie"
summary: Eine Electron-App mit einem Kern, der Geheimnisse, API-Zugriffe, Cache, Routinen und Claude kapselt, und einer React-Oberfläche mit WebGL-Karten.
audience: [tech]
tags: [arc42, strategie]
owner: Architektur
reviewed: 2026-11-13
---

# 4 Lösungsstrategie

## Kurz gesagt

Alles, was geheim, langlebig oder rate-limitiert ist, liegt im [Kern](../glossary/Kern.md) im Electron-Hauptprozess. Die Oberfläche ([Renderer](../glossary/Renderer.md)) ist reine Darstellung und spricht nur über eine typisierte IPC-Schnittstelle mit dem Kern. Der Kern hält einen lokalen Cache, damit die Oberfläche sofort reagiert und die API geschont wird. Grundlage ist ADR-01 in [Entscheidungen](../decisions.md).

## Strategie je Qualitätsziel

| Qualitätsziel | Ansatz |
|---|---|
| Sicherheit | Geheimnisse nur im Kern, verschlüsselt über `safeStorage`; Renderer mit `contextIsolation`, `sandbox`, strikter CSP; Board-Computer-Aktionen nur nach Bestätigung |
| Zuverlässigkeit | eine [Request-Queue](../glossary/Request-Queue.md) für alle API-Aufrufe; Routinen als persistierte Zustandsautomaten; Daten je Reset getrennt |
| Benutzbarkeit | Design-System, Aktionen mit automatischen Zwischenschritten (Orbit vor Navigation), verständliche Fehlermeldungen, Board-Computer als Hilfe |
| Performance | PixiJS (WebGL) mit Level-of-Detail für die Karten; Daten aus dem Cache statt aus der API |

## Technologien

| Bereich | Wahl |
|---|---|
| Laufzeit | Electron, durchgehend TypeScript |
| Oberfläche | React, Vite (`electron-vite`), TanStack Query, PixiJS |
| Kern | Node im Hauptprozess, SQLite als Cache |
| API-Client | aus der OpenAPI-Spezifikation erzeugt (Issue #5) |
| Board-Computer | `@anthropic-ai/sdk`, Standardmodell `claude-opus-5-5`, Streaming, Werkzeugaufrufe |
| Auslieferung | `electron-builder`, Auto-Update über GitHub Releases |

## Zerlegung

Der Kern ist ohne Electron testbar; Electron-spezifische Teile (Fenster, Tray, `safeStorage`, IPC) liegen in einer dünnen Adapterschicht. So bleibt ein späterer Betrieb als Server möglich.

## Bezüge

- [Kapitel 5: Bausteinsicht](05-bausteinsicht.md), [Kapitel 8: Konzepte](08-konzepte.md)
