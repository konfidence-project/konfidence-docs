---
title: Access vector data in your application
description: Learn how to access vector data in your application code.
---

# Access vector data in your application

This guide explains how running application code reads vector data, such as feature flags, authored config, and deployment results.

Vector data is available before the vector is activated and stays available afterwards. Deploy-time tasks can read it, for example to resolve service-to-service dependencies.

## Prerequisites

- Your workload can determine the vector ID from `X-Vector-ID`, message metadata, or execution context.
- The vector data service is available in the landscape.
- Your application can make HTTP requests to the vector data service.

## Get the vector ID

For HTTP workloads, the ingress gateway sets the `X-Vector-ID` HTTP header on every routed request. Use this header to identify which vector's data your application must load.

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
| Whole bundle | `POST /ofrep/v1/evaluate/flags/{key}` with the vector ID as the flag key | Returns the entire vector configuration object, including features, authored config, and deployment results. This is useful at application startup to prime a local view. |
| Bulk | `POST /ofrep/v1/evaluate/flags` | Returns all features at once and supports ETag-based revalidation with `If-None-Match`. |

## Use vector data from any workload protocol

The lookup is an HTTP call to a landscape-local service. HTTP services, gRPC services, Kafka consumers, batch jobs, cron jobs, and other workloads can request their configuration whenever they need it, as long as they can make an HTTP request.

Only inbound HTTP traffic uses the `X-Vector-ID` header directly. Non-HTTP workloads use their own metadata or context to determine the vector ID.

## Cache vector data

Vector data is immutable per vector ID. After your application fetches data for a vector, cache it for the lifetime of that vector. You do not need invalidation or polling.

The vector data service caches `ConfigMap` resources in memory, so repeated lookups stay cheap.
