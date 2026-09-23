---
title: Delivery flow
description: Understand how Konfidence orchestrates the complete software delivery process from build to production.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Delivery flow

The Konfidence [delivery flow](../reference/glossary.md#delivery-flow) describes how build outputs become controlled deployment state.
It starts with [artifacts](../reference/glossary.md#artifact) published by CI pipelines, assembles those artifacts into an immutable [vector](../reference/glossary.md#vector), assigns that vector to a [stage](../reference/glossary.md#stage), and promotes it toward later stages.

The main relationship to understand is:

- Artifacts are the inputs.
- A vector is the immutable application version assembled from those inputs.
- A stage selects which vector should be delivered for a delivery checkpoint.
- A [promotion](../reference/glossary.md#promotion) updates a stage to reference a concrete vector version without changing the vector itself.

<DrawioDiagram src="/assets/diagrams/delivery-flow.drawio" />

## The delivery flow in Konfidence

The delivery flow sits between artifact publishing and runtime deployment.
It describes how Konfidence turns build outputs into target stage state.

This page focuses on the delivery state before runtime deployment starts.
It does not describe how [deployers](../reference/glossary.md#deployer) create workloads in a [landscape](../reference/glossary.md#landscape).
That runtime lifecycle starts once the target stage state (`Stage` resources) has been written to the cluster.

### Delivery flow at a glance

Read the flow as a progression of state:

| Phase | Result | Konfidence concept or resource |
| --- | --- | --- |
| Build | Build results are available as artifacts in an Open Component Model (OCM)-compliant repository. | Artifact |
| Assemble | Selected artifacts are combined into one immutable vector. | Vector, [`VectorTemplate`](../reference/glossary.md#vectortemplate) custom resource |
| Assign | A stage references the vector selected manually or by a promotion. | `Stage` custom resource |
| Promote | A promotion updates the target stage to reference a concrete vector version. | [`VectorPromotionConfig`](../reference/glossary.md#vectorpromotionconfig), [`VectorPromotion`](../reference/glossary.md#vectorpromotion) custom resources |

Entries in code style are Kubernetes custom resources.
Concepts such as artifact, vector, and stage describe the delivery model that those resources configure.

## Resource relationships

The delivery flow is built from references between resources.
Each resource describes one relationship in the flow instead of copying the full delivery state into every step.
This keeps vector contents separate from the delivery state around the vector.

The most important references are:

- `VectorTemplate.spec.components` points to the [artifact aliases](../reference/glossary.md#artifact-alias) that should be part of the vector.
- `VectorTemplate.spec.uploadTarget` defines the vector reference that assembly creates.
- `Stage.spec.vector` holds the concrete vector selected for a stage.
- `VectorPromotionConfig.spec.source` names the source being watched: a `VectorTemplate` or another `Stage`.
- `VectorPromotionConfig.spec.target` names the target stage and its landscape.
- `VectorPromotion.spec.vectorPromotionConfigRef` ties a promotion to the configuration it belongs to.

Together, these references form a traceable chain.
You can start at a stage and identify the exact vector assigned to it.
From the vector, you can identify the artifacts that were assembled into it.
From a promotion, you can identify which vector was written to which stage.

This relationship model is the core idea behind a delivery flow in Konfidence.
You build the flow by deciding which artifact aliases feed a vector, which stage receives it first, and which stage it should reach next.

## Immutability and promotion state

Konfidence treats vectors as immutable application versions.
When a service, configuration, or artifact reference changes, the result is a new vector instead of a mutation of an existing one.

That immutability gives promotion a clear meaning.
A promotion updates the target stage to reference a known vector version.
It does not rewrite, copy, or move the vector contents.

Each `VectorPromotion` is an immutable record with its own status, so teams can see which vector reached which stage and whether the latest promotion succeeded.
This model supports controlled delivery because each stage can be tied back to a specific vector and each vector can be tied back to the artifacts that were assembled into it.

## Runtime boundary

The delivery flow described on this page ends before deployers act on workloads.
At that boundary, the target stage state exists in the cluster and the runtime controllers act on it.

From there, the runtime lifecycle turns the stage into running workloads:

1. Konfidence tracks the `Stage` and pulls the vector it selects.
2. It creates a [StageVersion](../reference/glossary.md#stageversion) that records this rollout. Stage versions capture stage changes over time and let a new version start while the active version keeps running.
3. [Deployers](../reference/glossary.md#deployer) translate the artifacts in the vector into workloads in the landscape. The Kubernetes deployer, provided by the [kubernetes-landscape-orchestrator](https://github.com/konfidence-project/kubernetes-landscape-orchestrator), is the deployer available in the current release.
4. [VectorAssignments](../reference/glossary.md#vectorassignment) link the deployed artifacts to the vector. An artifact shared by two vectors is deployed once.
5. Tasks prepare data for the new version.
6. Activation switches traffic to the new version once every step has completed.

[Create a stage](../deploy-operate/manage-delivery/stages.md) shows how to inspect the desired and active state of a stage during this lifecycle.

## Related pages

Read these pages for the surrounding concepts and task-oriented guidance:

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains the package model behind artifacts, aliases, and immutable vectors.
- [Landscapes and stages](./landscapes-and-stages.md) explains how operational contexts and delivery checkpoints remain separate.
- [System architecture](../deploy-operate/plan/system-architecture.md) explains how Konfidence and landscapes divide responsibility.
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md) explains the task-oriented flow for assembling vectors.
- [Set up and run promotion flows](../deploy-operate/manage-delivery/promote-vectors.md) explains promotion configuration, approval, and inspection.
