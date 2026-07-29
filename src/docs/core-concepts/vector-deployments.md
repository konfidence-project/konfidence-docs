---
title: Vector Deployments
description: Learn about stages and how they control the deployment of vectors in your Konfidence infrastructure.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Vector Deployments

1.  **Pull:** The control plane tracks a `Stage` and pulls the vector which should be deployed. 
2.  **Snapshot:** The system creates a **StageVersion** to track this specific rollout.
3.  **Vector lifecycle begins:**
    * **Deployers** deploy the necessary artifacts.
    * **VectorAssignments** link these artifacts to the current vector.
    * **Tasks** (like migrations) prepare the data.
    * **Activate:** Once everything is ready, traffic switches to the new version.

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
* the Kubernetes deployer, provided by the [kubernetes-landscape-orchestrator](https://github.com/konfidence-project/kubernetes-landscape-orchestrator), is the deployer available in the current release