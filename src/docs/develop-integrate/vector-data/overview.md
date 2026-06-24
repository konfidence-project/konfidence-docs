---
title: Use Vector-Scoped Configuration
description: Learn how to use vector-scoped configuration to manage settings that are specific to individual vectors.
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

# Vector Data Overview

## Concept

* diagram with conceptual view (runtime agnostic):
  * VectorData CRD on LCP
  * Landscape orchestrator read VectorData and pass to runtime
  * runtime needs to provide a way for apps to read the vector data by vector-id 

## Kubernetes Runtime

* diagram with Kubernetes-specific view:
  * admin installs [configuration service](/docs/deploy-operate/runtime-components/configuration-service) in the landscape cluster
  * k8s landscape orchestrator pushes configmaps to landscape cluster
  * configuration service reads configmaps and provides an OpenFeature API for workloads to read the vector data by vector-id

## Data types

### 1. Feature toggles

* allows to toggle behavior of features or code paths in the application
* multiple services in the vector can read the same feature toggle values and behave consistently

### 2. Authored config

* allows to pass arbitrary configuration values to the application

### 3. Deployment results

* allows to pass information that results out of a deployment into the landscape (service endpoints, generated URLs, identities, allocated resources, …)

