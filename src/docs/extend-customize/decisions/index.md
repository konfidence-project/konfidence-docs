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
Open an issue in the [Konfidence GitHub organization](https://github.com/konfidence-project) first.
The maintainers confirm there whether the change needs a record.

A record contains these sections:

1. **Context**: the problem, the constraints, and the current state.
2. **Considered options**: each option with its pros and cons.
3. **Decision**: the option you chose and why.
4. **Consequences**: what gets better, what gets worse, and what follow-up work it creates.
