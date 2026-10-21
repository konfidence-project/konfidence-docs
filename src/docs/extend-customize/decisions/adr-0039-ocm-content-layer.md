---
id: ADR-0039
title: "OCM Content Layer: Performant access to OCM resources"
description: "Establish a caching and content-access strategy so that controllers, API consumers, and interactive workflows are no longer bottlenecked by redundant remote registry calls."
status: proposed
date_proposed: 2026-10-20
authors: [Aleksandar Muradyan, Stefan Shivarov]
category: Architecture Pattern
impact: High
dependencies: [ADR-0006, ADR-0019, ADR-0032]
pageClass: adr
outline: deep
---

# ADR-0039: OCM Content Layer - Performant access to OCM resources

<AdrHeader />

## Context

Every time the UI looks up which artifacts and versions are deployed on a stage, or a user opens a promotion for approval, Konfidence makes a live call to the OCI registry to fetch the vector descriptor and artifact manifests. There is no local storage or caching strategy. A remote registry call is a synchronous network round-trip - typically tens to hundreds of milliseconds under normal conditions, potentially seconds under load or degraded connectivity, and a hard failure when the registry is unavailable. This makes every UI page load that involves vector or artifact data directly dependent on registry latency, blocks read-only operations during registry outages, and produces redundant calls for the same content digest across concurrent reconciles.

As deployments grow we would have more projects, landscapes, concurrent promotions, hence this problem compounds. The controller reconciles every `VectorDeployment` at a configurable interval. Under load, dozens of reconciles for different deployments can hit the same vector digest simultaneously, each triggering an independent registry fetch. The API server is stateless and can be scaled horizontally, but any in-process cache lives only within a single replica; a multi-replica deployment today would multiply registry calls proportionally. The OCI registry itself becomes a scalability bottleneck if Konfidence does not reduce the call volume.

The goal is to make obtaining OCM resources within Konfidence performant: controllers, API consumers, and interactive workflows should not be blocked by redundant remote registry calls. Specifically:

- Dashboard and CLI development should be able to surface the contents of individual artifacts and full vector contents with latency comparable to a local Kubernetes API call, not a remote registry round-trip.
- Operators approving promotions need the diff between the incoming and currently deployed vector to be available immediately when they open the approval UI - not computed on demand against the registry at decision time.

The data needed to solve the UI use cases is partially already in the system, but it's just not surfaced. `VectorDeployment.Status.ResolvedVectorOcm` holds the full OCM descriptor JSON after the first fetch, and `ArtifactDeployment.Spec.Component.Resources` holds parsed OCM resources. The `VectorDescriptor` struct (returned by `VectorOcmPort.GetVectorDescriptor`) now also carries a `Configuration []byte` field for the optional vector-scoped config resource, showing the codebase is already accumulating content on the port. None of this is exposed through the API server: the 18 paths in `api/openapi.yaml` include `getVectorDeploymentV1` and `getArtifactDeploymentV1` (added recently), but those return only reference strings and status, but no endpoint returns vector component lists, artifact versions, or vector configuration content. `VectorPromotionStatus` has no diff fields; the only comparison in the controller is a string equality check on the vector reference.

Two caching patterns already exist in the codebase and inform the design: the `hashicorp/golang-lru/v2/expirable` LRU in `pkg/ocm/crypto/verifier_cache.go` (keyed by content digest, configurable size and TTL), and the `InMemoryCache` with `singleflight` in the KLO OFREP service (event-driven invalidation via Kubernetes informer, prevents thundering-herd on concurrent cache misses).

This ADR is out of scope for changes to how vectors are assembled or promoted, and for metadata storage and vector lifecycle history.

## Considered solutions

### Option 1 - Extend existing CR storage and surface via the API

The relevant data already exists on CRs. `VectorDeployment.Status.ResolvedVectorOcm` stores the full descriptor JSON after first fetch; `ArtifactDeployment.Spec.Component.Resources` stores parsed OCM resources. The missing piece is wiring this through the API response model and adding a content endpoint. No new infrastructure is required.

The immediate implementation reads from these CR fields with no registry calls at read time. For artifacts not currently represented by a live CR, the endpoint falls back to a direct registry fetch, serving as the API boundary behind which caching can be added transparently later.

