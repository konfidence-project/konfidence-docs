---
title: Prepare your application
description: Learn how to prepare your application for integration with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Prepare your application

Prepare your application as versioned artifacts that Konfidence can assemble into a vector. Use the guides for your deployer to package each service and integrate its runtime behavior.

## Konfidence fits microservice applications

Konfidence targets distributed applications. Use it if your application meets these requirements:

* Your application uses a microservice architecture.
* You package each service as its own [artifact](../reference/glossary.md#artifact).

Packaging and integration add overhead for your engineering team. Evaluate carefully whether Konfidence fits your use case.

## Prepare artifacts for your target platform

Your deployer defines the artifact formats it accepts. For Kubernetes, [Types of artifacts](./artifact-types/index.md) helps you choose Helm or Kustomize and leads to the corresponding authoring guide.

## Integrate with the runtime

Applications can use vector-specific configuration, feature flags, and deployment results. The [vector data overview](./vector-data/overview.md) explains the shared model.

For Kubernetes, [Access vector data in your application](./vector-data/access-vector-data.md) explains request context and runtime data access. [Read feature flags in your application](./advanced-features/feature-flags.md) provides OpenFeature examples.

## Next steps

- [Publish artifacts](./artifact-types/publish-artifacts.md) after preparing the files for your deployer.
- [Build vectors](./observe-improve/build-vectors.md) to assemble an application version from the published artifacts.
