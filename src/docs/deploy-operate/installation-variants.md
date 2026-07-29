---
title: Installation variants
description: Explore the different ways to install and configure Konfidence for your infrastructure.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Installation variants

## Single Cluster Installation

Konfidence runs on a single Kubernetes cluster. The control plane, the Kubernetes landscape orchestrator, and your workloads share one cluster:

* the Konfidence Helm chart installs the control plane
* the kubernetes-landscape-orchestrator Helm chart installs the deployer for the Kubernetes target runtime
* stages are separated by namespaces within the cluster

See [Installing Konfidence](./konfidence-installation.md) for the installation steps.

## Multi-Cluster Installation

Multi-cluster topologies, such as separating the control plane from the landscape clusters or running stages on dedicated clusters, are not available in the current release.
