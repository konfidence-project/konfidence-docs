---
title: Prepare your application
description: Learn how to prepare your application for integration with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Prepare your application

Konfidence's [vector model](../core-concepts/vectors-and-artifacts.md) requires changes to your application. These changes let your services communicate with the other services in their [vector](../reference/glossary.md#vector). They also let your services receive [runtime configuration](./vector-data/overview.md) <!-- values like [feature flags]() -->.

<figure>
  <img src="./img/vector-traffic.drawio.svg" alt="A request reaches the gateway, which adds the x-vector-id header and forwards it to Service A inside the vector. Service A queries the vector-data-service over OFREP for flags, config and sibling addresses, then forwards x-vector-id to Service B.">
  <figcaption>An incoming request flows through Konfidence to your services.</figcaption>
</figure>

An incoming HTTP request reaches your application through the ingress gateway. In a Kubernetes [landscape](../reference/glossary.md#landscape), the gateway adds `X-Vector-ID` to the routed request. This header identifies the vector handling the request. Your service must forward it on every outbound HTTP call so that downstream requests stay in the same vector. See [Access vector data in your application](./vector-data/access-vector-data.md).

Your service can also use the vector ID to retrieve vector-specific configuration, [feature flags](../reference/glossary.md#feature-flag), and [deployment results](../reference/glossary.md#deployment-result). It requests this data from the [vector data service](../reference/glossary.md#vector-data-service) through the OpenFeature Remote Evaluation Protocol (OFREP), a standard HTTP API. See [Read feature flags in your application](./advanced-features/feature-flags.md).

## Konfidence fits microservice applications

Konfidence targets distributed applications. Use it if your application meets these requirements:

* Your application uses a microservice architecture.
* You package each service as its own [artifact](../reference/glossary.md#artifact).

Packaging and integration add overhead for your engineering team. Evaluate carefully whether Konfidence fits your use case.

## Next steps

Continue with the guides that support your application workflow:

- [Types of artifacts](./artifact-types/index.md) — package your services as Helm or Kustomize artifacts.
- [Publish artifacts](./artifact-types/publish-artifacts.md) — push your artifacts to an OCI registry.
- [Build vectors](./observe-improve/build-vectors.md) — define a `VectorTemplate` to assemble vectors from your published artifacts.
