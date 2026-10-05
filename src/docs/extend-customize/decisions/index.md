---
title: Architecture decisions
description: Architecture decision records (ADRs) that explain why the maintainers designed Konfidence the way it is.
outline: deep
editLink: true
lastUpdated: true
---

# Architecture decisions

Architecture decision records (ADRs) explain why the maintainers designed Konfidence the way it is.
Read them before you change a component, so you know which trade-offs it already makes.
Each record covers one decision: its context, the options the maintainers compared, and the consequences.

## Every record has a status

| Status | Meaning |
| --- | --- |
| <Badge type="info" text="draft" /> | The author is still writing the record. |
| <Badge type="info" text="proposed" /> | The record is ready for review by the maintainers. |
| <Badge type="tip" text="accepted" /> | The maintainers approved the decision. The code follows it. |
| <Badge type="danger" text="rejected" /> | The maintainers considered the decision and did not adopt it. |
| <Badge type="warning" text="deprecated" /> | A later decision replaced this one. The record stays to explain how the current design came about. |

ADR numbers never change and never get reused.
Gaps in the list are records that are superseded, internal to the project, or still lack a decision.

## Decision log

<AdrLog />

## Propose a new decision

Write an ADR when a change spans several components or is expensive to reverse.
Write one too when it sets a pattern other contributors must follow.
ADRs live in the [konfidence-docs repository](https://github.com/konfidence-project/konfidence-docs/tree/main/src/docs/extend-customize/decisions).
Propose a record as a pull request there.

1. Take the next free number after the highest ADR in the decision log.
2. Create `adr-<NNNN>-<slug>.md` in `src/docs/extend-customize/decisions/`.
3. Start the file with this frontmatter, the heading, and the `<AdrHeader />` component:

   ```markdown
   ---
   id: ADR-<NNNN>
   title: "<Short title>"
   description: "<One sentence: what the record decides>"
   status: proposed
   date_proposed: <YYYY-MM-DD>
   authors: [<github-handle>]
   category: <Architecture Pattern | Technology Stack | Security | Deployment>
   impact: <High | Medium | Low>
   dependencies: [<ADR-NNNN>]
   pageClass: adr
   outline: deep
   ---

   # ADR-<NNNN>: <Short title>

   <AdrHeader />
   ```

4. Write the sections **Context**, **Considered options**, **Decision** and **Consequences**.
5. Put diagrams into `assets/` and reference them as `./assets/<file>`.
6. Open the pull request with status `proposed`.

The maintainers review the record in the pull request.
On merge, they set `status: accepted` and `date_approved`.
The sidebar and the decision log pick up the new file automatically.

List authors by GitHub handle only.
Records never name people, internal systems, or private repositories.
