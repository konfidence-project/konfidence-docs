---
title: Vector Deployments
description: Learn about stages and how they control the deployment of vectors in your Konfidence infrastructure.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Vector Deployments

<!-- 
  Content type (Diátaxis): Explanation — describes the concepts that govern how Konfidence tracks and controls vector deployments. No instructions.
  TW will structure this as: brief intro paragraph per concept, then the sub-concepts with expanded prose (not bullet stubs).

  Dev input needed:
  - Write 2–3 sentences per concept below (Stage, StageVersion, VectorAssignment, Deployer) explaining what it is, why it exists, and what problem it solves
  - For Stage: how does "is assigned a specific vector" work — is this automatic or manually triggered?
  - For Deployer: which deployer types exist out of the box beyond Kubernetes?

  Ticket: DOCS — Vector Deployments:
-->

A vector deployment represents the complete process of running a specific vector version in a target landscape. The following concepts govern how Konfidence tracks and controls this process.

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