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

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to define and run database migrations as part of a vector deployment.
  TW will structure this as: Prerequisites → define migration task in component descriptor → deploy → verify execution.

  Dev input needed:
  
  Ticket: DOCS — How to run Migrations
-->