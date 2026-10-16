---
id: ADR-0038
title: "Promotion gates"
description: "A readiness-gate mechanism that blocks a VectorPromotion from executing until every configured gate is satisfied, using one uniform contract for core and third-party gates."
status: proposed
date_proposed: 2026-10-06
authors: [JNKielmann]
category: Architecture Pattern
impact: High
dependencies: [ADR-0032, ADR-0012, ADR-0013]
pageClass: adr
outline: deep
---
# ADR-0038: Promotion gates

<AdrHeader />

## Context

[ADR-0032](./adr-0032-vector-promotions.md) established how promotions work today. A `VectorPromotionConfig` watches a source and target for drift. When the source changes, the config controller creates a self-contained `VectorPromotion` that snapshots the concrete vector version and the source and target references. The promotion then runs through a condition-derived lifecycle: `Waiting → Ready → InProgress → Succeeded`, with `Blocked`, `Failed`, and `Superseded` branches.

A promotion only leaves `Waiting` once it is **cleared**. Today "cleared" means a single check:

- Promotions sourced from a `Stage` are created with `requireApproval: true` and wait for an `Approved` condition, which the Konfidence API sets through one audited entry point that records `approvedBy` and `approvedAt`.
- Promotions sourced from a `VectorTemplate` are created with `requireApproval: false` and clear immediately.

### The source-stage activation gate

