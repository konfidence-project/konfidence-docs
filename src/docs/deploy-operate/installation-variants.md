---
title: Installation variants
description: Explore the different ways to install and configure Konfidence for your infrastructure.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Installation variants

(internal note: we ignore KCP-based installation for now)

## Single Cluster Installation
* everything runs on a single Kubernetes cluster
* only for demonstration purposes, not recommended for production

## Multi-Cluster Installation
* control plane and data plane are separated
* flavors:
  - three clusters: galaxy, star, landscape
  - two clusters: one cluster for galaxy, one for star + landscape
  - multiple clusters: one cluster for galaxy, one cluster for star, one cluster for landscape
  - multiple clusters: one cluster for galaxy, many different star/landscape clusters