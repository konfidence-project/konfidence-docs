---
title: Define promotions
description: Learn how to define and manage promotions to guide vectors through your delivery stages.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Define promotions

Promotions describe how vectors progress through your delivery pipeline from development through production.

## Promotion workflow

### Stage transitions

Each promotion defines:

- Source stage (where vector currently resides)
- Target stage (where vector will be promoted)

## Configuring promotions

### VectorPromotion resource

* define source/target vector in `VectorPromotionConfig` resource
* how to trigger manually with `VectorPromotion` resource

::: info
Promotion gates, approvals, and automated promotions are not part of the current release. Promotions are triggered manually.
:::