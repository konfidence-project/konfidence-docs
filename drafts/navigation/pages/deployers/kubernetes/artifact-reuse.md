---
title: "Share an artifact instance"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Share an artifact instance

Use `allowReuse: true` only when a Kubernetes service can serve requests from multiple vectors at the same time. Konfidence's [instance reuse model](../../core/artifact-types.md#choose-whether-vectors-share-one-instance-of-your-artifact) determines which deployments share an instance. This guide explains the application's runtime obligations.

## What reuse demands from your service

A shared instance receives requests from several vectors at once. Those vectors can reference different versions of the other services. Vector A may pair `my-service 1.0.0` with `checkout 2.3.0`, while vector B pairs it with `checkout 2.4.0`.

<figure>
  <DrawioDiagram src="/assets/diagrams/artifact-types/artifact-reuse.drawio" />
  <figcaption>One shared instance serves two vectors and calls the service version that belongs to each request's vector.</figcaption>
</figure>

The same holds when the shared instance sits downstream. Each vector's own frontend calls one shared `catalog` instance and passes its vector ID along.

<figure>
  <DrawioDiagram src="/assets/diagrams/artifact-types/artifact-reuse-fan-in.drawio" />
  <figcaption>Two vector-specific frontends fan in to one shared instance. The vector ID travels with every call.</figcaption>
</figure>

To serve those vectors correctly, your service must handle each request in its vector's context:

- Read `X-Vector-ID` from each request and forward it on every outbound call.
- Resolve the addresses of other services, [feature flags](../../reference/glossary.md#feature-flag), and configuration for the current vector through the [vector data service](../../reference/glossary.md#vector-data-service) instead of loading one vector's values once at startup.
- Key cached [vector data](../../reference/glossary.md#vector-data) by vector ID. Never use one process-wide cached value for requests from different vectors.
- Keep vector-specific state isolated by vector ID so that requests from one vector cannot read or modify another vector's state.

For the implementation steps, see [Prepare your application](./prepare-your-application.md) and [Access vector data in your application](./access-vector-data.md).

## Choose `allowReuse: true` when

Set `allowReuse` to `true` only when one running instance can safely serve several vectors at the same time and your service meets every demand above.

Reuse is especially useful when:

- The service is expensive to run or slow to start.
- Vectors in a landscape mostly reference the same version of the service.

## Choose `allowReuse: false` when

Set `allowReuse` to `false` when any of the following applies:

- Your service loads vector-specific configuration once at startup and uses it for every request.
- Your service hard-codes the addresses of other services or assumes fixed versions of those services.
- Your service cannot isolate vector-specific state or cached data by vector ID.
- Your service requires a dedicated running instance for each vector, for example because its lifecycle must be managed independently.
- You need separate service instances, for example for load tests.

## Next steps

Set the manifest field when you [author a Helm artifact](./helm.md) or [author a Kustomize artifact](./kustomize.md).
