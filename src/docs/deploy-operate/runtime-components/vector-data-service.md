---
title: Vector data service
description: Learn what the vector data service does and when to install it.
---

# Vector data service

This guide explains when to install the vector data service in a Kubernetes landscape and what it provides to workloads at runtime.

The vector data service lets applications resolve vector data for a specific vector at runtime:

- feature flags,
- authored configuration values, and
- [deployment results](../../develop-integrate/vector-data/deployment-results.md), such as service endpoints, URLs, identities, and other data produced by deployers which are required for service-to-service communication.

Because accessing this data is essential for core features of Konfidence, it's recommended to always install the vector data service.

## Install the vector data service

The vector data service must be installed in each Kubernetes landscape namespace which can be done via helm:
```bash
helm upgrade --install vector-data-service oci://ghcr.io/konfidence-project/charts/vector-data-service \
  --create-namespace \
  --namespace "<landscape-namespace>" \
  --wait
```

After installation, workloads in that namespace can reach the service at `http://vector-data-service`.

## Protocol compatibility

The vector data service implements the REST endpoints defined by the [OpenFeature Remote Evaluation Protocol (OFREP) specification](https://openfeature.dev/docs/reference/other-technologies/ofrep/openapi). Applications should use an OpenFeature client with a standard [OFREP-compatible provider](https://openfeature.dev/ecosystem), but they can also call the REST endpoints directly without a provider.
More information can be found in the [Access Vector Data Section](../../develop-integrate/vector-data/access-vector-data.md) of the Develop & Integrate section.
