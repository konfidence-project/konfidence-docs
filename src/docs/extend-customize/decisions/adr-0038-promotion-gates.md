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
2. **One uniform mechanism for core and custom gates.** Gates shipped by core (explicit approval, source-stage activation) and gates added by an extension use the identical contract. Core gates get no privileged evaluation path, and explicit approval must become an ordinary gate rather than a special case in the controller.
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
    - type: konfidence.cloud/ExplicitApproval
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
| `konfidence.cloud/ExplicitApproval` | Konfidence API (existing approval entry point) | A caller with approval rights approves the promotion. |
| `konfidence.cloud/ActivatedOnSourceStage` | A core-shipped gate controller | `Stage.status.activeStageVersion` on the source stage resolves to the promotion's snapshotted vector. |
| `example.com/E2ETests` | The contributor's own controller | Their test run reports success. |

The three rows share one mechanism. `konfidence.cloud/ExplicitApproval` and `konfidence.cloud/ActivatedOnSourceStage` are shipped by core only in the sense that their writers live in the Konfidence binary. They are declared and evaluated identically to any third-party gate.

**Every gate records its provenance in the status.** When a gate is set satisfied, the VectorPromotion status records three facts about it as explicit fields: when it was set, which entity set it, and a reason. This mirrors the current `status.approval`, which records `approvedAt` and `approvedBy`, and it works the same way for every gate. A `konfidence.cloud/ActivatedOnSourceStage` gate records its gate controller as the entity, with the reason that the stage is active. A `konfidence.cloud/ExplicitApproval` gate records the approving user. A third-party gate records its own controller. For a human action the entity comes from the authenticated session rather than the request body, exactly as the current approval path takes `identity.Subject`. A gate is set satisfied at most once.

Gate controllers set gate state through a provided Go library that writes a gate's state and provenance in one update, so the `state` and the `setBy`, `setAt`, and reason never drift apart. The convention is that controllers always use this library and human callers always go through the Konfidence API, which takes the acting identity from the authenticated session rather than a client-supplied value. The provenance is advisory and not a security boundary. Nothing currently enforces that `setBy` is truthful, so any actor with enough cluster access to patch the promotion status can write or overwrite it with an arbitrary value.

**Override is not a separate mechanism.** Forcing a gate open is just setting that gate satisfied by hand. The gate goes `Satisfied` like any other, with the person recorded as the entity and the reason noting the override. `cleared` stays "every declared gate is satisfied", and an operator clears a stuck gate, say `konfidence.cloud/ActivatedOnSourceStage` when the stage will never activate, through the same audited API that grants approval, which stamps their identity and justification. One code path covers every gate, which satisfies requirement 3.

**Immediate vs readiness-based promotion**, the goal of the epic, is then just the contents of `gates`. An empty list promotes immediately. A list containing `konfidence.cloud/ActivatedOnSourceStage` promotes only after the source stage has activated the vector.

The requirements rule out several designs up front. Fixed boolean fields per gate, a closed gate-type enum the controller evaluates, and a built-in-plus-custom hybrid all fail requirement 1 or 2, so none are considered here. What remains is a real choice about how a gate's state is stored on the promotion. Both options below satisfy every requirement.

### Option 1: Inline gate list, state and provenance on the `VectorPromotion`

Each declared gate maps one-to-one to an entry in a new `status.gates` list on the promotion, keyed by the gate's `type`, that holds the gate's `state` and its provenance together. This adds no new resource and sits alongside the promotion's existing lifecycle conditions (`Succeeded` and the rest), which stay in `status.conditions`.

