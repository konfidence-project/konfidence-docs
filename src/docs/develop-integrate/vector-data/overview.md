---
title: Overview
description: Understand how vector data provides vector-scoped runtime data to applications.
outline: [2, 3]
editLink: true
lastUpdated: true
---

<!-- 
  Content type (Diátaxis): Explanation — developer wants to pass configuration values that are scoped to a specific vector deployment.
  * How to define config in the vector
  * how Konfidence passes to config to the runtime
  * how to read it in a running service

  Ticket: https://github.com/konfidence-project/konfidence-project/issues/710
-->

# Overview

Vector data is runtime data that belongs to a specific vector deployment. Applications use it to resolve feature flags, authored configuration values, and deployment results by vector ID.

## How vector data reaches the runtime

Konfidence stores vector data in the `VectorData` custom resource on the Landscape Control Plane (LCP). The landscape orchestrator reads the `VectorData` resource and passes the data to the target runtime.

The runtime must provide a way for applications to read vector data by vector ID. This keeps runtime data scoped to the vector that is currently handling the request or workload.

## Kubernetes runtime

In a Kubernetes runtime, an administrator installs the [vector data service](../../deploy-operate/runtime-components/vector-data-service.md) in the landscape cluster. The Kubernetes landscape orchestrator pushes vector data to the landscape cluster as `ConfigMap` resources.

The vector data service reads those `ConfigMap` resources and provides an OpenFeature-compatible API. Workloads use that API to read vector data by vector ID.

## Data types

Vector data contains three data types:

| Data type | Purpose |
| --- | --- |
| Feature flags | Toggle behavior for features or code paths in the application. Multiple services in the same vector can read the same flag values and behave consistently. |
| Authored config | Pass arbitrary configuration values to the application. |
| Deployment results | Pass deployment-generated information into the landscape, such as service endpoints, generated URLs, identities, and allocated resources. |
