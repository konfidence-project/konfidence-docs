---
title: "Vector data"
scope: "Konfidence core"
editLink: false
lastUpdated: false
description: Understand how vector data provides vector-scoped runtime data to applications.
outline: [2, 3]
---
# Vector data

[Vector data](../reference/glossary.md#vector-data) is runtime data that belongs to a specific [vector deployment](../reference/glossary.md#vectordeployment). Applications use it to resolve [feature flags](../reference/glossary.md#feature-flag), authored configuration values, and [deployment results](../reference/glossary.md#deployment-result) by [vector](../reference/glossary.md#vector) ID.

## How vector data reaches the runtime

Konfidence stores vector data in the `VectorData` custom resource. How this data reaches applications depends on the runtime integration. The Kubernetes guides describe KLO and its vector data service.

The runtime must provide a way for applications to read vector data by vector ID. This keeps runtime data scoped to the vector that is currently handling the request or workload.

## Read the data in a Kubernetes workload

[Vector data on Kubernetes](../deployers/kubernetes/vector-data.md) explains how KLO materializes the data and how the vector data service exposes it to applications.

## Data types

Vector data contains three data types:

| Data type | Purpose |
| --- | --- |
| Feature flags | Toggle behavior for features or code paths in the application. Multiple services in the same vector can read the same flag values and behave consistently. |
| Authored config | Pass arbitrary configuration values to the application. |
| Deployment results | Pass deployment-generated information into the landscape, such as service endpoints, generated URLs, identities, and allocated resources. |

## Deployment-generated data

[Deployment results](./deployment-results.md) explains what deployers report and how Konfidence aggregates it.
