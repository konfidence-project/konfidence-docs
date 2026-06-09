---
title: Star installation
description: Install and configure Star runtime orchestrators in your target landscapes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Star installation

<!-- 
  Content type (Diátaxis): How-to guide — operator installs a Star local control plane in a target landscape and registers it with Galaxy.
    TW will create structured guide for this
    
   DEV:
  - what are the concrete steps that the user has to do to complete the installation?  
  Ticket: DOCS — Star Installation: 

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

<!-- DEV:
  - What is the "sync controller"? Is it part of the Star Helm chart or a separate install?
  - What configuration does it need to connect to Galaxy (URL, credentials, certificate)?
  - How does the operator verify that registration succeeded?
-->

* set up and configure sync controller

## OCI connectivity

<!-- DEV: Same as Galaxy installation — what type of secret is needed and how is it referenced in Helm values? -->

* add secrets for OCI registry access