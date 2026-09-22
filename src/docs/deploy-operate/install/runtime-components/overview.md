---
title: Choose landscape services
description: Choose services that provide runtime capabilities alongside applications in a landscape.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Choose landscape services {#runtime-components-overview}

Choose the services your applications need in a landscape before creating its stages. Landscape services run alongside application workloads in the target environment and provide capabilities such as access to vector data.

## What are landscape services? {#what-are-runtime-components}

These services were previously described as runtime components. Configure them for each landscape after its namespace exists. Their use depends on the capabilities your applications need; check each service's guidance rather than treating every service as optional.

## Installation and administration

An administrator installs landscape services manually. Before installing one, [create a landscape](../../manage-delivery/landscapes.md) and [configure its deployment targets](../../manage-delivery/deployment-targets.md). Use the namespace from the landscape status and the Kubernetes permissions listed in the service's guide.

## Available landscape services {#available-runtime-components}

The current documentation covers the following service:

| Service | Purpose | When to install |
| --- | --- | --- |
| [Vector Data Service](./vector-data-service.md) | Provides runtime access to [vector data](../../../develop-integrate/vector-data/overview.md), including feature flags, configuration, and deployment results | Recommended in every Kubernetes landscape; applications use it to resolve vector data at runtime |

## Next steps

- [Install the Vector Data Service](./vector-data-service.md) in your landscape namespace.
- [Create a stage](../../manage-delivery/stages.md) once the landscape's targets, registry credentials, and needed services are configured.
