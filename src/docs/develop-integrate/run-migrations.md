---
title: Run Migrations
description: Learn how to define and execute migrations as part of your vector deployment lifecycle in Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Run Migrations

## Define migrations

* Konfidence task-manifest in component constructor
* assumptions that we make around migrations:
  * they are idempotent
  * they can be run multiple times without side effects
  * they are safe to run in parallel (if needed)

