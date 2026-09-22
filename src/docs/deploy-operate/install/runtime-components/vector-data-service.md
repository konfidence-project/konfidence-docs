---
title: Install the Vector Data Service
description: Install the Vector Data Service in a Kubernetes landscape so applications can resolve vector data at runtime.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install the Vector Data Service {#vector-data-service}

Install the Vector Data Service in a Kubernetes landscape to make vector data available to applications running there. This is a landscape-level task, performed after the landscape namespace exists.

The vector data service lets applications resolve vector data for a specific vector at runtime:

- feature flags,
- authored configuration values, and
- [deployment results](../../../develop-integrate/vector-data/deployment-results.md), such as service endpoints, URLs, identities, and other data produced by deployers which are required for service-to-service communication.

Because accessing this data is essential for core features of Konfidence, it's recommended to always install the vector data service.

## Prerequisites

- A [ready landscape](../../manage-delivery/landscapes.md#verify-the-landscape) and its managed namespace.
- The [Kubernetes deployer](../deployer/kubernetes.md), which publishes vector data in the landscape.
- Helm with OCI registry support and Kubernetes permissions to install the service's chart into that landscape namespace.

## Install the vector data service

Install the service in each Kubernetes landscape namespace. Replace `<landscape-namespace>` with the namespace reported by the Landscape:

```bash
helm upgrade --install vector-data-service oci://ghcr.io/konfidence-project/charts/vector-data-service \
  --create-namespace \
  --namespace "<landscape-namespace>" \
  --wait
```

After installation, workloads in that namespace can reach the service at `http://vector-data-service`.

## Protocol compatibility

The vector data service implements the REST endpoints defined by the [OpenFeature Remote Evaluation Protocol (OFREP) specification](https://openfeature.dev/docs/reference/other-technologies/ofrep/openapi). Applications should use an OpenFeature client with a standard [OFREP-compatible provider](https://openfeature.dev/ecosystem), but they can also call the REST endpoints directly without a provider.
More information can be found in the [Access Vector Data Section](../../../develop-integrate/vector-data/access-vector-data.md) of the Develop & Integrate section.

## Next steps

- [Create a stage](../../manage-delivery/stages.md) to deliver a vector into the prepared landscape.
- [Access vector data in your application](../../../develop-integrate/vector-data/access-vector-data.md) explains how applications use the service.
