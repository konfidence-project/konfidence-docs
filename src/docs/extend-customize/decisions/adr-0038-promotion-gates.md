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

1. **Extensible by outside contributors without core changes.** A third party must be able to add a new gate condition, for example "end-to-end tests passed", by shipping their own controller. That means no change to the Konfidence promotion controller, no entry in a closed gate-type list, and no core redeploy.
2. **One uniform mechanism for core and custom gates.** Gates shipped by core (manual approval, source-stage activation) and gates added by an extension use the identical contract. Core gates get no privileged evaluation path, and manual approval must become an ordinary gate rather than a special case in the controller.
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
    - type: SourceStageActivated
    - type: ManualApproval
    - type: example.com/e2e-tests   # a third-party gate, declared the same way
```

Each gate is identified by its `type`, and the gate list is a map keyed by `type` (`listType=map`), so a config declares at most one gate of each type and the `type` alone identifies a gate within a promotion. The promotion controller never interprets the `type`; it only tracks whether that gate is satisfied, which keeps the core agnostic to gate types (requirement 2). Core cannot know what a third-party gate requires, so validating a gate's configuration is the gate controller's job. It should detect a misconfiguration and report it rather than leave the promotion waiting on a gate that can never pass, such as a `SourceStageActivated` gate on a `VectorPromotionConfig` whose source is a `VectorTemplate`, which has no source stage. How a controller reports such a problem is covered in the [open questions](#open-questions).

A gate takes no parameters in this design. If a gate later needs extra information, the gate entry could gain an optional `spec` that only its writer interprets. That is a future extension, not part of this design.

The gate list is snapshotted immutably into each `VectorPromotion` at creation, exactly as the vector and the source and target references already are. Approving or clearing a promotion therefore always refers to the gates that were in force when it was created, immune to later config edits.

**The controller is agnostic to gate types.** The promotion controller never knows what a gate *means*. It only knows whether each declared gate is satisfied. This generalises today's single predicate:

- Today: `cleared = isApproved || !requireApproval`.
- Proposed: `cleared = every declared gate is satisfied`.

A promotion stays `Waiting` until all its gates are satisfied, then derives `Ready` and proceeds through the unchanged serialization, superseding, and execution flow.

**Gate state is written by external parties, never computed by the promotion controller.** This is the heart of requirement 2. It mirrors how approval already works, where the API grants it rather than the controller, and how `VectorData.Ready` already works, where a runtime-specific controller writes a condition the core waits on. For each declared gate type there is a *writer*, a controller or an API endpoint, that observes the real-world condition and reports the gate satisfied:

| Gate `type` | Writer | Satisfied when |
| --- | --- | --- |
| `ManualApproval` | Konfidence API (existing approval entry point) | A caller with approval rights approves the promotion. |
| `SourceStageActivated` | A core-shipped gate controller | `Stage.status.activeStageVersion` on the source stage resolves to the promotion's snapshotted vector. |
| `example.com/e2e-tests` | The contributor's own controller | Their test run reports success. |

The three rows share one mechanism. `ManualApproval` and `SourceStageActivated` are shipped by core only in the sense that their writers live in the Konfidence binary. They are declared and evaluated identically to any third-party gate.

**Every gate records its provenance.** When a gate is set satisfied, three facts are recorded alongside it as explicit fields: when it was set, which entity set it, and a reason. This matches the current `status.approval`, which records `approvedAt` and `approvedBy`. The recording is uniform. The `SourceStageActivated` gate records the gate controller as the entity, with the reason that the stage is active. A `ManualApproval` gate records the approving user. A third-party gate records its own controller. For a manual action the entity comes from the authenticated session, not the request body, exactly as the current approval path takes `identity.Subject`. A gate is set satisfied at most once.

**Override is not a separate mechanism.** Forcing a gate open is just setting that gate satisfied by hand. The gate goes `True` like any other, with the person recorded as the entity and the reason noting the override. `cleared` stays "every declared gate is satisfied", and an operator clears a stuck gate, say `SourceStageActivated` when the stage will never activate, through the same audited API that grants approval, which stamps their identity and justification. One code path covers every gate, which satisfies requirement 3.

**Immediate vs readiness-based promotion**, the goal of the epic, is then just the contents of `gates`. An empty list promotes immediately. A list containing `SourceStageActivated` promotes only after the source stage has activated the vector.

The requirements rule out several designs up front. Fixed boolean fields per gate, a closed gate-type enum the controller evaluates, and a built-in-plus-custom hybrid all fail requirement 1 or 2, so none are considered here. What remains is a real choice about how a gate's state is stored on the promotion. Both options below satisfy every requirement.

### Option 1: Inline gate list, state as conditions on the `VectorPromotion`

Each declared gate maps one-to-one to a `metav1.Condition` in the promotion's `status.conditions`, keyed by the gate's `type`. This adds no new resource and reuses the status array that already carries the `Approved` and `Succeeded` conditions.

This mirrors [Kubernetes Pod readiness gates](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-readiness-gate). The promotion declares the gate conditions it requires. An external writer, either the gate's controller or the approval API, sets each condition in the status. The `VectorPromotion` controller stays read-only over them and only ANDs them into the `Waiting → Ready` decision, the way kubelet ANDs readiness-gate conditions into a Pod's `Ready` condition without writing them. A gate is satisfied only when its condition is `True`. Absent or `False` means still open. A condition cannot record which entity set the gate, so that fact goes in a small parallel per-gate record in the status, together with the timestamp and reason.

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
    - type: SourceStageActivated
    - type: example.com/e2e-tests
  sequence: 7
status:
  # derived: Waiting until every declared gate has a True condition
  state: Waiting
  conditions:
    # keyed by gate type; example.com/e2e-tests has no condition yet, so it is still open
    - type: SourceStageActivated
      status: "True"
      reason: ActivatedOnSource
  # provenance the condition cannot hold: entity + explicit timestamp (+ reason)
  gateProvenance:
    - gate: SourceStageActivated
      setBy: konfidence/source-stage-activated-controller
      setAt: "2026-10-06T09:00:00Z"
```

