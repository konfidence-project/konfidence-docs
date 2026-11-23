---
title: Vector data on Kubernetes
description: Understand how the Kubernetes landscape orchestrator and Vector Data Service make vector data available to applications.
outline: [2, 3]
---

# Vector data on Kubernetes

The [vector data model](./overview.md) defines the configuration and deployment results associated with a vector deployment. The Kubernetes runtime makes that data available through the Vector Data Service.

## Kubernetes runtime

In a Kubernetes runtime, an administrator installs the [vector data service](../../deploy-operate/install/runtime-components/vector-data-service.md) in the [landscape](../../reference/glossary.md#landscape) cluster. The Kubernetes landscape orchestrator pushes vector data to the landscape cluster as `ConfigMap` resources.

The [vector data service](../../reference/glossary.md#vector-data-service) reads those `ConfigMap` resources and provides an OpenFeature-compatible API. Workloads use that API to read vector data by vector ID.

## Prepare the runtime

An administrator [installs the Vector Data Service](../../deploy-operate/install/runtime-components/vector-data-service.md) in each Kubernetes landscape that needs it. The Kubernetes deployer publishes vector data in that landscape.

## Read data in your application

- [Access vector data in your application](./access-vector-data.md) describes vector IDs, OFREP requests, and caching.
- [Read feature flags in your application](../advanced-features/feature-flags.md) provides OpenFeature examples.
- [Use deployment results](./deployment-results.md) describes Kubernetes Service discovery.
