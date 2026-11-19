---
title: "Vector data on Kubernetes"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Vector data on Kubernetes

## Kubernetes runtime

In a Kubernetes runtime, an administrator installs the [vector data service](./vector-data-service.md) in the [landscape](../../reference/glossary.md#landscape) cluster. The Kubernetes landscape orchestrator pushes vector data to the landscape cluster as `ConfigMap` resources.

The [vector data service](../../reference/glossary.md#vector-data-service) reads those `ConfigMap` resources and provides an OpenFeature-compatible API. Workloads use that API to read vector data by vector ID.


## Use the data in an application

- [Access vector data in your application](./access-vector-data.md)
- [Read feature flags in your application](./feature-flags.md)
- [Use deployment results](./deployment-results.md)

The shared [Vector data](../../core/vector-data.md) model defines the values and their relationship to a vector.