Advantages:

- Lowest implementation cost - data already exists in etcd, no new infrastructure
- Replaces remote registry calls with local Kubernetes API reads for all currently deployed artifacts - a local etcd read is orders of magnitude faster and available even when the registry is not
- Scales horizontally with the API server - etcd is the shared store, no per-replica cache coordination needed

Disadvantages:

- CRs are operational objects, not a content store - bloating status fields with large descriptor JSON is a misuse of etcd
- etcd has a hard object size limit (default 1.5 MB) - large vectors with many components could approach this; as the number of managed components grows, this ceiling becomes a hard scalability constraint
- Content is tied to the CR lifecycle - if a `VectorDeployment` is deleted, the content is gone
- Does not cover the promotion diff view - the "before" vector may have no `VectorDeployment` in the target landscape yet
- The fallback to a direct registry fetch for non-deployed artifacts means this option alone does not fully deliver on the performance goal for the general case - it is performant only for artifacts currently represented by a live CR

### Option 2 - Precompute and store the vector diff on VectorPromotion at creation time

When a `VectorPromotion` enters `Waiting` state, fetch both vectors from OCM once, compute the artifact-level diff, and write it to `VectorPromotionStatus`. The approval UI reads the diff from the CR - zero registry calls at approval time. The "before" side of the diff is on `Stage.Spec.Vector`, which is already resolved by `resolveTargetStage` during promotion execution; the same call works at `Waiting` state.

`VectorPromotionStatus` currently has no diff fields and the controller has no OCM client.

Advantages:

- Directly solves the promotion approval performance problem - the diff is precomputed and stored; opening the approval UI requires no registry call
- Registry calls happen exactly once per promotion at creation - not on every approval page load
- Diff is immutable once written - consistent for all approvers regardless of timing

Disadvantages:

- Only covers promotions - not the general vector content inspection use case (UI stage view, CLI artifact inspection)
- Promotions that existed before this feature was deployed have no pre-computed diff; a fallback registry fetch or a "diff unavailable" state is needed for those
- If the registry is unavailable at promotion creation time, diff computation fails

### Option 3 - LRU cache keyed by content digest in the controller, pre-warmed by outstanding promotions

Wrap the `VectorOcmPort` interface (currently at `internal/vectordeployment/internal/controller/ocm_port.go:23`) with a caching adapter keyed by content digest. Introduce a dedicated `VectorPromotionCacheWarmer` reconciler that watches for `VectorPromotion` objects entering `Waiting` state and pre-warms the cache with both the incoming and currently deployed vector before the approval UI asks.

Content digest is a natural cache key - the same digest always means the same content (immutable by definition in OCM/OCI), so there is no cache invalidation problem. The existing `VectorPromotionReconciler` returns `ctrl.Result{}` with no requeue while `Waiting`, relying entirely on update events; pre-warming therefore requires a separate reconciler.

Per reconcile, the warmer reads `VectorPromotion.Spec.Vector` (the incoming "after" reference), calls `resolveTargetStage` to get the currently deployed "before" reference from `Stage.Spec.Vector`, calls `ocmPort.GetVectorDescriptor` for both refs to populate the shared cache, computes the artifact-level diff in-process, and writes the result to `VectorPromotionStatus.Diff`. If the registry is unreachable, the warmer writes `DiffState: Failed` and returns an error (triggering controller-runtime exponential backoff); the main reconciler ignores the diff field entirely, so the promotion is never blocked.

`VectorOcmPort` is currently private to the vectordeployment controller package and must be promoted to a shared package before the vectorpromotion controller can depend on it.

Advantages:

- The approval UI diff is served from cache - zero registry latency at approval time; the cache is warmed before the user opens the page, not in response to the request
- Eliminates redundant registry calls across concurrent reconciles for the same content digest - the singleflight layer prevents thundering-herd when many reconciles race on the same digest simultaneously, which is the primary controller-side performance failure mode today
- Failure is decoupled from promotion state - registry unavailability does not block approval
- The implementation pattern (LRU + singleflight) already exists in the codebase - `pkg/ocm/crypto/verifier_cache.go` (keyed by content digest) and the `InMemoryCache` with singleflight in the KLO OFREP service

