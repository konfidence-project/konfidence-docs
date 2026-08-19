---
title: Stages and Promotions
description: Understand how a stage selects the vector that runs in an environment and how a promotion moves a vector forward.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Stages and Promotions

A [vector](./vectors-and-artifacts.md) is an immutable snapshot of an application.
Once a vector has been assembled, two decisions remain: *where it runs* and *how it moves forward*.
Stages and promotions govern those two decisions.

Stages correspond to environments such as development, test, and production.
A **stage** defines which vector should be live in a given environment.
A **promotion** advances a vector from one environment to the next.

## Stages

A stage is a delivery checkpoint, usually an environment such as development, test, or production.
It names exactly one vector: the version that should be delivered there.
A stage can be pictured as a labeled slot that holds a single vector at a time.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Stage
metadata:
  name: dev-stage
spec:
  vector: registry.example.com//konfidence.cloud/demo-vector:3.0.0
```

Each stage runs on a [landscape](../deploy-operate/landscapes.md): the concrete infrastructure, such as a Kubernetes cluster, on which the application is deployed.
A single landscape can host several stages. For example, the development stages of multiple teams might share one cluster. The stage is the logical delivery checkpoint, and the landscape is the infrastructure beneath it.
Changing the vector on a stage changes what is delivered there.
A promotion normally makes that change, though `spec.vector` can also be set manually.

## Promotions

A promotion moves a vector forward by re-pointing a stage at a specific vector version.

Because a vector is immutable, a promotion is a lightweight operation: nothing is rebuilt, copied, or moved.
The vector already exists in the OCI registry, and the promotion only updates which vector the stage points to.

A `VectorPromotionConfig` connects one source to one target stage. The source is either a `VectorTemplate` or another `Stage` object.

With a template source, a `VectorPromotionConfig` forms the start of a delivery path: when an artifact change produces a newly assembled vector, that vector is moved to the first stage (typically development) automatically.

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

With a stage source, a `VectorPromotionConfig` defines how a vector should advance from one stage to the next, gated by approval:

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

Chaining several configurations together forms a delivery path: a template feeds development, development feeds test, and test feeds production.

<DrawioDiagram src="/assets/diagrams/promotion-sources.drawio" />

## How a promotion runs

Konfidence watches the defined `VectorPromotionConfig` objects.
When a source holds a newer vector than its target stage, Konfidence creates a `VectorPromotion` object: an immutable record of moving that exact vector to that stage.
If the promotion requires approval, it waits until it is approved. Otherwise, it proceeds automatically.
Konfidence then writes the vector onto the target stage.

A `VectorPromotion` references the configuration it came from, snapshots the source and target, and pins the concrete vector version. Its status reports how far the promotion has progressed:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: dev-to-test-1
  namespace: kden-p-demo
spec:
  vectorPromotionConfigName: dev-to-test
  source:
    kind: Stage
    name: dev-stage
    landscape: dev
  target:
    kind: Stage
    name: test-stage
    landscape: test
  vector: registry.example.com//konfidence.cloud/demo-vector:3.0.0
  requireApproval: true
  sequence: 1
status:
  state: Succeeded
```

Konfidence normally creates these records automatically, but a `VectorPromotion` can also be created by hand for a one-off promotion.
Because every promotion is a distinct record, the history of which vector reached which stage remains traceable.

## Promotion lifecycle

A promotion moves through a small set of states from creation to a terminal outcome.
On creation, it either waits for approval (`Waiting`) or becomes `Ready` immediately, depending on its source.
A ready promotion executes (`InProgress`) and writes the vector to the target stage, reaching `Succeeded`.
If the target stage cannot be resolved yet, the promotion is `Blocked` and retried until the target appears.
Whenever a newer promotion for the same configuration starts, any earlier promotion that has not finished is `Superseded`.

<DrawioDiagram src="/assets/diagrams/promotion-lifecycle.drawio" />

`Succeeded`, `Failed`, and `Superseded` are terminal.

For a task-oriented walkthrough of setting promotions up, reference the [Develop & Integrate guide](../develop-integrate/observe-improve/define-promotions.md).

## Related pages

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains how artifacts and vectors define the application version that a promotion pins to a stage.
- [Delivery Flow](./delivery-flow.md) explains how assembly, promotion, and deployment fit together.
- [Vector Deployments](./vector-deployments.md) explains what happens on a stage after its vector changes.
- [Projects](../deploy-operate/projects.md) explains the project namespace that templates and promotion configurations live in.
- [Landscapes](../deploy-operate/landscapes.md) explains the namespace each landscape manages, where stages live.
