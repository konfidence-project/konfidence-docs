---
title: Overview
description: Learn how to use vector-scoped configuration to manage settings that are specific to individual vectors.
outline: [2, 3]
editLink: true
lastUpdated: true
---

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to pass information that results out of a deployment into the landscape 
-->

# Deployment results

[//]: # (TODO: how can app developers define deployment results?)

*   You don't author these — Konfidence computes them as a side effect of deploying the vector (service endpoints, generated URLs, identities, allocated resources, …) and merges them into the same bundle the app reads.
*   Each producing deployer writes deployment results to the corresponding `ArtifactDeployment`. Deployment results are aggregated into the `VectorData` CR on the LCP (via `VectorDeployment` status). The landscape orchestrator reads the `VectorData` and passes it to landscape as ConfigMap.
*   Read them at runtime through the same OFREP call alongside features and authored config — your app picks them up by name (deploymentResults.orders-db) when it asks the central service.
*   No prior knowledge of addresses required. You don't have to know up-front what URL/identity another component in the vector will get — the platform fills it in at deploy time and your app reads it back by name.