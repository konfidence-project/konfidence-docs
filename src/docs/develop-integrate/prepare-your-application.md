---
title: Prepare your Application
description: Learn how to prepare your application for integration with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Prepare your Application

Before you can deploy your application using Konfidence, you need to prepare it for integration with the framework.

## Prerequisites

* app should be ready for target platform deployment
* for k8s, that means having a OCI image and Kubernetes manifests (or Helm charts, Kustomize, etc.)

## Application structure

* Konfidence is designed for microservices architectures
* each microservice should be one artifact
* artifacts should be independently versioned and deployable

## Vector Context

* microservices need to be vector-aware
* incoming requests carry an `X-Vector-ID` header that needs to be forwarded to all downstream service calls
