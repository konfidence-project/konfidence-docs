---
title: Vector Deployments
description: Learn about stages and how they control the deployment of vectors in your Konfidence infrastructure.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Vector Deployments

* describe how vectors are actually deployed to your landscapes

## Stage

* logical checkpoint in the delivery pipeline
* defines where and how vectors are deployed
* usually targeted to a specific landscape (e.g., staging, production)
* is assigned a specific vector to deploy

## Advanced concepts

### StageVersion

* capture stage changes over time
* enable zero-downtime deployments

### VectorAssignment

* tracks which artifacts are assigned to which stages
* allows for dynamic reassignments and efficient resource re-use

### Deployer

* translates Konfidence artifacts into real workloads
* extension point to various target platforms (e.g., Kubernetes, CDN, serverless, ...)