Disadvantages:

- Cache is lost on controller restart - cold start re-fetches until promotions re-trigger warming
- Does not directly help the API server (separate process) or the UI stage view
- Memory-bound - as the number of distinct vector digests in flight grows, the cache size must be tuned; a fixed-size LRU can evict entries that are still needed under high concurrency
- In-process cache is not shared across controller replicas in a multi-replica HA setup - each replica warms its own cache independently, which reduces but does not eliminate redundant fetches across replicas

### Option 4 - Caching at the API server level

The API server acquires an OCM client, fetches vector and artifact content on demand, and caches responses in-process using the `otter`-backed pattern already established in `internal/api/oidc/exchangestore.go`. The API server currently makes zero OCM calls and has no OCM client wired in. This option covers both the UI stage view and the promotion diff use case - the API server fetches and caches both sides of the diff on first request.

This pattern is well-validated in the industry. Harbor implements exactly this - an in-process OCI manifest cache within the API server process. The Kubernetes apiserver's watch cache is the reference implementation of per-replica in-process caching for immutable content without any shared state. The key property that makes per-replica caching safe here is that OCM content is digest-addressed: the same digest always produces the same bytes, so cache misses across replicas are consistent (not divergent) and simply result in redundant registry fetches rather than stale reads. Argo CD chose a different model (shared Redis backing a dedicated repo-server) driven by mutable tag lookups and large-scale deployments - a different operating regime from Konfidence today.

Advantages:

- Directly serves the UI - the API server is the natural boundary for UI-facing data
- Covers both the stage view and promotion diff use cases without controller changes
- Independent of the controller lifecycle
- No additional infrastructure dependency (no Redis, no shared store)

Disadvantages:

- Adding an OCM dependency introduces a new failure mode - registry unavailability now affects reads, not just writes
- Per-replica cache duplication means each replica independently warms its cache; under many replicas, total registry call volume on cold start scales with replica count - tolerable because digest-keyed content is immutable, so cache misses are redundant fetches rather than stale reads
- For mutable references (vector tags, "latest"), per-replica in-process caches can serve different versions briefly after a tag moves; a short TTL or explicit invalidation signal is required
- Higher implementation cost than Option 1 for the UI stage view use case, since the data already exists on CRs
- The promotion diff still requires a live registry call on first request per replica, unlike Option 3 which pre-warms before the user opens the approval UI

### Option 5 - Database storage for artifact and vector content

Introduce a PostgreSQL schema for vector descriptors, artifact manifests, and computed diffs. The controller writes to the database after fetching from OCM; the API server reads from the database. The DB infrastructure already exists (`cmd/api/db/`, goose migrations, sqlc) but its single migration creates only session and OIDC tables.

Advantages:

- Survives process restarts on both the controller and API server
- Shared across all API server replicas without coordination - registry call volume does not grow with replica count, making this the only option that scales horizontally without per-replica redundancy
- Enables historical queries
- Content outlives the CRs that produced it - vectors deleted from the cluster remain queryable

Disadvantages:

- Highest implementation cost - new schema, queries, and repository layer in both the controller and API server
- Making OCM content require the database forces all operators to run Postgres; the feature is currently opt-in
- Introduces write-path coupling between the controller and the database - a DB failure must not block reconciliation

## Potential Decision

A layered approach is chosen, combining Options 1, 2, and 3.

**Option 1** is adopted as the immediate layer: add an API endpoint that returns the content of any Konfidence OCM artifact - both vectors and component artifacts - regardless of whether the artifact is currently deployed. The response includes the component list with names and resolved versions for vectors, vector configuration (`vectorConfig` features and authored values), and raw artifact content for component artifacts. The implementation reads from `VectorDeployment.Status.ResolvedVectorOcm` and `ArtifactDeployment.Spec.Component.Resources` for deployed artifacts and falls back to a direct registry fetch for others. This directly unblocks the UI stage view and the `kden` CLI artifact inspection use cases.

