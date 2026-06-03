---
title: Star installation
description: Install and configure Star runtime orchestrators in your target landscapes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Star installation

## Prerequisites

- Target landscape infrastructure (e.g. k8s cluster) with appropriate permissions
- Network connectivity to Galaxy (outbound for pull-based architecture)
- Access to container registries where artifacts are stored

## Helm

* `helm install star`

## Picking your Deployer

* star helm chart comes with k8s deployer by default
* if you want to use a different deployer, install and configure it separately

### Connect to landscape

* deployer-specific configuration for connecting to your landscape
* for our k8s deployer: kubeconfig for landscape access or local deployment directly on the star cluster

## Register with Galaxy

* set up and configure sync controller

## OCI connectivity

* add secrets for OCI registry access
