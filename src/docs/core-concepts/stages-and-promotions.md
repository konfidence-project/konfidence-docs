---
title: Stages and Promotions
description: Understand how a stage references the vector that should be deployed and how a promotion updates that reference.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Stages and Promotions

A [vector](./vectors-and-artifacts.md) is an immutable snapshot of the artifacts that make up an application.
Once a vector has been assembled, it needs to be deployed to different environments as part of a delivery flow.
Stages and promotions govern that flow.

## Stages

A stage is a logical checkpoint in a delivery flow, such as development, test, or production.
It references one concrete vector version as its desired delivery state:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Stage
metadata:
  name: dev-stage
spec:
  vector: registry.example.com//konfidence.cloud/demo-vector:3.0.0
```

A stage exists in the namespace managed by a [landscape](../deploy-operate/landscapes.md). A landscape represents a deployment environment and can contain several stages, each referencing the vector that should be deployed there. The landscape targets the concrete infrastructure, such as a Kubernetes cluster, where those vectors are deployed.

For example, a development landscape could contain several stages that reference vectors with different feature sets enabled. One stage references vectors with experimental features, while another references only vectors with stable features. That stable stage can then be the starting point of a larger delivery flow that includes the test and production stages.

Separate teams can also share one development landscape, each with its own development stage. Each team's stage references a separate vector that contains a development version of that team's microservice alongside stable versions of the others. This lets each team test its changes without affecting the other teams' development.

When two stages in the same landscape reference vectors that share some artifacts, those artifacts are deployed only once and are reused, keeping the deployment footprint small.

## Promotions

A promotion re-points a stage to a specific vector version, updating which vector that stage references.

Because a vector is immutable, a promotion is a lightweight operation: the vector already exists in the OCI registry, so nothing is rebuilt, copied, or moved.

A `VectorPromotionConfig` connects one source to one target stage. The source is either a `VectorTemplate` or another `Stage` object.

With a template source, a `VectorPromotionConfig` forms the start of a delivery flow. The source resolves to the template's most recently assembled vector (`status.latestVector`), so whenever an artifact change produces a new one, the target stage (typically development) is automatically re-pointed to that vector.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: latest-to-dev
spec:
  source:
    kind: VectorTemplate
    name: demo-vector
  target:
    kind: Stage
    name: dev-stage
    landscape: dev
```

With a stage source, a `VectorPromotionConfig` connects one stage to the next in the delivery flow. The source resolves to the vector the stage currently references (`spec.vector`) and the target specifies which stage should be re-pointed to that vector, gated by approval.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: dev-to-test
spec:
  source:
    kind: Stage
    name: dev-stage
    landscape: dev
  target:
    kind: Stage
    name: test-stage
    landscape: test
```

Chaining several configurations together forms a delivery flow: the template is the source for the development stage, the development stage is the source for the test stage, and the test stage is the source for the production stage.

<DrawioDiagram src="/assets/diagrams/promotion-sources.drawio" />

## How a promotion runs

Konfidence watches the defined `VectorPromotionConfig` objects.
When a source references a different vector than its target stage, a `VectorPromotion` object is automatically created. It is an immutable record of re-pointing the target stage to the source vector.
Whether a promotion requires approval is recorded in its `requireApproval` property, which Konfidence defaults from the config's source: a `Stage` source requires approval, a `VectorTemplate` source does not. A promotion that requires approval waits until it is approved; otherwise it proceeds automatically by re-pointing the target stage.
Because every promotion is a distinct record, the history of which vector each stage referenced remains traceable.

## Promotion lifecycle

A promotion moves through a small set of states from creation to a terminal outcome.
On creation, a promotion waits for approval (`Waiting`) when its `requireApproval` property is set, or becomes `Ready` immediately when it is not.
A `Ready` promotion is queued for execution. When Konfidence executes it, the promotion becomes `InProgress` and re-points the target stage to the vector specified in the promotion's spec. It then reaches `Succeeded`, or `Failed` if execution cannot complete.
If the target stage cannot be resolved yet, the promotion is `Blocked` and execution is retried until the target appears.
Whenever a newer promotion for the same configuration starts, any earlier promotion that has not finished is `Superseded`.

<DrawioDiagram src="/assets/diagrams/promotion-lifecycle.drawio" />

`Succeeded`, `Failed`, and `Superseded` are terminal.

For step-by-step instructions, see [Define promotions](../develop-integrate/observe-improve/define-promotions.md).

## Related pages

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains how artifacts and vectors define the application version that a promotion pins to a stage.
- [Delivery Flow](./delivery-flow.md) explains how assembly, promotion, and deployment fit together.
- [Vector Deployments](./vector-deployments.md) explains what happens on a stage after its vector changes.
- [Projects](../deploy-operate/projects.md) explains the project namespace that templates and promotion configurations live in.
- [Landscapes](../deploy-operate/landscapes.md) explains the namespace each landscape manages, where stages live.
