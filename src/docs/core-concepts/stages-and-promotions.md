---
title: Stages and Promotions
description: Understand how a stage holds one concrete vector and how promotions move that vector to the next stage.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Stages and Promotions

A stage holds exactly one vector at a time.
A promotion is the record of one concrete vector version moving onto one stage.
Konfidence creates that record automatically when the vector it watches drifts from the vector on the stage.
The vector itself is never changed by a promotion.

Code style marks Kubernetes custom resources, their fields, their conditions, and the states derived from those conditions.
The concepts stage, vector, and promotion describe the delivery model that those resources configure.

Every example on this page comes from one demo project.
It has a `demo-vector` template, a development, test, and production chain, and the registry `registry.demo.local`.

<DrawioDiagram src="/assets/diagrams/promotion-sources.drawio" />

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

You can also set `Stage.spec.vector` by hand.
A configuration with a stage source sees that edit as drift and creates a promotion for the new version.

## Promotions

A promotion is a declarative record that one pinned vector version moves to one target stage.
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
Signing, verification, and registry access all stay at assembly time, where the vector is built.

Two rules keep the model predictable.
Only one promotion per configuration executes at a time, and the newest approved one wins.
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

The diagram at the top of this page shows both source kinds in one chain.

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

With a `Stage` source, the promotion tracks the vector currently active on that stage, which is `Stage.spec.vector`.
This is the promotion between environments: whatever is running on development becomes the candidate for test.
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

Each configuration describes one hop.
Chaining them builds a path: a template feeds development, development feeds test, and test feeds production.
Because each hop names its own landscapes, the chain spans landscapes without any resource knowing about the chain as a whole.

The source kind fully determines `VectorPromotion.spec.requireApproval` for promotions the controller creates.
A `Stage` source produces gated promotions, and a `VectorTemplate` source produces auto-approved ones.
The configuration itself has no approval field, so other combinations appear only on promotions created directly.

### Landscape references

A stage reference carries a `landscape` value, which is the `metadata.name` of a `Landscape` object in the configuration's own namespace.
The controller resolves that `Landscape` to the namespace it manages and looks for the stage there.
References stay human-readable this way, and referencing a stage in another project becomes impossible by construction.

### The promotion snapshot

The source is only ever resolved on the configuration's side.
The concrete vector it resolves to is pinned into the promotion at creation.
The configuration's current source reference, target reference, and that concrete vector are snapshotted into the promotion together.
Approving a promotion approves exactly the snapshotted vector for exactly the snapshotted destination, no matter how the configuration is edited afterwards.

The target reference is snapshotted as well, but it is resolved again on every execution pass.
Execution reads only the promotion, and walks from its `landscape` value to the managed namespace and then to the stage.
A target that does not resolve at that moment is where `Blocked` comes from.

## The promotion lifecycle

Every promotion follows the same path, whether it was auto-approved or waited for a person.

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
A promotion that does not require approval is approved by the controller immediately, with `AutoApproved` as the reason.
Such a promotion reads as `Pending` until that condition is written.
A promotion that requires approval sits in `WaitingForApproval` until the Konfidence API records a grant.

Approvals are granted through the Konfidence API.
The promotion's `status.approvals` list records who approved and when.
The API's own authorization model decides who may approve.

If the source produces several versions while one waits, each version gets its own promotion.
Every candidate stays visible instead of being silently collapsed into the latest one.

Execution is serialized per configuration.
At most one promotion for a configuration is `InProgress`.
The newest `Approved` one is the one that runs.

When it starts, it supersedes every older sibling that has not finished.
Promotions created after it keep their chance to run later.

Execution itself is one patch of the target stage.
It sets the pinned vector and stamps which promotion wrote it.

The promotion then reaches one of three ends.
`Succeeded` means the target stage now carries the pinned vector.
`Superseded` means a newer promotion for the same configuration took over.
`Failed` means the promotion ended without writing the target stage.

The reason you are most likely to see behind `Failed` is `PromotionTimedOut`.
A promotion that stays in progress past the five-minute execution deadline is retired that way.
The five-minute deadline is fixed, and no field on either resource changes it.
A promotion that times out is a signal to investigate rather than a limit to raise.

One state in the middle is worth naming.
`Blocked` means an approved promotion whose target does not currently resolve, for example because the landscape has no managed namespace yet or the stage does not exist.
A blocked promotion is not finished.
It is retried until the target resolves.
The configuration's `Ready` condition explains what is missing, as long as the configuration still points at the same target.

The two conditions `Succeeded` and `Approved` are the source of truth for all of this.
The `status.state` value you read in a listing is derived from those conditions and recomputed whenever they change.

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

The two knobs are read at different moments.
The time-to-live is copied onto each promotion when that promotion is created, so a change to the configuration reaches only promotions created after it.
The count bound is read from the current configuration on every retention pass.

Promotions still waiting for approval are not capped.
The length of the approval queue is a signal worth seeing, not something to trim.
Deleting a configuration removes the promotions its controller created, because those carry an owner reference back to it.

## The replaced alias tag model

Earlier versions of Konfidence promoted by moving alias tags in the registry.
A `VectorTemplate` pushed a vector under an alias such as `latest`.
A `StageConfiguration` resource polled the registry for changes on that alias.
A promotion was performed implicitly, by repointing the alias that the target's `StageConfiguration` watched.

That model is replaced.
Concrete vector versions are written to the `Stage` object directly, which makes `StageConfiguration` obsolete.
A promotion references stages instead of tags.

The change removes the propagation delay of polling.
It removes the need to download a vector to detect drift.
It also gives every promotion exactly one target stage, instead of a tag that may affect several stages or none.

One capability is traded away with the alias tags.
A registry alias could act as a source of truth between disconnected environments, which is useful in distributed and air-gapped setups.
The simpler model was accepted because it is sufficient for non-distributed use cases.
An Open Container Initiative (OCI) source kind, combined with letting a `VectorTemplate` publish a tagged vector again, could restore that flexibility later without bringing back a separate configuration resource.

## Related pages

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains how artifacts and vectors define the application version that a promotion moves.
- [Delivery Flow](./delivery-flow.md) explains how assembly, promotion, and deployment fit together.
- [Vector Deployments](./vector-deployments.md) explains what happens on a stage after its vector changes.
- [Projects](../deploy-operate/projects.md) explains the project namespace that templates, promotion configurations, and promotions live in.
- [Landscapes](../deploy-operate/landscapes.md) explains the namespace each landscape manages, where stages live.
