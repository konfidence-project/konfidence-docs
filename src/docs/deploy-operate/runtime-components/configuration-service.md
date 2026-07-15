---
title: Configuration service
description: Learn what the configuration service does and when to install it.
---

<!-- 
  Content type (Diátaxis): How-to guide — operator installs configuration service into their k8s runtime
-->

# Configuration service

This guide explains when to install the configuration service in a Kubernetes landscape and what it provides to workloads at runtime.

The configuration service lets applications resolve vector data for a specific vector at runtime:

- feature flags,
- authored configuration values, and
- [deployment results](../../develop-integrate/vector-data/deployment-results.md), such as service endpoints, URLs, identities, and other data produced by deployers.

Because deployment results carry the addresses that other components in the same vector need to reach each other, the configuration service is a required runtime component for service-to-service communication inside a vector.

## Prerequisites

- The landscape cluster can receive the `ConfigMap` resources that contain vector data from the Kubernetes landscape orchestrator.
- Applications that read vector data can make HTTP requests to the configuration service.

## Install the configuration service

Install the configuration service in each Kubernetes landscape cluster where workloads need to read vector data at runtime.

You also need the configuration service when workloads use deployment results for service-to-service communication inside a vector.

## Protocol compatibility

The configuration service implements the REST endpoints defined by the [OpenFeature Remote Evaluation Protocol (OFREP) specification](https://openfeature.dev/docs/reference/other-technologies/ofrep/openapi). Applications should use an OpenFeature client with a standard [OFREP-compatible provider](https://openfeature.dev/ecosystem), but they can also call the REST endpoints directly without a provider.

<!-- TODO: Add the Helm installation command when it is available. -->
<!-- TODO: Document kube-api client initialization, port configuration, and namespace configuration when those settings are finalized. -->
