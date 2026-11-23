---
title: Access vector data in your application
description: Learn how to access vector data in your application code.
---

# Access vector data in your application

This guide explains how application code in a Kubernetes landscape reads [vector data](../../reference/glossary.md#vector-data), such as [feature flags](../../reference/glossary.md#feature-flag), authored config, and [deployment results](../../reference/glossary.md#deployment-result).

Vector data is available before the [vector](../../reference/glossary.md#vector) is activated and stays available afterwards. Deploy-time tasks can read it, for example to resolve service-to-service dependencies.

## Prerequisites

- Your workload can determine the vector ID from `X-Vector-ID`, message metadata, or execution context.
- The [vector data service](../../reference/glossary.md#vector-data-service) is available in the [landscape](../../reference/glossary.md#landscape).
- Your application can make HTTP requests to the vector data service.

<figure>
  <img src="../img/vector-traffic.drawio.svg" alt="A request reaches the gateway, which adds the x-vector-id header and forwards it to Service A inside the vector. Service A queries the vector-data-service over OFREP for flags, config and sibling addresses, then forwards x-vector-id to Service B.">
  <figcaption>An incoming request flows through Konfidence to your services.</figcaption>
</figure>

## Get the vector ID

For HTTP workloads, the ingress gateway sets the `X-Vector-ID` HTTP header on every routed request. Use this header to identify which vector's data your application must load.

Use the value from `X-Vector-ID` when requesting vector data, not the vector's OCM registry reference. For a local example without an ingress gateway, see [Verify service-to-service communication](../../getting-started/deliver-an-application.md#optional-verify-service-to-service-communication).

Forward `X-Vector-ID` on every outbound HTTP call. This is a mandatory contract because vector routing depends on the header at the next hop.

For non-HTTP workloads, get the vector ID from the workload's message metadata or execution context.

## Access vector data through OFREP

The central, per-landscape vector data service exposes REST endpoints that implement the OpenFeature Remote Evaluation Protocol (OFREP).

For most applications, use an OpenFeature client with a standard OFREP provider. This is the recommended integration, but it is not required. You can also call the OFREP REST endpoints directly without an OpenFeature client or OFREP provider. Konfidence does not provide a dedicated SDK for these lookups.

In both cases, pass the vector ID as the `targetingKey` in the evaluation context. The default OFREP providers currently do not cache resolved values.

## Choose an evaluation mode

Use one of the following evaluation modes through an OFREP provider or by calling the REST endpoints directly:

| Mode | Request | Result |
| --- | --- | --- |
| Single flag | `POST /ofrep/v1/evaluate/flags/{key}` with the flag name | Returns one value. |
| Whole bundle | `POST /ofrep/v1/evaluate/flags/{key}` with the vector ID as the flag key | Returns the entire [vector configuration](../../reference/glossary.md#vector-configuration) object, including features, authored config, and deployment results. This is useful at application startup to prime a local view. |
| Bulk | `POST /ofrep/v1/evaluate/flags` | Returns all features at once and supports ETag-based revalidation with `If-None-Match`. |

## Read authored configuration

Authored config is available through the whole-bundle response only. Query the vector ID as the flag key and read the `authored` subtree from the returned [vector configuration](../../reference/glossary.md#vector-configuration) object. The single-flag and bulk endpoints resolve feature flags only.

## Use vector data from any workload protocol

The lookup is an HTTP call to a landscape-local service. HTTP services, gRPC services, Kafka consumers, batch jobs, cron jobs, and other workloads can request their configuration whenever they need it, as long as they can make an HTTP request.

Only inbound HTTP traffic uses the `X-Vector-ID` header directly. Non-HTTP workloads use their own metadata or context to determine the vector ID.

## Cache vector data

Vector data is immutable per vector ID. After your application fetches data for a vector, cache it for the lifetime of that vector. You do not need invalidation or polling.

The vector data service caches `ConfigMap` resources in memory, so repeated lookups stay cheap.

## Share an artifact instance

The artifact manifest's `allowReuse` field controls sharing. See [Choose whether vectors share one instance of your artifact](../../core-concepts/vectors-and-artifacts.md#choose-whether-vectors-share-one-instance-of-your-artifact) for the shared model and when to enable it.

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
