---
title: Kubernetes
description: Find installation and application integration guides for the Kubernetes deployer.
outline: [2, 3]
---

# Kubernetes

The Kubernetes landscape orchestrator deploys Helm and Kustomize artifacts through Flux. Choose a guide for the work you need to do.

## Install and configure

Start with [Install the Kubernetes deployer](./install.md). Then [configure a Kubernetes deployment target](./configure-target.md) and [registry access](./registry-access.md) in each landscape.

For applications that receive external requests, [Gateway routing](./gateway-routing.md) explains the setup and helps you choose a gateway provider. [Choose landscape services](./landscape-services.md) identifies services your applications need at runtime.

## Integrate your application

Use [Types of artifacts](./artifact-types.md) to choose between Helm and Kustomize, then follow the corresponding authoring guide.

To read configuration and service addresses at runtime, see [Access vector data in your application](./access-vector-data.md).
