---
title: AGENTS.md
summary: Regeln für Agenten: Wissensbasis, Entscheidungen, Domänensprache und Umgang mit internen Inhalten.
audience: [tech]
owner: Architektur
reviewed: 2026-11-13
---

# AGENTS.md

<!-- knowledge-base -->
## Knowledge base

The project knowledge (public docs, an optional private **project sidecar** readable by project members only, and optional **HBT-wide knowledge** readable by all employees) is searchable through the [knowledge tool](https://github.com/HBTGmbH/hbt-leviathan-hack26): MCP server `knowledge` with the tools `search`, `read`, `define`, `overview` and `decisions`, and for maintenance `decide`, `term`, `new_page`, `audit`, `fitness`, `status` and `check`.

- Look things up before answering questions about the domain, processes, terms, architecture or decisions, and before changing code whose business meaning is unclear. Cite the `id` of the source.
- **Decisions** form one register: public ADRs (arc42 chapter 9) and internal ones (`ADR-Inn` project, `ADR-HBT-nn` HBT-wide). Check `decisions <topic>` before changing architecture, flows or rules; record new ones with `decide` (scope `public`, `intern` or `hbt`). Superseded decisions stay, marked „abgelöst durch ADR-nn“.
- The glossary is the binding **domain language**: one term per thing. Name things in docs, UI texts, comments and new code with the glossary term or its code name; replace words listed under „Nicht verwenden“ (`define <word>` tells you the right term). Add a new term to the glossary before using it. Each term is a note (`docs/glossary/<Term>.md`); link it with a normal relative Markdown link (no `[[…]]` wikilinks in this repository — they belong to the private Obsidian knowledge modules only); `audit` reports deviations.
- Results marked **INTERN** (project sidecar) or **INTERN:HBT** (HBT-wide) are private: use them to understand, never copy them, literally or paraphrased, into code, comments, test data, commits, issues, PRs or public docs, and never copy project knowledge into HBT-wide knowledge. A hook blocks literal copies; `check` scans the repository.
- New knowledge goes where it belongs: public (arc42, glossary, this file) for architecture, code and UI terms; the project sidecar for internal processes, customers, sales and operations of this project (when in doubt, here); HBT-wide knowledge only for what applies to all projects and reveals nothing about this one.