Epic [#355](https://github.com/konfidence-project/konfidence/issues/355) wants Product Managers to choose between **immediate** and **readiness-based** promotion. In concrete terms, a readiness-based promotion must wait until the vector has activated successfully on the source stage before it moves on.

The signal for "activated successfully on a stage" already exists. The activation controller ([ADR-0012](./adr-0012-activation-controller.md)) updates the stage's "active" `StageVersionUsage` ([ADR-0013](./adr-0013-stage-version-usage.md)) only after every activation task has succeeded, and the stage controller mirrors it into `Stage.status.activeStageVersion`. Resolving that reference to its `StageVersion.spec.vector` gives the vector currently serving traffic on the stage.

There is a gap today. The promotion trigger resolves a `Stage` source through `Stage.spec.vector`, the *desired* vector, which a previous promotion writes the instant it executes, before activation has run. A promotion to the next stage can therefore fire before the source stage has actually activated. A source-stage activation gate closes this gap by holding the promotion until `Stage.status.activeStageVersion` resolves to the promoted vector.

### Requirements

Any solution must satisfy all of the following:

1. **Extensible by outside contributors without core changes.** A third party must be able to add a new gate condition, for example "end-to-end tests passed", by shipping their own controller. That means no change to the `VectorPromotion` controller, no entry in a closed gate-type list, and no core redeploy.
2. **One uniform mechanism for core and custom gates.** Gates shipped by core (human approval, source-stage activation) and gates added by an extension use the identical contract. Core gates get no privileged evaluation path, and human approval must become an ordinary gate rather than a special case in the controller.
3. **Overridable.** An operator must be able to force a promotion past open gates in an emergency, with an audit record of who did it and when.

## Considered options

**Gates are a typed, declarative list.** A `VectorPromotionConfig` declares the gates every promotion it creates must pass, each named by a `type`:

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
  gates:
    - type: konfidence.cloud/ActivatedOnSourceStage
    - type: konfidence.cloud/HumanApproval
    - type: example.com/E2ETests   # a third-party gate, declared the same way
```

Each gate is identified by its `type`, and the gate list is a map keyed by `type` (`listType=map`), so a config declares at most one gate of each type and the `type` alone identifies a gate within a promotion. The `VectorPromotion` controller never interprets the `type`; it only tracks whether that gate is satisfied, which keeps the core agnostic to gate types (requirement 2). Core cannot know what a third-party gate requires, so validating a gate's configuration is the gate controller's job. It should detect a misconfiguration and report it rather than leave the promotion waiting on a gate that can never pass, such as a `konfidence.cloud/ActivatedOnSourceStage` gate on a `VectorPromotionConfig` whose source is a `VectorTemplate`, which has no source stage. How a controller reports such a problem is covered in the [open questions](#open-questions).

A gate takes no parameters in this design. If a gate later needs extra information, the gate entry could gain an optional `spec` that only its writer interprets. That is a future extension, not part of this design.

The gate list is snapshotted immutably into each `VectorPromotion` at creation, exactly as the vector and the source and target references already are. Approving or clearing a promotion therefore always refers to the gates that were in force when it was created, immune to later config edits.

**The controller is agnostic to gate types.** The `VectorPromotion` controller never knows what a gate *means*. It only knows whether each declared gate is satisfied. This generalises today's single predicate:

- Today: `cleared = isApproved || !requireApproval`.
- Proposed: `cleared = every declared gate is satisfied`.

A promotion stays `Waiting` until all its gates are satisfied, then derives `Ready` and proceeds through the unchanged serialization, superseding, and execution flow.

**Gate state is written by external parties, never computed by the `VectorPromotion` controller.** This is the heart of requirement 2. It mirrors how approval already works, where the API grants it rather than the controller, and how `VectorData.Ready` already works, where a runtime-specific controller writes a condition the core waits on. For each declared gate type there is a *writer*, a controller or an API endpoint, that observes the real-world condition and reports the gate satisfied:

| Gate `type` | Writer | Satisfied when |
| --- | --- | --- |
| `konfidence.cloud/HumanApproval` | Konfidence API (existing approval entry point) | A caller with approval rights approves the promotion. |
| `konfidence.cloud/ActivatedOnSourceStage` | A core-shipped gate controller | `Stage.status.activeStageVersion` on the source stage resolves to the promotion's snapshotted vector. |
| `example.com/E2ETests` | The contributor's own controller | Their test run reports success. |

The three rows share one mechanism. `konfidence.cloud/HumanApproval` and `konfidence.cloud/ActivatedOnSourceStage` are shipped by core only in the sense that their writers live in the Konfidence binary. They are declared and evaluated identically to any third-party gate.

**Every gate records its provenance in the status.** When a gate is set satisfied, the VectorPromotion status records three facts about it as explicit fields: when it was set, which entity set it, and a reason. This mirrors the current `status.approval`, which records `approvedAt` and `approvedBy`, and it works the same way for every gate. A `konfidence.cloud/ActivatedOnSourceStage` gate records its gate controller as the entity, with the reason that the stage is active. A `konfidence.cloud/HumanApproval` gate records the approving user. A third-party gate records its own controller. For a human action the entity comes from the authenticated session rather than the request body, exactly as the current approval path takes `identity.Subject`. A gate is set satisfied at most once.

Gate controllers set gate state through a provided Go library that writes the condition and records its provenance in one update, so the condition status and the `setBy`, `setAt`, and reason never drift apart. The convention is that controllers always use this library and human callers always go through the Konfidence API, which takes the acting identity from the authenticated session rather than a client-supplied value. The provenance is advisory and not a security boundary. Nothing currently enforces that `setBy` is truthful, so any actor with enough cluster access to patch the promotion status can write or overwrite it with an arbitrary value.

**Override is not a separate mechanism.** Forcing a gate open is just setting that gate satisfied by hand. The gate goes `True` like any other, with the person recorded as the entity and the reason noting the override. `cleared` stays "every declared gate is satisfied", and an operator clears a stuck gate, say `konfidence.cloud/ActivatedOnSourceStage` when the stage will never activate, through the same audited API that grants approval, which stamps their identity and justification. One code path covers every gate, which satisfies requirement 3.

**Immediate vs readiness-based promotion**, the goal of the epic, is then just the contents of `gates`. An empty list promotes immediately. A list containing `konfidence.cloud/ActivatedOnSourceStage` promotes only after the source stage has activated the vector.

The requirements rule out several designs up front. Fixed boolean fields per gate, a closed gate-type enum the controller evaluates, and a built-in-plus-custom hybrid all fail requirement 1 or 2, so none are considered here. What remains is a real choice about how a gate's state is stored on the promotion. Both options below satisfy every requirement.

### Option 1: Inline gate list, state as conditions on the `VectorPromotion`

Each declared gate maps one-to-one to a `metav1.Condition` in the promotion's `status.conditions`, keyed by the gate's `type`. This adds no new resource and reuses the status array that already carries the `Approved` and `Succeeded` conditions.

This mirrors [Kubernetes Pod readiness gates](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-readiness-gate). The promotion declares the gate conditions it requires. An external writer, either the gate's controller or the approval API, sets each condition in the status. The `VectorPromotion` controller stays read-only over them and only ANDs them into the `Waiting → Ready` decision, the way kubelet ANDs readiness-gate conditions into a Pod's `Ready` condition without writing them. A gate is satisfied only when its condition is `True`, and an absent condition means still open. A writer reports an error by setting its condition to `False` with a reason describing the problem, which the controller surfaces instead of leaving the promotion waiting indefinitely. A condition cannot record which entity set the gate, so that fact goes in a small parallel per-gate record in the status, together with the timestamp and reason.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: dev-to-test-7
spec:
  vectorPromotionConfigName: dev-to-test
  source: { kind: Stage, name: dev-stage, landscape: dev }
  target: { kind: Stage, name: test-stage, landscape: test }
  vector: https://.../my-vector:2026.10.06-091200000Z
  # Immutable snapshot of the config's gates at creation time
  gates:
    - type: konfidence.cloud/ActivatedOnSourceStage
    - type: example.com/E2ETests
  sequence: 7
status:
  # derived: Waiting until every declared gate has a True condition
  state: Waiting
  conditions:
    # keyed by gate type; example.com/E2ETests has no condition yet, so it is still open
    - type: konfidence.cloud/ActivatedOnSourceStage
      status: "True"
      reason: ActivatedOnSource
  # provenance the condition cannot hold: entity + explicit timestamp (+ reason)
  gateProvenance:
    - gate: konfidence.cloud/ActivatedOnSourceStage
      setBy: konfidence/activated-on-source-stage-controller
      setAt: "2026-10-06T09:00:00Z"
```

Every gate type is domain-qualified in CamelCase, both core gates such as `konfidence.cloud/HumanApproval` and third-party ones such as `example.com/E2ETests`. The prefix names the party that owns the gate type and keeps third-party gates from colliding with core ones, and each form is a legal Kubernetes condition type.

Several writers update conditions on the same `VectorPromotion.status`, so writes use optimistic concurrency. A writer reads the promotion, sets its condition, and patches `status` with the read `resourceVersion`, retrying on conflict. The approval path already works this way. Conditions are not seeded with `False`. A gate has no condition until its writer sets one, so an absent condition means not satisfied. Because each condition is written once, these writes are naturally staggered and conflicts stay rare.

**Pros:**

- No new CRD. Extends two existing specs with a `gates` field and reuses the conditions array and lifecycle.
- Smallest change to the implemented ADR-0032 design. `Cleared()` goes from one boolean to "every declared gate has a `True` condition".
- The whole gate state of a promotion is visible in one object.
- Approval is already a single-writer condition, so refactoring it into this model is simple.

**Cons:**

- Every gate writer shares one object, so condition writes contend on the same `status.conditions` under optimistic concurrency. Conflicts stay rare since conditions are written once and never seeded, but the shared object is still the point of contention.
- A gate's own history and diagnostics have to fit inside a single condition. The entity that set it has no place there, so provenance needs the parallel `gateProvenance` record described above.

### Option 2: A dedicated `PromotionGate` object per gate

Each declared gate becomes its own `PromotionGate` custom resource, owned by the `VectorPromotion`. A gate controller reconciles the objects of its `type` to a terminal `Satisfied` condition. The controller clears the promotion when all its child gates are satisfied.

The `VectorPromotion` controller creates the children on its first reconcile of a new promotion. It reads the snapshotted `spec.gates` and creates one `PromotionGate` per entry. Each child gets an owner reference back to the promotion, a name derived deterministically from `(promotion, gate type)` so creation is idempotent on requeue, and `spec.type` copied from the gate entry. Creation is agnostic to gate types. The controller creates a child for `example.com/E2ETests` exactly as for `konfidence.cloud/HumanApproval`, without knowing what either means, so a third party adds a gate by declaring its type and shipping a writer, never by changing the creator. Writers only reconcile the status of existing objects, but never create them. Owner references garbage-collect the children when the promotion is deleted or its TTL expires.

The `VectorPromotion` itself carries the gate snapshot and a small summary of the children, written only by the `VectorPromotion` controller. The per-gate detail, including provenance, lives on the child objects.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: dev-to-test-7
spec:
  vectorPromotionConfigName: dev-to-test
  source: { kind: Stage, name: dev-stage, landscape: dev }
  target: { kind: Stage, name: test-stage, landscape: test }
  vector: https://.../my-vector:2026.10.06-091200000Z
  # Immutable snapshot of the config's gates at creation time
  gates:
    - type: konfidence.cloud/ActivatedOnSourceStage
    - type: example.com/E2ETests
  sequence: 7
status:
  # derived: Waiting until every child PromotionGate is Satisfied
  state: Waiting
  # summary of the child gates, written only by the VectorPromotion controller
  gates:
    - type: konfidence.cloud/ActivatedOnSourceStage
      promotionGate: dev-to-test-7-activated-on-source-stage
      satisfied: true
    - type: example.com/E2ETests
      promotionGate: dev-to-test-7-e2e-tests
      satisfied: false
```

Each entry in `spec.gates` becomes one child `PromotionGate`, which its writer reconciles:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: PromotionGate
metadata:
  name: dev-to-test-7-activated-on-source-stage   # derived from (promotion, gate type)
spec:
  type: konfidence.cloud/ActivatedOnSourceStage
status:
  setBy: konfidence/activated-on-source-stage-controller   # entity; a user subject when approved or overridden
  setAt: "2026-10-06T09:00:00Z"
  conditions:
    - type: Satisfied
      status: "True"
      reason: ActivatedOnSource
```

Provenance, meaning by whom, when, and why, fits as native fields on each `PromotionGate.status` next to its `Satisfied` condition, shown as `setBy` and `setAt` above. A human approval or an override is the same object written by the API, with the user's identity as `setBy` and the justification as the reason. A writer reports an error by setting the `Satisfied` condition to `False` with a reason describing the problem, which the controller surfaces instead of leaving the promotion waiting indefinitely. No parallel structure is needed.

**Pros:**

- Each gate has a first-class lifecycle with its own status, events, and conditions, and room for rich diagnostics.
- No shared-status contention. Each `PromotionGate` is written by exactly one writer, so there is no concurrent read-modify-write of a single object's status and none of the optimistic-retry churn Option 1 needs.
- The promotion status stays small. It aggregates child gate results rather than carrying every writer.

**Cons:**

- A new CRD, and one child object per gate per promotion. That is more objects to watch and garbage-collect.
- Gate state spreads across several objects, so understanding a promotion means reading its children.
- Larger implementation and migration than Option 1 for the two gates needed now.

## Decision

::: warning Under review
This is a first draft of the decision proposal.
:::

Adopt **Option 1**, inline gate conditions on the `VectorPromotion`.

With one gate per type, each condition is keyed by its gate `type`, and the whole gate state of a promotion lives on one object. Option 1 adds no new CRD and extends the `VectorPromotion` already in code, so it is the smaller design and the easier one to read, since a reviewer sees every gate in a single place rather than following a set of child objects. Conditions are set once, never seeded, and staggered, so the shared `status.conditions` slice sees optimistic-concurrency conflicts rarely for the few gates a promotion carries. The one piece of provenance a condition cannot hold, the entity that set the gate, lives in a small parallel `gateProvenance` record.

Option 2 stays the escalation path. It becomes the better choice if gates grow rich per-gate state such as history, events, or retries, if a promotion routinely carries many gates, or once the future `spec` extension makes gates parameter-heavy.

## Consequences


## Discarded ideas

- **A cluster-scoped gate-type registry.** A registration resource, for example a `PromotionGateType` that each writer publishes for the type it handles, could list the available gate types. An admission webhook could then reject a `VectorPromotionConfig` that declares a gate whose type no writer handles, such as a misspelled `konfidence.cloud/ActivatedOnSourceStage`, rather than letting the promotion wait forever on a gate nobody will ever satisfy. This is discarded as too much machinery for too little benefit. It needs a new resource, an admission webhook, and a registration step for every gate writer, while the only failure it prevents already surfaces as a promotion stuck in `Waiting`, and validating a gate's configuration is already the gate controller's job.

## Open questions

- Should `gateProvenance` be a list per gate rather than a single record? The design assumes a gate is set satisfied once and stays satisfied, so one entry suffices. If a gate can return to unsatisfied after being satisfied, for example a suite that passed and then fails on a re-run, the questions are whether that transition is allowed at all and, if so, whether every transition should be kept as history rather than only the latest.
- Keeping a separate `gateProvenance` status next to the conditions is not elegant. Is there a cleaner way to record the entity that set a gate? One option is to stop using the standard `metav1.Condition` and define a custom condition type for `status.conditions`, for example one that embeds `metav1.Condition` and adds a `setBy` field, which would fold provenance back into the condition and remove the parallel record. The cost is that the gate conditions would no longer be standard `metav1.Condition` values, so they lose the apimachinery condition helpers and diverge from the convention that reusing standard conditions was meant to follow. That tradeoff is close to choosing Option 2, where provenance already lives as native fields on each gate.
- What happens to promotions that already exist when a `VectorPromotionConfig`'s gates change, for example when a new mandatory gate is introduced? As proposed, the gate list is snapshotted at creation, so an existing promotion keeps the gates it was created with and a newly added gate does not apply to it. There are three options. The first keeps the snapshot as proposed. The second is to **always use the latest gates**, which means a promotion reads its gate list live from the current `VectorPromotionConfig` on every reconcile rather than from its own snapshot. That fixes the skipped-gate case but breaks the self-contained promotion principle from [ADR-0032](./adr-0032-vector-promotions.md), under which execution reads only the promotion and never the config, so a later config edit or deletion would retroactively change or erase the gates on an in-flight promotion. The third is to additively sync only newly introduced gates onto promotions that are still in `Waiting`, without un-setting a gate that is already satisfied. This keeps already-decided state immutable while still applying a new mandatory gate to promotions that have not executed yet.