Third-party gate types use a domain-qualified form such as `example.com/e2e-tests`, a legal Kubernetes condition type that avoids colliding with core gate names.

Several writers update conditions on the same `VectorPromotion.status`, so writes use optimistic concurrency. A writer reads the promotion, sets its condition, and patches `status` with the read `resourceVersion`, retrying on conflict. The approval path already works this way. Conditions are not seeded with `False`. A gate has no condition until its writer sets it `True`, so an absent condition means not satisfied. Because each condition is written once, these writes are naturally staggered and conflicts stay rare.

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

The `VectorPromotion` controller creates the children on its first reconcile of a new promotion. It reads the snapshotted `spec.gates` and creates one `PromotionGate` per entry. Each child gets an owner reference back to the promotion, a name derived deterministically from `(promotion, gate type)` so creation is idempotent on requeue, and `spec.type` copied from the gate entry. Creation is agnostic to gate types. The controller creates a child for `example.com/e2e-tests` exactly as for `ManualApproval`, without knowing what either means, so a third party adds a gate by declaring its type and shipping a writer, never by changing the creator. Writers only reconcile the status of existing objects, but never create them. Owner references garbage-collect the children when the promotion is deleted or its TTL expires.

The `VectorPromotion` itself carries the gate snapshot and a small summary of the children, written only by the promotion controller. The per-gate detail, including provenance, lives on the child objects.

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
    - type: SourceStageActivated
    - type: example.com/e2e-tests
  sequence: 7
status:
  # derived: Waiting until every child PromotionGate is Satisfied
  state: Waiting
  # summary of the child gates, written only by the promotion controller
  gates:
    - type: SourceStageActivated
      promotionGate: dev-to-test-7-source-stage-activated
      satisfied: true
    - type: example.com/e2e-tests
      promotionGate: dev-to-test-7-e2e-tests
      satisfied: false
```

Each entry in `spec.gates` becomes one child `PromotionGate`, which its writer reconciles:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: PromotionGate
metadata:
  name: dev-to-test-7-source-stage-activated   # derived from (promotion, gate type)
spec:
  type: SourceStageActivated
status:
  setBy: konfidence/source-stage-activated-controller   # entity; a user subject when approved or overridden
  setAt: "2026-10-06T09:00:00Z"
  conditions:
    - type: Satisfied
      status: "True"
      reason: ActivatedOnSource
```

Provenance, meaning by whom, when, and why, fits as native fields on each `PromotionGate.status` next to its `Satisfied` condition, shown as `setBy` and `setAt` above. A manual approval or an override is the same object written by the API, with the user's identity as `setBy` and the justification as the reason. No parallel structure is needed.

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


## Open questions

- Should a cluster-scoped registration resource, for example a `PromotionGateType` that each writer publishes for the type it handles, list the available gate types? An admission webhook could then reject a `VectorPromotionConfig` that declares a gate whose type no writer handles, such as a misspelled `SourceStageActivated`, instead of letting the promotion wait forever on a gate nobody will ever satisfy. The cost is a registration step for every gate writer.
- How should a gate writer report an error, as opposed to "not yet satisfied"? A failing test run or an unsatisfiable gate currently looks the same as a gate that is still working, so the promotion waits with no signal. One quick idea: let the writer set its gate condition to `False` with a reason that marks the error terminal (for example `reason: Failed`), which the controller surfaces as a `Blocked` or `Failed` promotion state rather than continuing to wait. This introduces a third gate outcome beyond satisfied and open, which the current contract does not define.
- Should `gateProvenance` be a list per gate rather than a single record? The design assumes a gate is set satisfied once and stays satisfied, so one entry suffices. If a gate can return to unsatisfied after being satisfied, for example a suite that passed and then fails on a re-run, the questions are whether that transition is allowed at all and, if so, whether every transition should be kept as history rather than only the latest.
