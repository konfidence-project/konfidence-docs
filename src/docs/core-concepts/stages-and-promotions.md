---
title: Stages and Promotions
description: Understand how a stage references one concrete vector and how promotions update that reference.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Stages and Promotions

A stage holds exactly one vector at a time.
A promotion records an update of the target stage to reference one concrete vector version.
Konfidence creates that record automatically when the vector it watches drifts from the vector on the stage.
No content is transferred, and the vector itself is never changed by a promotion.

Code style marks Kubernetes custom resources, their fields, their conditions, and the states derived from those conditions.
The concepts stage, vector, and promotion describe the delivery model that those resources configure.

Every example on this page comes from one demo project.
It has a `demo-vector` template, a development, test, and production chain, and the registry `registry.demo.local`.

## Stages

A stage is a delivery checkpoint such as development, test, or production.
It names the vector that should be the current delivery state for that checkpoint.

The whole selection is one field.
`Stage.spec.vector` carries a concrete Open Component Model (OCM) component version reference:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Stage
metadata:
  name: dev-stage
  namespace: kden-l-demo-dev
spec:
  vector: registry.demo.local/demo//konfidence.cloud/demo-vector:3.0.0
```

Stages live in the namespace that their `Landscape` manages, while the resources that configure promotions live in the project namespace.
Promotions themselves are created in the project namespace next to their configuration, even though the stage they write lives elsewhere.
Konfidence never creates a stage as part of a promotion.
A promotion configuration that points at a missing stage reports that on its own `Ready` condition and recovers as soon as the stage appears.

You can also set `Stage.spec.vector` manually.
A configuration with a stage source sees that edit as drift and creates a promotion for the new version.

## Promotions

A promotion is the declarative record that re-points one target stage at one pinned vector version.
The `VectorPromotion` custom resource is that record.
Its source reference, target reference, pinned vector, approval requirement, and ordinal are fixed when the promotion is created and cannot be edited afterwards.

Promotions are normally created automatically by the configuration's controller.
When the vector a configuration watches differs from the vector on the target stage, that controller creates a promotion for the concrete version it found.
There is no drift flag anywhere in status: the `VectorPromotion` object is the detected drift.

A `VectorPromotion` is an ordinary API object, so the same self-contained record can also be created directly.
Every promotion names the configuration it belongs to in `spec.vectorPromotionConfigRef`, including a hand-written one.
That name is what groups promotions for serialization, supersession, and retention.
Execution itself never reads the configuration.

A promotion carries no credentials and no verification settings.
It re-points the target stage at a component version that already exists in the registry, and never rebuilds or transfers OCM content.
Signing, verification, and registry credentials belong to vector assembly, where the vector is built and pushed.
A promotion only changes which already-existing version a stage references.

Two rules keep the model predictable.
Only one promotion per configuration executes at a time, and the approved promotion with the highest sequence number executes next.
Older promotions that have not finished are marked superseded when the winner starts.

Supersession is scoped to a single configuration.
Two configurations that write the same stage never supersede each other's promotions, so avoid that shape outside deliberate cases such as a hotfix flow that skips test stages.

A superseded promotion is locked for good.
It can never be approved or executed afterwards.
That prevents an approver from rolling a stage back by approving a stale candidate.

## Promotion sources

A promotion configuration declares one flow: one source, one target.
The `VectorPromotionConfig` custom resource holds that declaration.
The target is always a `Stage`, because a stage is the only thing a promotion writes.
The source is either a `VectorTemplate` or a `Stage`, and that single choice determines what kind of flow you get.

The diagram shows both source kinds in one chain.

<DrawioDiagram src="/assets/diagrams/promotion-sources.drawio" />

### Template sources

With a `VectorTemplate` source, the promotion tracks the template's latest assembled vector, published in `VectorTemplate.status.latestVector`.
This is the normal way a newly assembled version reaches its first stage.
Promotions from a template source are auto-approved, so a fresh assembly reaches the first stage without a human step:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: latest-to-dev
  namespace: kden-p-demo
spec:
  source:
    kind: VectorTemplate
    name: demo-vector
  target:
    kind: Stage
    name: dev-stage
    landscape: dev
```

