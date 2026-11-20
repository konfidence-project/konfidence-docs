---
title: "System architecture"
scope: "Konfidence core"
editLink: false
lastUpdated: false
description: Understand how Konfidence, deployers, and landscapes work together in the supported single-cluster topology.
outline: [2, 3]
---
# System architecture

Konfidence separates the definition of your delivery process from its execution in target environments. Before installing it, understand which components you install centrally and which resources you configure for each project and landscape.

Konfidence runs as workloads on Kubernetes and uses the Kubernetes API to store delivery state. It does not replace the Kubernetes control plane.

Delivery management and runtime orchestration exchange desired stage state through the Kubernetes API. See [Kubernetes architecture](../deployers/kubernetes/architecture.md) for the complete topology of the currently documented installation.

## Components you install

The platform consists of Konfidence and the deployers you install to provide deployment capabilities:

| Component | Responsibility | Installation |
| --- | --- | --- |
| Konfidence operator | Reconciles delivery resources and coordinates rollouts | The `konfidence` Helm chart |
| Konfidence API server | Provides the API, dashboard, login, and project authorization | The same `konfidence` Helm chart |
| Deployer | Executes the artifact contract for its target platform | The corresponding [deployer installation](../deployers/index.md) |

[Deployers](../deployers/index.md) explains how deployers support artifact types for a target platform. A [deployment target](./deployment-targets.md) configures a destination for one artifact type in a particular landscape.

## Delivery management

Delivery management is the definition side of Konfidence and the primary interface for your project. It manages the delivery process but does not deploy workloads itself.

- **Definition:** It defines the desired delivery state: which [vectors](../reference/glossary.md#vector) exist and which vector each [stage](../reference/glossary.md#stage) should use.
- **Role:** It assembles, validates, and publishes deployment configurations, such as software versions and stage resources. Its work ends when the target stage state exists in the cluster.

## Runtime orchestration

Runtime orchestration is the execution side of Konfidence.

- **Definition:** It consumes the stage state that delivery management produces and turns it into deployments.
- **Role:** It manages and executes software deployments in one or more [landscapes](../reference/glossary.md#landscape) based on a specific target state, such as a stage resource. The handoff between the two sides happens through Kubernetes resources in the same cluster; no cross-cluster synchronization is involved.

## Landscape

A landscape groups stages and their deployment resources within a project. Konfidence creates and manages a namespace for each landscape. You provide the underlying infrastructure and configure the deployment targets that tell deployers where to run its workloads.

You can create landscapes for different operational boundaries, such as testing and production. [Landscapes and stages](./landscapes-and-stages.md) explains how to choose those boundaries.

Additional runtime services depend on the deployer. For Kubernetes, [landscape services](../deployers/kubernetes/landscape-services.md) include the Vector Data Service.

## Next steps

- [Plan for high availability](./high-availability.md) explains replica configuration, session storage, and external dependencies.
- [Install Konfidence](./install.md) installs the operator and API server.
