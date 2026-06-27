---
title: Delivery Flow
description: Understand how Konfidence orchestrates the complete software delivery process from build to production.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Delivery Flow

<!--
  Content type (Diátaxis): Explanation. This page explains how the delivery flow works and keeps task instructions out of scope.
  The flow described here ends at the Galaxy boundary. The runtime deployment lifecycle in Stars and landscapes is covered by the Vector Deployments page.
  TODO: Confirm whether future docs should name the generated synchronization resource as GalaxySync or StageSync. Existing developer input for this file names GalaxySync; planning notes mention StageSync.
-->

The Konfidence delivery flow describes how build outputs become controlled deployment state.
It starts with artifacts published by CI pipelines, assembles those artifacts into an immutable vector, assigns that vector to a stage, and promotes vectors toward later delivery targets.

The main relationship to understand is:

- Artifacts are the inputs.
- A vector is the immutable application version assembled from those inputs.
- A stage selects which vector should be delivered for a delivery checkpoint.
- A promotion makes a vector available at another target location without changing the vector itself.

## The delivery flow in Konfidence

The delivery flow sits between artifact publishing and runtime deployment.
It is part of the Galaxy-side control plane and describes how Konfidence turns build outputs into target stage state.

This page focuses on the delivery state before runtime deployment starts.
It does not describe how deployers create workloads in a landscape.
That runtime lifecycle starts after a Star pulls the target stage state from Galaxy.

### Delivery flow at a glance

Read the flow as a progression of state:

| Phase | Result | Konfidence concept or resource |
| --- | --- | --- |
| Build | Build results are available as artifacts in an OCM-compliant repository. | Artifact |
| Assemble | Selected artifacts are combined into one immutable vector. | Vector, `VectorTemplate` custom resource |
| Assign | A stage points to the vector that should be delivered. | Stage, `StageConfiguration` custom resource |
| Promote | The vector is copied to another registry location or path for a later target. | `VectorPromotionConfig`, `VectorPromotion` custom resources |

Entries in code style are Kubernetes custom resources.
Concepts such as artifact, vector, and stage describe the delivery model that those resources configure.

## Flow phases

### Build: publish artifacts

Konfidence does not prescribe how teams build their applications.
A CI pipeline can use the build system that fits the application, as long as the resulting artifact is available in an Open Component Model (OCM)-compliant repository.

For the later delivery phases to consume the artifact, the artifact must also be referenced by an alias that is not a semantic version.
That alias gives Konfidence a stable reference that can be used when assembling and promoting vectors.

### Assemble: define the vector

A vector is the complete application version that Konfidence moves through the delivery flow.
It contains the selected artifacts and represents the desired application state at a specific point in time.

The `VectorTemplate` custom resource defines how Konfidence assembles that vector.
The most important fields are:

- `uploadTarget`, which defines where the assembled vector is stored.
- `components`, which defines which previously built artifacts are part of the vector.
- `config`, which references credentials used to access the required registries.
- `base`, which can optionally reference an existing vector to build on.

The following example shows the relationship between those fields:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: example-vector
  namespace: default
spec:
  uploadTarget: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  components:
    - name: https://registry.kdenv.lab/sample-project//konfidence.project/sample-vector/service1:latest
    - name: https://registry.example.com/sample-project//example.tools/dev/service2:latest
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

Both the `uploadTarget` and the entries under `components` use aliases so that Konfidence can fetch the referenced resources.
The component artifacts do not have to be stored in the same registry as the vector target.
If a component artifact is stored elsewhere, Konfidence copies it into the target registry defined by `uploadTarget`.

When `base` is set, the new vector includes the artifacts from the base vector and the additional artifacts listed under `components`.
This lets teams derive a new vector from an existing vector without redefining every artifact reference.

### Assign: connect the vector to a stage

After a vector has been assembled, the delivery flow connects it to a stage.
A stage is a defined checkpoint in the delivery process and references one vector at a time.

The `StageConfiguration` custom resource describes that relationship.
It defines the stage name, the vector assigned to that stage, and the target location where the stage state should be created.

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: StageConfiguration
metadata:
  name: stage-configuration-example
  namespace: default
