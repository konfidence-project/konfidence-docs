---
title: System Architecture
description: Understand the split architecture of Konfidence, including Galaxy, Star, and Landscape components.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# System Architecture

Konfidence uses a split architecture that keeps your central management secure while allowing your applications to run anywhere.

<DrawioDiagram src="/assets/diagrams/konfidence-architecture.drawio" />

## Galaxy

The galaxy is the primary interface for your project. It manages the delivery process but does not touch your target environments directly.

* **Definition:** As the global control plane, the galaxy defines and distributes the desired state for multiple stars.
* **Role:** It assembles, validates, and dispatches deployment configurations, such as software versions and stage resources. The galaxy receives status updates but never sends commands directly into the clusters, ensuring security.

## Star

A star is a local runtime orchestrator that lives close to your target environment (typically a Kubernetes cluster).

* **Definition:** A local operator that pulls configurations from the galaxy and applies them to the cluster.
* **Role:** The star manages and executes software deployments in one or more environments based on a specific target state, such as a stage resource. By using a *pull model* (connecting outbound to the manager), it allows you to deploy securely without opening firewalls for inbound traffic.

## Landscape

A landscape is the actual place where deployments happen.

* **Definition:** The physical or virtual infrastructure where your software runs. Usually, this is a Kubernetes cluster or a CloudFoundry space. However, it can also be a CDN provider, a functional runtime, or a bare-metal machine.
* **Role:** It provides the foundation for your applications. Konfidence does not manage the landscape itself; you must provide the underlying infrastructure. Each landscape belongs to one star, which manages all deployments there. You can set up multiple landscapes for different purposes (like testing vs. production) or for different geographical regions (like EU vs. US).