**Options 2 and 3** are combined into a single design for the promotion diff use case: a shared LRU cache (with singleflight) wraps `VectorOcmPort` and is injected into both the `VectorDeployment` and `VectorPromotion` controllers at startup. A new `VectorPromotionCacheWarmer` reconciler watches for promotions entering `Waiting` state, pre-warms the cache with both the incoming and currently deployed vector, computes the diff in-process from the cached descriptors, and writes the result to `VectorPromotionStatus.Diff`. When content is already in cache, diff computation requires no registry calls. The diff is surfaced through an extended `VectorPromotion` API response with a nullable `diff` field (`state: pending | ready | failed`). The promotion itself is never blocked by a diff computation failure.

**Options 4 and 5 are deferred.** API-server-level caching (Option 4) is a well-validated pattern for digest-keyed immutable content - it is deferred not because it is wrong, but because Option 1 already serves the UI use case with lower cost by reading from CRs. Option 4 becomes the natural follow-on if the API server is scaled beyond a few replicas or if the fallback registry path becomes a bottleneck. Database storage (Option 5) is deferred until multi-replica or historical content requirements are concrete.

## Consequences

**From Option 1 (CR storage + API endpoint):**
- etcd object size must be monitored once content fields are added to `VectorDeployment` status; as the number of managed components per vector grows, large descriptors may approach etcd's 1.5 MB object limit and require a size budget check before writing
- Each API server replica reads from etcd - this scales well horizontally, but the fallback registry fetch for non-deployed artifacts is per-replica; since OCM content is digest-addressed, this causes redundant fetches rather than stale reads, tolerable at low replica count

**From Options 2 + 3 (LRU cache + VectorPromotionCacheWarmer):**
- `VectorOcmPort` must be promoted to a shared package before any of this work starts - it is currently private to the vectordeployment controller package and must be accessible to the vectorpromotion controller
- The `VectorPromotion` controller acquires an OCM client dependency for the first time
- The LRU cache size must be tuned relative to the number of distinct vector digests expected to be in flight concurrently; an undersized cache under high load will evict entries that are still needed, increasing registry pressure rather than reducing it
- The in-process cache is not shared across controller replicas in a multi-replica HA setup - each replica warms independently, which reduces but does not eliminate redundant registry fetches
- The `VectorPromotionCacheWarmer` reconciler must be registered alongside the existing promotion controllers in `setup.go`

**Deferred (Options 4 + 5):**
- Option 4 (API-server-level cache) should be re-evaluated if the API server is scaled beyond a few replicas and fallback registry calls become measurable - it is a low-infrastructure alternative to Option 5 for that scenario
- Option 5 (database) should be re-evaluated if multi-replica coherence or historical content queries become a concrete requirement

## Implementation Order

1. Promote `VectorOcmPort` to a shared package - it is currently private to `internal/vectordeployment/internal/controller/`; unblocks all subsequent steps
2. Write caching adapter wrapping `VectorOcmPort` (LRU + singleflight, following the pattern in `pkg/ocm/crypto/verifier_cache.go`)
3. Wire shared cache into `VectorDeployment` controller (replaces direct `ocm_adapter` calls at `ocm_adapter.go:81,179`)
4. Add `Diff` and `DiffState` fields to `VectorPromotionStatus` - update CRD
5. Write `VectorPromotionCacheWarmer` reconciler - register in `setup.go`
6. Add OCM artifact content endpoints to the API server - `getVectorContentV1`, `getArtifactContentV1`, and `getVectorPromotionDiffV1`; document in `api/openapi.yaml`
7. Implement handlers: reads from CR fields for deployed artifacts, falls back to registry for others; wire `VectorPromotionCacheWarmer` diff output into `getVectorPromotionDiffV1`
8. Extend `toVectorPromotionResponse` with nullable `diff` field
9. Regenerate `internal/api/openapi/server.go`, `internal/kden/apiclient/client.go`, and `packages/konfidence-api-client/src/schema.d.ts`

## Open Questions

- What is the right etcd size budget for `ResolvedVectorOcm`? Should there be a guard before writing large descriptors to status, or should content above a threshold be fetched live?
- What LRU cache size is appropriate for the expected number of concurrent vector digests in flight? Should this be configurable via the Helm chart?
- Should the `VectorPromotionCacheWarmer` also pre-warm on `Ready` state (approved but not yet executing), or only `Waiting`? Pre-warming on `Ready` would cover cache eviction between approval and execution.
