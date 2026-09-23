---
title: System architecture
description: Understand how Konfidence, deployers, and landscapes work together in the supported single-cluster topology.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# System architecture

Konfidence separates the definition of your delivery process from its execution in target environments. Before installing it, understand which components you install centrally and which resources you configure for each project and landscape.

Konfidence acts as a delivery control plane. It runs as workloads on Kubernetes and uses the Kubernetes API to store delivery state. It does not replace the Kubernetes control plane.

The diagram shows how delivery management and runtime orchestration connect through the desired stage state:

<DrawioDiagram src="/assets/diagrams/konfidence-architecture.drawio" />

## Components you install

The platform consists of Konfidence and the deployers you install to provide deployment capabilities:

| Component | Responsibility | Installation |
| --- | --- | --- |
| Konfidence operator | Reconciles delivery resources and coordinates rollouts | The `konfidence` Helm chart |
| Konfidence API server | Provides the API, dashboard, login, and project authorization | The same `konfidence` Helm chart |
| Kubernetes deployer | Deploys Helm and Kustomize artifacts through Flux | The separate `kubernetes-landscape-orchestrator` Helm chart |

[Choose a deployer](../install/deployer/overview.md) explains how deployment classes connect artifact types to a target platform. Installing a deployer provides its classes centrally. A [deployment target](../manage-delivery/deployment-targets.md) makes one class available in a particular landscape.

## Delivery management

Delivery management is the definition side of the control plane and the primary interface for your project. It manages the delivery process but does not deploy workloads itself.

- **Definition:** It defines the desired delivery state: which [vectors](../../reference/glossary.md#vector) exist and which vector each [stage](../../reference/glossary.md#stage) should use.
- **Role:** It assembles, validates, and publishes deployment configurations, such as software versions and stage resources. Its work ends when the target stage state exists in the cluster.

## Runtime orchestration

Runtime orchestration is the execution side of the control plane.

- **Definition:** It consumes the stage state that delivery management produces and turns it into deployments.
- **Role:** It manages and executes software deployments in one or more [landscapes](../../reference/glossary.md#landscape) based on a specific target state, such as a stage resource. The handoff between the two sides happens through Kubernetes resources in the same cluster; no cross-cluster synchronization is involved.

## Landscape

A landscape groups stages and their deployment resources within a project. Konfidence creates and manages a namespace for each landscape. You provide the underlying infrastructure and configure the deployment targets that tell deployers where to run its workloads.

You can create landscapes for different operational boundaries, such as testing and production. [Landscapes and stages](../../core-concepts/landscapes-and-stages.md) explains how to choose those boundaries.

[Landscape services](../install/runtime-components/overview.md), such as the Vector Data Service, run alongside applications. Install them in the landscape context after creating its namespace.

## The current release runs everything in one cluster

The control plane and the Kubernetes landscape orchestrator run in one Kubernetes cluster:

- The Konfidence Helm chart installs the control plane: the operator and the API server.
- The `kubernetes-landscape-orchestrator` Helm chart installs the deployer for the Kubernetes target runtime.
- Each project and each landscape owns a namespace in that cluster.

Use the Kubernetes deployer's `local` connection for workloads in this cluster. Its remote `kubeconfig` connection is work in progress and does not yet create every resource on the remote cluster. See [Connection types](../install/deployer/kubernetes.md#connection-types) for the current limitations. Running the Konfidence control plane itself across several clusters is not available in the current release.

## Next steps

- [Plan for high availability](./high-availability.md) explains replica configuration, session storage, and external dependencies.
- [Install Konfidence](../install/konfidence-installation.md) installs the operator and API server.
