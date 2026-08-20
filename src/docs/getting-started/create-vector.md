---
title: Create your own artifacts
description: Learn how to create your own artifacts and assemble them into a vector.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Before you begin

requirements: 
* an OCI registry to store artifacts
* a running k8s cluster with konfidence installed (see quickstart guide)
* clone sample-app/quickstart repo: github.com/konfidence-project/example-app

# Example application

* based on istio examples, pure k8s deployments
* product-page / reviews / details 
* ratings not included in quickstart because of external database dependency

# Build your first Artifacts

steps:
* publish app artifacts with kden CLI: `kden artifact push -f component-constructor.yaml`
* check VectorTemplate status: `kubectl get vectortemplate vector-dev`
* first vector should be created now (might take few minutes for reconciliation)
* in OCI registry, you should see a new artifact created for the vector

what's happening now:
* vector is available, a VectorPromotionConfig targeting the dev stage picks it up and writes the concrete version to `Stage.spec.vector`
* Stage reconciliation deploys all artifacts of the vector and assigns them dev stage
* internal routing rules are rolled out and allow east-west traffic between artifacts in the dev stage
* activation makes services externally available

# Assemble a Vector

steps:
* create a new VectorTemplate for the dev vector
* assign it to a stage with a VectorPromotionConfig