The pattern follows [Kubernetes Pod readiness gates](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-readiness-gate): the promotion declares the gates it requires, an external writer (the gate's controller or the approval API) reports each gate's state, and the `VectorPromotion` controller stays read-only over them and only ANDs them into the `Waiting → Ready` decision, the way kubelet ANDs readiness-gate conditions into a Pod's `Ready` condition without writing them. Unlike readiness gates, the state is **not** a `metav1.Condition`. Each gate is one entry in `status.gates` whose `state` is `Pending`, `Satisfied`, or `Error`, so the gate's state and the provenance a condition cannot hold live together in one place. A gate is satisfied only when its entry is `Satisfied`, and `Pending` means still open. A writer reports an error by setting its entry to `Error` with a reason describing the problem, which the controller surfaces instead of leaving the promotion waiting indefinitely.

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
  # derived: Waiting until every gate entry is Satisfied
  state: Waiting
  # keyed by gate type; state and provenance live together in one entry
  gates:
    - type: konfidence.cloud/ActivatedOnSourceStage
      state: Satisfied
      reason: ActivatedOnSource
      setBy: konfidence/activated-on-source-stage-controller
      setAt: "2026-10-06T09:00:00Z"
    - type: example.com/E2ETests
      state: Pending   # seeded at creation; no writer has acted yet
```

Every gate type is domain-qualified in CamelCase, both core gates such as `konfidence.cloud/ExplicitApproval` and third-party ones such as `example.com/E2ETests`. The prefix names the party that owns the gate type and keeps third-party gates from colliding with core ones.

Several writers update entries on the same `VectorPromotion.status`, so writes use optimistic concurrency. A writer reads the promotion, flips its own entry, and patches `status` with the read `resourceVersion`, retrying on conflict. The approval path already works this way. Entries are seeded `Pending` for every declared gate when the promotion is created, and each writer sets its entry once, from `Pending` to `Satisfied` or `Error`. Because each entry is written once, these writes are naturally staggered and conflicts stay rare.

**Pros:**

- No new CRD. Adds a `gates` field to the config and promotion specs and a `gates` list to the promotion status.
- Smallest change to the implemented ADR-0032 design. `Cleared()` goes from one boolean to "every declared gate entry is `Satisfied`".
- The whole gate state of a promotion is visible in one object.
- Approval is already single-writer, so moving it into a gate entry is simple.

**Cons:**

- Every gate writer shares one object, so writes contend on the same `status.gates` under optimistic concurrency. Conflicts stay rare since each entry is written once, but the shared object is still the point of contention.
- Gate state is a custom `status.gates` struct rather than a standard `metav1.Condition`, so it gets none of the apimachinery condition helpers or condition-aware tooling, and it diverges from the Kubernetes readiness-gate convention.

### Option 2: A dedicated `PromotionGate` object per gate

Each declared gate becomes its own `PromotionGate` custom resource, owned by the `VectorPromotion`. A gate controller reconciles the objects of its `type` to a terminal `Satisfied` condition. The controller clears the promotion when all its child gates are satisfied.

The `VectorPromotion` controller creates the children on its first reconcile of a new promotion. It reads the snapshotted `spec.gates` and creates one `PromotionGate` per entry. Each child gets an owner reference back to the promotion, a name derived deterministically from `(promotion, gate type)` so creation is idempotent on requeue, and `spec.type` copied from the gate entry. Creation is agnostic to gate types. The controller creates a child for `example.com/E2ETests` exactly as for `konfidence.cloud/ExplicitApproval`, without knowing what either means, so a third party adds a gate by declaring its type and shipping a writer, never by changing the creator. Writers only reconcile the status of existing objects, but never create them. Owner references garbage-collect the children when the promotion is deleted or its TTL expires.

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

Provenance, meaning by whom, when, and why, fits as native fields on each `PromotionGate.status` next to its `Satisfied` condition, shown as `setBy` and `setAt` above. An explicit approval or an override is the same object written by the API, with the user's identity as `setBy` and the justification as the reason. A writer reports an error by setting the `Satisfied` condition to `False` with a reason describing the problem, which the controller surfaces instead of leaving the promotion waiting indefinitely. No parallel structure is needed.

**Pros:**

- Each gate has a first-class lifecycle with its own status, events, and conditions, and room for rich diagnostics.
- No shared-status contention. Each `PromotionGate` is written by exactly one writer, so there is no concurrent read-modify-write of a single object's status and none of the optimistic-retry churn Option 1 needs.
- The promotion status stays small. It aggregates child gate results rather than carrying every writer.

**Cons:**

- A new CRD, and one child object per gate per promotion. That is more objects to watch and garbage-collect.
- Gate state spreads across several objects, so understanding a promotion means reading its children.
- Larger implementation and migration than Option 1 for the two gates needed now.

## Decision

Adopt **Option 1**, inline gate state and provenance on the `VectorPromotion`.

With one gate per type, each gate is one entry in `status.gates` keyed by its `type`, carrying the gate's `state` (`Satisfied`, `Pending`, or `Error`) and its provenance together, and the whole gate state of a promotion lives on one object. Option 1 adds no new CRD and extends the `VectorPromotion` already in code, so it is the smaller design and the easier one to read, since a reviewer sees every gate in a single place rather than following a set of child objects. Each entry is seeded once and written once, so the shared `status.gates` slice sees optimistic-concurrency conflicts rarely for the few gates a promotion carries. Deliberately unlike Kubernetes readiness gates, the gate state is not a `metav1.Condition`, which is what lets each entry hold its provenance directly rather than in a parallel record.

Option 2 stays documented as an alternative, but it is not chosen, because it buys a first-class gate lifecycle at the cost of a new CRD and a child object per gate, and that complexity is not warranted. Even if gates grow richer state such as history, events, or retries, a promotion carries many gates, or the future `spec` extension makes gates parameter-heavy, the gate state remains an inherent part of the promotion object rather than state shared across promotions. Splitting it into child objects is a normalization we do not do in Kubernetes.

## Consequences


## Discarded ideas

- **A cluster-scoped gate-type registry.** A registration resource, for example a `PromotionGateType` that each writer publishes for the type it handles, could list the available gate types. An admission webhook could then reject a `VectorPromotionConfig` that declares a gate whose type no writer handles, such as a misspelled `konfidence.cloud/ActivatedOnSourceStage`, rather than letting the promotion wait forever on a gate nobody will ever satisfy. This is discarded as too much machinery for too little benefit. It needs a new resource, an admission webhook, and a registration step for every gate writer, while the only failure it prevents already surfaces as a promotion stuck in `Waiting`, and validating a gate's configuration is already the gate controller's job.
- **Per-gate state-change history.** A gate entry could retain every state change it went through rather than only the latest. This is discarded. A gate's `state` may change while the promotion is still `Waiting` — for example a check that passed and then fails on a re-run moves its entry out of `Satisfied` — but the entry keeps only the latest change (`state`, `reason`, `setBy`, `setAt`), not the sequence that led to it. A full per-gate audit trail is more storage and complexity than the promotion needs.
- **Re-applying config gate changes to existing promotions.** When a `VectorPromotionConfig`'s gates change, the new gates could be pushed onto promotions that already exist, either by having a promotion read its gate list live from the current config on every reconcile (always use the latest gates) or by additively syncing only newly introduced gates onto promotions still in `Waiting`. Both are discarded in favour of the snapshot. The gate list is captured at creation and never changes, so a promotion keeps the gates it was created with and a later config edit does not apply to it. This keeps the `VectorPromotion` self-contained, so execution reads only the promotion and never the config (per [ADR-0032](./adr-0032-vector-promotions.md)). The accepted cost is that a newly mandated gate does not retroactively apply to promotions that already exist.
