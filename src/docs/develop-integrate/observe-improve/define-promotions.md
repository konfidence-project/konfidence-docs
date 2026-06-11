---
title: Define promotions
description: Learn how to define and manage promotions to guide vectors through your delivery stages.
outline: [2, 3]
editLink: true
lastUpdated: true
---

<!-- 
  Content type (Diátaxis): How-to guide — user wants to define promotion rules that move vectors through stages automatically or with approvals.
  TW will structure this as: what a promotion is → create a VectorPromotion resource → configure rules → trigger and monitor.

  Dev input needed:
  - What does a minimal VectorPromotion YAML resource look like?

  Ticket: DOCS — How to Define Promotions
-->

# Define promotions

Promotions describe how vectors progress through your delivery pipeline from development through production. They define the rules and approvals for moving between stages.

## Promotion workflow

### Stage transitions

Each promotion defines:

- Source stage (where vector currently resides)
- Target stage (where vector will be promoted)
- Any required gates or checks (e.g., tests, manual approval)

## Configuring promotions

### VectorPromotion resource

* define source/target vector in `PromotionConfig` resource
* how to trigger manually with `VectorPromotion` resource

### Gates

* not implemented right now, but we can explain the concept and how it would fit in the promotion workflow?

### Automation

* not implemented right now, but we can explain how promotions could be automated?