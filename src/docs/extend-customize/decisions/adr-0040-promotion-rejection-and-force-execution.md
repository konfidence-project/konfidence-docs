---
id: ADR-0040
title: "Promotion rejection and force execution"
description: "How an operator terminally rejects a waiting VectorPromotion or forces it past unsatisfied gates."
status: proposed
date_proposed: 2026-10-23
authors: [JNKielmann]
category: Architecture Pattern
impact: Medium
dependencies: [ADR-0039, ADR-0032]
pageClass: adr
outline: deep
---
# ADR-0040: Promotion rejection and force execution

<AdrHeader />

## Context

[ADR-0032](./adr-0032-vector-promotions.md) established the `VectorPromotion` lifecycle. A config controller snapshots a concrete vector and the source and target references into a self-contained `VectorPromotion`, which then runs through a condition-derived lifecycle: `Waiting → Ready → InProgress → Succeeded`, with `Blocked`, `Failed`, and `Superseded` branches. [ADR-0039](./adr-0039-promotion-gates.md) replaced the single approval check with gates: a promotion stays `Waiting` until every declared gate in `status.gates` is `Satisfied`, then derives `Ready` and proceeds. Each gate entry carries its own `state` (`Pending`, `Satisfied`, or `Error`) and its provenance (`setBy`, `setAt`, `reason`).