A template reference carries no `landscape` field.
Templates live in the same project namespace as the configuration, so the name alone resolves them.

### Stage sources

With a `Stage` source, the promotion tracks the vector selected on that stage, which is `Stage.spec.vector`.
This is the promotion between environments: the vector referenced by the development stage becomes the candidate for test.
Promotions from a stage source require approval, so moving a version forward is a deliberate act:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: dev-to-test
  namespace: kden-p-demo
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

Each configuration defines one source and one target.
Multiple configurations form a promotion chain: a template feeds development, development feeds test, and test feeds production.
Because each configuration names its own landscapes, the chain spans landscapes without any resource knowing about the chain as a whole.

The source kind fully determines `VectorPromotion.spec.requireApproval` for promotions the controller creates.
A `Stage` source produces gated promotions, and a `VectorTemplate` source produces auto-approved ones.
The configuration itself has no approval field, so other combinations appear only on promotions created directly.

### Landscape references

A stage reference carries a `landscape` value, which is the `metadata.name` of a `Landscape` object in the configuration's own namespace.
The controller resolves that `Landscape` to the namespace it manages and looks for the stage there.
References stay human-readable this way, and referencing a stage in another project becomes impossible by construction.

### The promotion snapshot

A promotion follows a fixed sequence: resolve the source, snapshot the result, resolve the target during execution.

At creation, the controller resolves the source and pins the concrete vector it finds into the new promotion.
The source reference, the target reference, and that pinned vector are written together, and from then on the snapshot is immutable.
Approving a promotion approves exactly the snapshotted vector for exactly the snapshotted destination, no matter how the configuration is edited afterwards.

The target is not resolved at creation.
Execution resolves it from the snapshot on every pass, as the lifecycle below describes.

## The promotion lifecycle

Every promotion follows the same path, whether it was auto-approved or waited for a person.

Three kinds of value describe a promotion's progress, and they are not interchangeable.

| Kind | Values | Role |
| --- | --- | --- |
| Condition | `Approved`, `Succeeded` | the source of truth, written by the controller |
| Reason | `AutoApproved`, `ManuallyApproved`, `WaitingForApproval`, `PromotionSuperseded`, `PromotionTimedOut` | explains the condition it is attached to |
| Derived state | `Pending`, `WaitingForApproval`, `Approved`, `InProgress`, `Blocked`, `Succeeded`, `Failed`, `Superseded` | `status.state`, one display value recomputed from the conditions whenever they change |

Some names appear in more than one row.
The lifecycle below uses the derived state names, and names a condition or reason where it is the underlying record.

<DrawioDiagram src="/assets/diagrams/promotion-lifecycle.drawio" />

Drift detection starts it.
The configuration's controller watches its source template, its source stage, its target stage, and the landscapes involved.
Changes therefore arrive as events, instead of being discovered by polling a registry.
Drift detection compares two references, so nothing is downloaded to decide whether a promotion is due.

A promotion is created only when the source has a vector that differs from the one on the target stage.
No promotion is created when a live promotion already pins that same version.

Each new promotion gets an ordinal, recorded in `VectorPromotion.spec.sequence`.
The controller keeps a monotonic counter on the configuration and stamps the next value into the promotion it creates.
The counter is committed before the promotion is created, so a crash leaves a gap in the ordinals rather than a duplicate.

Vector versions carry no inherent order.
Creation timestamps only have second resolution.
The ordinal is therefore what makes "newer" well defined during a burst of changes.

Approval comes next.
A promotion that does not require approval gets its `Approved` condition from the controller immediately, with `AutoApproved` as the reason.
Such a promotion reads as `Pending` until that condition is written.
A promotion that requires approval sits in `WaitingForApproval` until the Konfidence API records a grant.

