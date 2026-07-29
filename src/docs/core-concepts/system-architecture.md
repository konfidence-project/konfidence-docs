---
title: System Architecture
description: Understand the architecture of Konfidence, including the galaxy and star roles of the control plane and the landscapes where applications run.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# System Architecture

Konfidence separates the definition of your delivery process from its execution in the target environments. Both responsibilities are roles of a single control plane: Konfidence runs as one binary, installed from one Helm chart, in one Kubernetes cluster.

<DrawioDiagram src="/assets/diagrams/konfidence-architecture.drawio" />

## Galaxy

The galaxy is the delivery-definition role of the control plane and the primary interface for your project. It manages the delivery process but does not deploy workloads itself.

* **Definition:** The galaxy defines the desired delivery state: which vectors exist and which vector each stage should use.
* **Role:** It assembles, validates, and publishes deployment configurations, such as software versions and stage resources. Its work ends when the target stage state exists in the cluster.

## Star

The star is the runtime-orchestration role of the control plane.

* **Definition:** The star consumes the stage state that the galaxy produces and turns it into deployments.
* **Role:** It manages and executes software deployments in one or more landscapes based on a specific target state, such as a stage resource. The hand-over between galaxy and star happens through Kubernetes resources in the same cluster; no cross-cluster synchronization is involved.

## Landscape

A landscape is the actual place where deployments happen.

* **Definition:** The infrastructure where your software runs. In the current release, a landscape is a Kubernetes environment represented by a namespace, and the [Kubernetes landscape orchestrator](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) executes the deployments there.
* **Role:** It provides the foundation for your applications. Konfidence does not manage the landscape itself; you must provide the underlying infrastructure. You can set up multiple landscapes for different purposes, such as testing and production.

