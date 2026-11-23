---
title: Overview
description: Understand how vector data provides vector-scoped runtime data to applications.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Overview

[Vector data](../../reference/glossary.md#vector-data) is runtime data that belongs to a specific [vector deployment](../../reference/glossary.md#vectordeployment). Applications use it to resolve [feature flags](../../reference/glossary.md#feature-flag), authored configuration values, and [deployment results](../../reference/glossary.md#deployment-result) by [vector](../../reference/glossary.md#vector) ID.

## How vector data reaches the runtime

Konfidence stores vector data in the `VectorData` custom resource. The [landscape orchestrator](../../reference/glossary.md#landscape-orchestrator) reads the `VectorData` resource and passes the data to the target runtime.

The runtime must provide a way for applications to read vector data by vector ID. This keeps runtime data scoped to the vector that is currently handling the request or workload.

For the Kubernetes implementation, see [Vector data on Kubernetes](./kubernetes.md).

## Data types

Vector data contains three data types:

| Data type | Purpose |
| --- | --- |
| Feature flags | Toggle behavior for features or code paths in the application. Multiple services in the same vector can read the same flag values and behave consistently. |
| Authored config | Pass arbitrary configuration values to the application. |
| Deployment results | Pass deployment-generated information into the landscape, such as service endpoints, generated URLs, identities, and allocated resources. |

## Deployment results

Deployment results are values that deployers produce while deploying an artifact, such as service endpoints, generated URLs, identities, and allocated resources. You do not author them in vector configuration.

Each producing deployer writes results to the corresponding `ArtifactDeployment`. Konfidence aggregates them into `VectorData` through the `VectorDeployment` status. The runtime integration makes that data available to applications.

The producing artifact must have been deployed. Its results are available from that point, including during migration, before the vector is activated.

In `deploymentResults`, entries are grouped by component name. Each result has a `name`, a `type`, and a `spec`. The pair `(name, type)` must be unique within a component. The producing deployer determines the result type and its specification.

::: warning
The deployment result schema is not final and may change in a future release.
:::

For Kubernetes Service annotations and address lookup, see [Use deployment results](./deployment-results.md).