Approvals are granted through the Konfidence API.
The promotion's `status.approvals` list records who approved and when.
The API's own authorization model decides who may approve.

If the source produces several versions while one waits, each version gets its own promotion.
Every candidate stays visible instead of being silently collapsed into the latest one.

Execution is serialized per configuration.
At most one promotion for a configuration is `InProgress`.
The approved promotion with the highest sequence number is the one that runs.

When it starts, it supersedes every older sibling that has not finished.
Promotions created after it keep their chance to run later.

Execution itself is one patch of the target stage.
It sets the pinned vector and stamps which promotion wrote it.

The promotion then reaches one of three terminal states.
`Succeeded` means the target stage now carries the pinned vector.
`Superseded` means a newer promotion for the same configuration took over.
`Failed` means the promotion ended without writing the target stage.

If a promotion exceeds the fixed five-minute execution deadline, it enters `Failed` with the reason `PromotionTimedOut`.
No field on either resource changes that deadline.

One state in the middle is worth naming.
Execution resolves the target from the snapshot on every pass: it walks from the snapshotted `landscape` value to the managed namespace and then to the stage.
`Blocked` means an approved promotion whose target does not resolve at that moment, for example because the landscape has no managed namespace yet or the stage does not exist.
A blocked promotion is not finished.
It is retried until the target resolves.
The configuration's `Ready` condition explains what is missing, as long as the configuration still points at the same target.

### Recovery

Nothing in the model replays a promotion.
A terminal promotion stays terminal, a superseded one stays locked, and no controller rewrites a promotion's pinned snapshot.
When something needs to happen again, drift detection re-reads the current source vector and the current target vector and creates a fresh promotion with a new ordinal.
What runs is therefore always a decision about the state of the system now, never a replay of an old one.

### Retention

Finished promotions are bounded by count, and optionally also by time.
The two mechanisms work independently of each other.

`VectorPromotionConfig.spec.keepLastPromotions`, which defaults to 10, bounds how many terminal promotions accumulate per configuration.
Everything older than that bound is deleted.
`VectorPromotionConfig.spec.ttlAfterFinished` is optional, and deletes a terminal promotion once the chosen duration has elapsed since it finished, whatever the count says.
A promotion whose configuration sets no time-to-live is never deleted by time, and is trimmed by count alone.

The two settings are read at different moments.
The time-to-live is copied onto each promotion when that promotion is created, so a change to the configuration reaches only promotions created after it.
The count bound is read from the current configuration on every retention pass.

Promotions still waiting for approval are not capped.
The length of the approval queue is a signal worth seeing, not something to trim.
Deleting a configuration removes the promotions its controller created, because those carry an owner reference back to it.

## The previous alias-based promotion model

Earlier versions of Konfidence promoted by moving alias tags in the registry: a `VectorTemplate` pushed a vector under an alias such as `latest`, and a `StageConfiguration` resource polled the registry and followed that alias.
That model is replaced.
Concrete vector versions are written to the `Stage` object directly, `StageConfiguration` is obsolete, and a promotion references stages instead of tags.
The change removes the polling delay, removes the need to download a vector to detect drift, and gives every promotion exactly one target stage.
The architecture decision record ADR-0032 documents the full rationale.

One capability is traded away with the alias tags.
A registry alias could act as a source of truth between disconnected environments, which is useful in distributed and air-gapped setups.
The current model does not cover that case.
ADR-0032 names an Open Container Initiative (OCI) source kind as a possible future extension to restore it; it is not part of the current model.

## Related pages

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains how artifacts and vectors define the application version that a promotion pins to a stage.
- [Delivery Flow](./delivery-flow.md) explains how assembly, promotion, and deployment fit together.
- [Vector Deployments](./vector-deployments.md) explains what happens on a stage after its vector changes.
- [Projects](../deploy-operate/projects.md) explains the project namespace that templates, promotion configurations, and promotions live in.
- [Landscapes](../deploy-operate/landscapes.md) explains the namespace each landscape manages, where stages live.
