---
title: Prepare your application
description: Learn how to prepare your application for integration with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Prepare your application

Konfidence's [vector model](../core-concepts/vectors-and-artifacts.md) requires changes to your application. These changes let your services communicate with the other services in their vector. They also let your services receive [runtime configuration](./vector-data/overview.md) <!-- values like [feature flags]() -->.

<figure>
  <img src="./img/vector-traffic.drawio.svg" alt="A request reaches the gateway, which adds the x-vector-id header and forwards it to Service A inside the vector. Service A queries the vector-data-service over OFREP for flags, config and sibling addresses, then forwards x-vector-id to Service B.">
  <figcaption>An incoming request flows through Konfidence to your services.</figcaption>
</figure>

## Prerequisites

Package your deployment code as a supported [artifact](./artifact-types/index.md).

## Konfidence fits microservice applications

Konfidence targets distributed applications. Use it if your application meets these requirements:

* Your application uses a microservice architecture.
* You package each service as its own artifact.

Packaging and integration add overhead for your engineering team. Evaluate carefully whether Konfidence fits your use case.