Epic [#355](https://github.com/konfidence-project/konfidence/issues/355) raises two operator actions the gate model does not yet cover:

1. **Reject a promotion.** A promotion still waiting on its gates must be stoppable outright, independent of any gate outcome, when the vector it carries is known to be bad. For example, a vector that contains a known data-corruption bug must never roll out, even if every gate would eventually pass.
2. **Force a promotion.** A promotion must be executable even though not all of its gates are satisfied, when waiting is not an option. For example, an emergency hotfix cannot wait on a flaky end-to-end test gate, and the operator accepts the risk.

### Requirements

Any solution must satisfy all of the following:

1. **Rejection is terminal and deliberate.** A rejected promotion reaches a terminal state it cannot leave, distinct from a failed or blocked one, so that a human veto is never mistaken for a transient error and cannot be silently undone by a gate writer.
2. **Both are audited.** Each action records who performed it, when, and why, taken from the authenticated session rather than a client-supplied value, exactly as approval already is.
3. **One coherent mechanism.** Rejection and force are two sides of the same operator control and should share a single, consistent representation rather than each being bolted on differently.

Both actions are performed through the audited Konfidence API, whose own authorization model is the enforcement boundary for who may reject or force, as it already is for who may approve.

## Considered options

### Option 1: Force gate states directly

Reuse the gate entries as the only place both actions are recorded. The audited API drives both actions by writing gate state:

- **Force execution:** introduce a new `Bypassed` gate state and set every unsatisfied gate entry to it, with the acting identity as `setBy` and the justification as `reason`. The promotion proceeds to `Ready` once every gate entry is either `Satisfied` or `Bypassed`, with no further change to how the controller evaluates gates.
- **Rejection:** introduce a new terminal `Rejected` gate state, added to ADR-0039's `Pending`, `Satisfied`, and `Error`, and set every gate entry to it, with the operator recorded and the reason noting the rejection. The promotion derives a terminal rejected state from its gates and stops advancing.

```yaml
status:
  state: InProgress
  gates:
    - type: example.com/E2ETests
      state: Bypassed           # forced open by an operator; real outcome lost
      reason: ForcedByOperator
      setBy: alice
      setAt: "2026-10-23T10:00:00Z"
```

**Pros:**

- No new top-level status fields. Both actions are recorded on the existing `status.gates` entries, which already carry provenance, so the gate list stays the single place to read a promotion's gate state.

**Cons:**

- Both new gate states, `Rejected` and `Bypassed`, are written by the API onto gates owned by other controllers. Every gate writer, including third-party ones, must be taught to treat them as terminal and stop reconciling its gate once either is set. ADR-0039 gave writers one rule, to report their own condition, and this adds a second that all of them must implement. A writer that does not, such as an older or non-compliant controller, overwrites the entry on its next reconcile and silently un-rejects or un-forces the promotion, which violates requirement 1.
- Forcing discards the gate's real outcome: replacing a `Pending` or `Error` entry with `Bypassed` loses what the writer last reported.
- Finding which promotions were forced or rejected means scanning every gate entry rather than reading one field.

### Option 2: Dedicated status fields

Record rejection and force as two dedicated fields on the promotion status, each written only by the audited API, and leave gate entries untouched. Each field is a small provenance struct carrying who, when, and why. It is the same triplet ADR-0039 puts on a gate entry and ADR-0032 puts on `status.approval`, deliberately a plain struct rather than a `metav1.Condition` so the fact and its provenance live together.

```yaml
# A rejected promotion
status:
  state: Rejected               # new terminal state
  rejection:
    rejectedBy: alice
    rejectedAt: "2026-10-23T10:00:00Z"
    reason: "Vector carries known data-corruption bug; must not roll out"
```

```yaml
# A forced promotion: gate state is left exactly as the writers reported it
status:
  state: InProgress
  forcedExecution:
    forcedBy: alice
    forcedAt: "2026-10-23T10:00:00Z"
    reason: "Emergency hotfix; e2e suite flaky, risk accepted"
  gates:
    - type: example.com/E2ETests
      state: Pending            # untouched, still shows the real outcome
```

The derived-state logic gains two clauses on top of ADR-0039's evaluation:

- If `status.rejection` is set, the promotion is `Rejected`, a new terminal state that takes precedence over gate evaluation. It is set at most once, only while the promotion is `Waiting`, and never cleared.
- A promotion is treated as ready to proceed when every gate entry is `Satisfied`, **or** when `status.forcedExecution` is set. A forced promotion derives `Ready` regardless of its gates and then proceeds through the unchanged serialization and execution flow.

`Rejected` is terminal like `Succeeded` and `Failed`, so a rejected promotion is retained and cleaned up by the existing `ttlAfterFinished` and `keepLastPromotions` bounds from ADR-0032.

**Pros:**

- Rejection is a first-class terminal state, deliberate and auditable, that a gate writer cannot touch. This satisfies requirement 1.
- Gate entries keep their real meaning. A forced promotion still shows its end-to-end gate as `Pending` or `Error`, and the fact that it was forced lives in one place next to it.
- Auditing is a single-field lookup: list promotions where `status.rejection` or `status.forcedExecution` is set. The force decision is one record for the whole promotion.
- Rejection and force share one representation, two sibling provenance structs set through the same audited API, which satisfies requirement 3.

**Cons:**

- Adds two status fields and two branches to the state-derivation logic, including a new `Rejected` terminal state that the UI, cleanup, and any status-consuming tooling must learn. Option 1 adds none.
- Whether a promotion executes now depends on two inputs, the gates and the force field, rather than on the single gate predicate.

### Option 3: A single operator-decision field

Option 2 with its two fields collapsed into one. Both actions are "an operator overrode the normal flow, here is who, when, and why", differing only in the outcome, so record them in a single `status.override` struct whose `type` names the action. Gate entries are still left untouched.

```yaml
# A rejected promotion
status:
  state: Rejected               # new terminal state
  override:
    type: Reject                # Reject | BypassGates
    setBy: alice
    setAt: "2026-10-23T10:00:00Z"
    reason: "Vector carries known data-corruption bug; must not roll out"
```

```yaml
# A forced promotion: gate state is left exactly as the writers reported it
status:
  state: InProgress
  override:
    type: BypassGates           # Reject | BypassGates
    setBy: alice
    setAt: "2026-10-23T10:00:00Z"
    reason: "Emergency hotfix; e2e suite flaky, risk accepted"
  gates:
    - type: example.com/E2ETests
      state: Pending            # untouched, still shows the real outcome
```

The derived-state logic gains the same two clauses as Option 2, keyed off `override.type`: `Reject` makes the promotion terminally `Rejected`, and `BypassGates` lets it proceed to `Ready` regardless of its gates. Because a promotion carries exactly one `override`, it is either rejected or forced and never both. Mutual exclusion holds by construction rather than by a validation rule.

**Pros:**

- Every advantage of Option 2: a terminal `Rejected` state no gate writer can touch, gate entries that keep their real meaning, and single-field auditing.
- The strongest form of requirement 3: one field, one provenance shape, one place to look, and reject-or-force mutually exclusive by construction instead of by a validation rule.

**Cons:**

- Like Option 2, execution depends on two inputs, the gates and the `override` field.
- Less self-documenting than Option 2: a reader consults `override.type` to tell reject from force rather than seeing two differently named fields.

## Decision

Adopt **Option 3**, a single `status.override` field carrying the operator decision and its provenance.

Option 1 is rejected. Writing the new `Rejected` and `Bypassed` states onto gates that other controllers own forces every gate writer to treat them as terminal and stop reconciling, or it silently undoes the decision. ADR-0039 deliberately keeps writers free of that. Options 2 and 3 instead keep the decision on the promotion status, where only the core controller and the API write it, so no gate writer changes.

Option 3 is chosen over Option 2 because one `override` field with a `type` makes reject and force mutually exclusive by construction and keeps auditing to a single field. The cost is that a reader checks `override.type` rather than reading two differently named fields.

## Consequences

- The derived lifecycle gains a terminal `Rejected` state alongside `Succeeded` and `Failed`. The dashboard, the decision log, and any tooling that maps promotion state must handle it, and rejected promotions are retained and reaped by the existing `ttlAfterFinished` and `keepLastPromotions` bounds.
- Gate evaluation from ADR-0039 is extended so that an `override` of `type: BypassGates` lets a promotion proceed as if all its gates were satisfied. Gate entries are never written by the reject or force path, so after a forced run the gates still show what their writers reported.
- The audited Konfidence API gains two entry points, reject and force, alongside the existing approval entry point. All three take the acting identity from the authenticated session and record a justification; the API's authorization model remains the enforcement boundary for who may perform each.