spec:
  name: example-stage
  vector: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  targetWorkspace: root:sample-organization
  targetNamespace: dev-eu10
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

In this example, `vector` references the component that was configured as the `uploadTarget` in the `VectorTemplate`.
The stage named `example-stage` is created in the Kubernetes namespace `dev-eu10` inside the KCP workspace `root:sample-organization`.
As with vector assembly, `config` gives Konfidence the registry access information it needs to fetch the vector.

<!-- TODO: Existing developer input says KCP might be removed in the future. If that happens, update or remove targetWorkspace from this explanation and example. -->

### Promote: prepare a vector for another target

Promotion makes a vector available at a different registry location or path.
This supports flows such as moving a verified vector from a development target to a test or production target.

Konfidence separates promotion configuration from promotion execution:

- `VectorPromotionConfig` defines the source vector, the target location, and the registry access configuration.
- `VectorPromotion` triggers one execution of that configuration.

The `VectorPromotionConfig` describes where the vector comes from and where it should be copied:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: example-vector-promotion-config
  namespace: default
spec:
  source: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  target: https://registry.example.com/sample-project//example.tools/constructed-vector:promoted
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

The `VectorPromotion` references that configuration and triggers a one-time promotion:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: example-vector-promotion
  namespace: default
spec:
  vectorPromotionConfigRef: example-vector-promotion-config
  ttlAfterFinished: 1h
```

A `VectorPromotion` is executed only once, whether it succeeds or fails.
This protects vector aliases from accidental overwrites because promotions happen only when explicitly triggered.

The `ttlAfterFinished` field defines how long the `VectorPromotion` resource remains after execution.
After the TTL expires, the resource is cleaned up.
The status of a promotion is reflected on the referenced `VectorPromotionConfig`, which exposes both the most recent promotion status and the most recent successful promotion status.
If the most recent promotion succeeded, both status values describe the same promotion.

## Resource relationships

The resources in the delivery flow point to each other through vector references:

- `VectorTemplate.spec.uploadTarget` defines the vector that assembly creates.
- `StageConfiguration.spec.vector` points to the vector that a stage should use.
- `VectorPromotionConfig.spec.source` points to the vector to promote.
- `VectorPromotionConfig.spec.target` defines where the promoted vector should be available.
- `VectorPromotion.spec.vectorPromotionConfigRef` points to the promotion configuration that should run once.

These relationships keep the vector contents separate from the delivery state around the vector.

## Runtime boundary

The delivery flow described on this page ends before deployers act on workloads.
At that boundary, Galaxy has produced the target stage state that a Star can pull and apply in its landscapes.

After that point, the runtime deployment lifecycle starts.
That lifecycle includes concepts such as vector deployments, artifact deployments, vector assignments, tasks, and activation.
For those concepts, see [Vector Deployments](./vector-deployments.md).

## Immutability and promotion state

Konfidence treats vectors as immutable application versions.
When a service, configuration, or artifact reference changes, the result is a new vector instead of a mutation of an existing one.

That immutability gives promotion a clear meaning.
Promotion moves or copies a known vector reference to a target location; it does not rewrite the vector contents.
Because `VectorPromotion` resources are one-time triggers and promotion status is recorded on `VectorPromotionConfig`, teams can understand which vector was promoted and whether the latest promotion succeeded.

This model supports controlled delivery because each stage can be tied back to a specific vector and each vector can be tied back to the artifacts that were assembled into it.

## Related pages

Read these pages for the surrounding concepts and task-oriented guidance:

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains the package model behind artifacts and immutable vectors.
- [System Architecture](./system-architecture.md) explains how Galaxy, Star, and landscapes divide responsibility.
- [Vector Deployments](./vector-deployments.md) explains the runtime deployment concepts that apply after a vector reaches a target landscape.
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md) explains the task-oriented flow for assembling vectors.
- [Define promotions](../develop-integrate/observe-improve/define-promotions.md) explains the task-oriented flow for promotion setup.
