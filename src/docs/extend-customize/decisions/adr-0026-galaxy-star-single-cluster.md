---
id: ADR-0026
title: "Merge galaxy and star into a single cluster"
description: "Run galaxy and star in one cluster by default under a single API group, drop KCP, multi-cluster runtime, and the sync controller"
status: accepted
date_approved: 2026-07-01
authors: [nirnanaaa]
category: Architecture Pattern
impact: High
dependencies: [ADR-0007, ADR-0020, ADR-0022, ADR-0023]
pageClass: adr
outline: deep
---
# ADR-0026: Merge galaxy and star into a single cluster

<AdrHeader />

## Context

Konfidence currently splits its control planes across two layers: the **galaxy**
(global control plane, GCP) for process-level concerns and the **star** (local
control plane, LCP) for runtime-level concerns (terminology per
[ADR-0022](./adr-0022-star-galaxy-terminology.md)). ADR-0020 decided to build the
galaxy on [KCP](https://www.kcp.io/) with workspace-based multi-tenancy, served
to stars through `APIExport`/`APIBinding`, with multi-cluster-aware controllers
(ADR-0017) and a sync agent
(ADR-0018, ADR-0010)
that replicates resources from galaxy workspaces into star namespaces. Stars
receive process configuration as `StageSync` resources that are synced down and
materialized as `Stage` objects.

This buys strong tenant and landscape isolation, but at a steep cost: two control
planes plus KCP, multi-cluster controllers, cross-cluster secret and resource
sync, per-workspace CRD lifecycles, and three layers of auth/RBAC (galaxy, KCP,
star). ADR-0020 itself acknowledged this and named a single-cluster install
*without* KCP as the long-term goal for users who do not need tenancy or
isolation — but kept the KCP, multi-cluster, multi-tenant stack as the default.

From a product standpoint, the gap between "what Konfidence is" and "what you
must stand up to try it" is now the dominant adoption and explainability problem.
The exploratory quickstart for the current architecture runs ~18 steps (create
kind cluster → install KCP → bootstrap root workspace → generate root kubeconfig
→ create provider/org/LCP workspaces → apply `APIResourceSchema`s →
`APIExport`/`APIExportEndpointSlice` → `APIBinding` → install galaxy chart with
multicluster-runtime → install star chart with a galaxy-sync kubeconfig secret →
set `LANDSCAPE_NAME` → pre-create namespaces → RBAC → apply a `StageSync` in the
galaxy workspace → wait for propagation → apply sample resources → port-forward
UI). Getting started must take a handful of steps, and we need
the conceptual model to be explainable in one diagram.

This ADR records the decision to run galaxy and star in a single cluster under a
single API group, and to drop the two-cluster federation stack that ADR-0020
introduced.

## Considered Solutions

### Option 1: Status quo — two control planes plus KCP (per ADR-0020)

Galaxy on KCP with multi-tenant workspaces, multi-cluster controllers, and a sync
agent replicating into star clusters.

**Pros:**
- Strong tenant and landscape isolation; physical separation of galaxy and star.
- Central, multi-tenant global management of many landscapes from one place.
- Already the agreed design; no rework.

**Cons:**
- High operational and conceptual complexity: KCP, workspaces, `APIExport`/
  `APIBinding`, multi-cluster runtime, sync agent, cross-cluster secret sync.
- Two clusters + KCP to install, secure, monitor, and upgrade; three auth layers.
- Long, fragile quickstart — a serious barrier to open-source adoption and to
  explaining the product.

### Option 2: Single cluster, collapse the galaxy/star distinction entirely

Run one cluster and merge the two API groups into a single flat model — drop the
galaxy/star separation in code and docs as well.

**Pros:**
- Maximum simplicity in installation and surface area.

**Cons:**
- Loses the clean logical separation between process-level (galaxy) and
  runtime-level (star) concerns, which is genuinely useful for reasoning,
  authorization boundaries, and future re-splitting.
- Larger, riskier refactor with no path back to a federated model if we ever need
  one again.
- Conflicts with the established space-themed terminology and conceptual framing
  from ADR-0022.

### Option 3: Single cluster, keep both API groups, drop the federation stack (considered, not selected)

Run galaxy and star controllers in **one** cluster by default. Keep the two API
groups and the logical galaxy = process / star = runtime separation, but remove
the machinery that only existed to bridge two clusters: KCP, multi-cluster
runtime, multi-tenancy in the galaxy controllers, the sync controller, and
`StageSync`. The stage-configuration controller writes `Stage` objects directly.
Ship as a single binary and a single Helm chart whose values can disable the
galaxy components.

**Pros:**
- One cluster, one binary, one Helm chart, one CRD lifecycle — the quickstart
  collapses to ~5 steps.
- Removes KCP, multi-cluster runtime, the sync controller, cross-cluster secret
  sync, and two of three auth layers.
- Preserves the galaxy/star conceptual model and terminology, leaving room to
  re-introduce a federated/multi-tenant galaxy later if a concrete need appears.
- Caching, build, and release all simplify around a single artifact.

**Cons:**
- Drops native multi-tenant, multi-landscape *global* management from one place
  (the original galaxy value proposition); see Open Questions on project-level
  tenancy on the star.
- Reverses the core of ADR-0020 and discards work behind ADR-0017/0018.
- Operators who want central global management lose a built-in tool for it.
- Keeping two API groups once galaxy and star always co-locate buys no
  isolation — galaxy no longer functions without star, and the
  stage-configuration controller already spans both groups.

### Option 4: Single cluster, single API group, drop the federation stack (selected)

Everything in Option 3, plus collapse the two API groups into one. All
Konfidence CRDs — galaxy-originated (e.g. `VectorAssembly`, `VectorTemplate`)
and star-originated (e.g. `Stage`, activation, task resources) — live under a
single API group and version. The galaxy = process / star = runtime distinction
(ADR-0022) stays as conceptual and code-organization language, not as a schema
boundary.

**Pros:**
- Everything from Option 3: one cluster, one binary, one Helm chart, one CRD
  lifecycle, no KCP/multi-cluster runtime/sync controller.
- One API group means one apiVersion, one client, one set of RBAC verbs, and no
  conversion or versioning surface for a cross-group split that no longer
  provides isolation.
- Removes the last structural remnant of the two-control-plane design, matching
  what the deployment topology already is: a single cluster.

**Cons:**
- Loses the API-level separation between process-level and runtime-level
  resources; authorizing or versioning galaxy-only vs. star-only resources
  independently now requires a convention (e.g. by Kind or label) instead of a
  group boundary.
- A future re-split into a federated galaxy needs to reintroduce a second API
  group, not just the removed cluster-federation machinery.

## Decision

Approved. Galaxy and star run in a single cluster under a single API group by
default; the two-cluster federation stack is removed.

### Design Decisions

1. **Single-cluster, single-tenant deployment.** Galaxy and star controllers run
   in one cluster. Galaxy resources (e.g. `VectorAssembly`, `VectorTemplate`) live
   in that cluster; whether they are cluster-scoped is to be settled during
   implementation.
2. **Stage configuration writes `Stage` directly.** The stage-configuration
   controller materializes `Stage` objects in the cluster instead of emitting
   `StageSync` for replication.
3. **Delete the sync controller and `StageSync`.** No cross-cluster resource sync,
   no cross-cluster secret sync, no inter-cluster stage lifecycle.
4. **Drop KCP and multi-cluster runtime.** The galaxy controllers
   (vector-assembly, vector-promotion, stage-configuration) are kept but lose
   multi-tenancy, KCP, and `APIExport`/`APIBinding` awareness.
5. **Star controllers unchanged.** Stage, activation, and task controllers keep
   their current behavior.
6. **Single API group.** Galaxy and star CRDs live under one API group and
   version. The galaxy = process level / star = runtime level distinction
   (ADR-0022) remains conceptual and code-organization language only; it is not
   expressed as a schema boundary.
7. **Galaxy OCM credentials retained.** The galaxy CRDs that carry OCI credentials
   were designed for a multi-tenant use case but remain valid in single-tenant.
8. **Single binary, single Helm chart.** `cmd/galaxy` and `cmd/star` merge into
   one binary. The merged binary gets a dedicated `--enable-galaxy` bool flag
   (default `true`) that is the explicit, self-documenting on/off switch for
   the galaxy controller set — not an incidental side effect of the existing
   `--controllers` glob filter (`pkg/cmd/controllers.go`), which stays for
   fine-grained per-controller selection within whichever set is enabled.
   `--enable-galaxy=false` runs star-only with no separate build or image. One
   Helm chart wraps this binary; a `galaxy.enabled` value sets
   `--enable-galaxy` and gates the galaxy CRDs, aligned with the monorepo
   structure of [ADR-0023](./adr-0023-repo-structure.md).
9. **UI.** Adds a runtime view (deployment state) and promotion support, plus a
   flag/Helm toggle to disable galaxy-specific views when galaxy is not installed.
10. **CLI.** Connects to a single star cluster; no KCP workspace selection.
11. **Central management.** Operators deploy a star and may build their own galaxy; Konfidence ships no central global management tool.

## Consequences

### Positive Consequences

- One cluster instead of two plus KCP.
- One binary (`cmd/galaxy` + `cmd/star` merged), with a dedicated
  `--enable-galaxy` flag to flag off the galaxy controller set — better
  caching, simpler ops and onboarding.
- One Helm chart, configurable to exclude galaxy (controllers and CRDs).
- One CRD lifecycle instead of per-workspace lifecycles.
- No KCP, no multi-cluster runtime, no sync controller, no `StageSync`, no
  cross-cluster secret sync — the stage lifecycle gets materially simpler.
- Fewer auth/RBAC surfaces (was galaxy + KCP + star).
- One API group: one apiVersion, one client, one RBAC verb set, no cross-group
  conversion or versioning surface.
- The quickstart collapses to roughly: have a cluster → `helm install`
  → label a namespace as a landscape → apply domain resources → port-forward UI.

### Negative Consequences

- Loses native multi-tenant, multi-landscape global management from a single
  control plane — the original galaxy value proposition.
- Deployments lose a built-in central tool for global lifecycle management.
- Reverses ADR-0020's KCP decision and discards the multi-cluster-controller and
  sync-agent work (ADR-0017, ADR-0018).
- A re-split into a federated galaxy later would require re-introducing both the
  removed cluster-federation machinery and a second API group.
- Loses the API-level separation between process-level and runtime-level
  resources; authorizing or versioning them independently now needs a
  convention (e.g. by Kind or label) instead of a group boundary.

### Neutral Consequences

- The galaxy/star conceptual model and terminology (ADR-0022) are unchanged as
  naming and code-organization language; only the deployment topology and API
  surface change.
- Controllers stop being multi-tenant but keep their domain responsibilities.

## Open Questions

1. **Project tenancy on the star.** Do we need a new project controller, and is
   project multi-tenancy on the star required — or only an authorization mechanism?
2. **Konfidence API server.** Do UI and CLI need a dedicated aggregation service
   (authorization, history/persistence), or do they talk to the cluster API
   directly?
3. **History / persistence.** Where does historical deployment/promotion data live
   without the galaxy as a central store?
4. **Central management.** How do we serve users who need central global management (docs, a build-your-own-galaxy path)?
5. **UI galaxy toggle.** Confirm the mechanism — a Helm release value that disables
   the galaxy components and the corresponding UI views.

## Related ADRs

- **Supersedes**: ADR-0020 — reverses the decision to
  build the galaxy on KCP with multi-tenant workspaces; makes single-cluster-without-KCP
  the default rather than a future option.
- **Supersedes**: the KCP/replication stack —
  ADR-0017 (multi-cluster controllers),
  ADR-0018 (sync agent),
  ADR-0010 (replication
  mechanism), and ADR-0016 (KCP workspace
  / LCP registration) — all removed by this decision.
- **Related to**: [ADR-0007](./adr-0007-multi-landscape-support.md) (multi-landscape
  star), [ADR-0022](./adr-0022-star-galaxy-terminology.md) (terminology — retained as
  naming convention, not an API boundary), and [ADR-0023](./adr-0023-repo-structure.md)
  (monorepo / single chart).
