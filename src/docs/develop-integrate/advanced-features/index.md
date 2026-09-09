---
title: "Advanced features"
description: "Optional capabilities for applications that run in a vector: runtime configuration, feature flags, and signed artifacts."
outline: deep
editLink: true
lastUpdated: true
---

# Advanced features

Use these pages when your service needs data from its vector at runtime or when your environment requires signed artifacts.

## Read configuration and sibling addresses from the vector

Konfidence includes configuration in each vector and provides it at runtime through the vector data service. Start with the [vector data overview](../vector-data/overview.md), then:

- [Add configuration to a vector](../vector-data/vector-configuration.md) to include feature flags and authored configuration in the vector.
- [Add deployment results to an artifact](../vector-data/deployment-results.md) to make a Service discoverable by other services in the vector.
- [Access vector data in your application](../vector-data/access-vector-data.md) to read flags, configuration, and the addresses of other services at runtime.

## Switch behavior per vector with feature flags

[Read feature flags in your application](./feature-flags.md) evaluates a flag for the current vector with an OpenFeature client.

## Sign artifacts and verify them before deployment

[Configure signing and verification](./configure-signing-and-verification.md) covers signing artifacts and vectors. Konfidence verifies the signatures before assembly and deployment.
