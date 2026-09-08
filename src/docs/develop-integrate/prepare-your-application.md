---
title: Prepare your Application
description: Learn how to prepare your application for integration with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Prepare your Application

The [Vector Concept](/docs/core-concepts/vectors-and-artifacts), introduced by Konfidence, requires you to modify your application. These changes let your services communicate with the other services in their vector. They also let your services receive [runtime configuration](/docs/develop-integrate/vector-data/overview) <!-- values like [feature flags]() -->.

<figure>
  <img src="./img/vector-traffic.drawio.svg" alt="A request reaches the gateway, which adds the x-vector-id header and forwards it to Service A inside the vector. Service A queries the vector-data-service over OFREP for flags, config and sibling addresses, then forwards x-vector-id to Service B.">
  <figcaption>The image depicts how your incoming request flows through konfidence and to your services</figcaption>
</figure>

## Prerequisites

Package your deployment code as a supported [Artifact](/docs/develop-integrate/artifact-types).

## Konfidence fits microservice applications

Konfidence targets distributed applications. Use it if your application meets these requirements:

* Your application uses a microservice architecture.
* You package each service as its own artifact.

Packaging and integration add overhead for your engineering team. Evaluate carefully whether Konfidence fits your use case.
