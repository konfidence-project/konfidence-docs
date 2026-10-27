---
id: ADR-0042
title: "OCM Content Layer: Performant access to OCM resources"
description: "Establish a caching and content-access strategy so that controllers, API consumers, and interactive workflows are no longer bottlenecked by redundant remote registry calls."
status: proposed
date_proposed: 2026-10-20
authors: [AleksandarMuradyan, StefanShivarov]
category: Architecture Pattern
impact: High
dependencies: [ADR-0006, ADR-0019, ADR-0032]
pageClass: adr
outline: deep
---

# ADR-0042: OCM Content Layer - Performant access to OCM resources

<AdrHeader />

## Context

Every time a user opens a stage in the UI, inspects an artifact from the CLI, or opens a promotion for approval, Konfidence makes a live call to the OCI registry to fetch the vector descriptor and artifact manifests. There is no local storage or caching strategy. A remote registry call is a synchronous network round-trip which is typically tens to hundreds of milliseconds under normal conditions, potentially seconds under load, and a hard failure when the registry is unavailable.

There are three concrete use cases this ADR must address:

**Stage detail view.** A user opens a stage in the UI to see which artifact versions are currently deployed and what configuration they carry. Today this triggers a live registry call. The data is already available in the cluster - `Stage.Status.LatestVectorDeploymentRef` points to the `VectorDeployment` CR, which holds `ResolvedVectorOcm` (full descriptor JSON) written by the deployment controller, and `VectorData` holds the resolved `features` and `authored` configuration, but neither is exposed through the API.

**Promotion approval diff.** A user opens a pending promotion to compare the incoming vector against what is currently deployed before approving. Promotions are created automatically by the `VectorPromotionConfigReconciler` when it detects drift between source and target and the user does not trigger them. For `Stage` sources, `RequireApproval` defaults to `true`, so the promotion sits in `Waiting` state until a user acts. The current vector is available on the existing `VectorDeployment` CR. The incoming vector is not and the `VectorDeployment` for it is only created after the promotion executes (`Stage.Spec.Vector` is written on execution → stage controller creates `StageVersion` → `StageVersionReconciler` creates `VectorDeployment`). A registry call is therefore unavoidable for the incoming side under the current design, and it happens in the request path: every time a user opens the approval UI, the server waits on the registry before rendering the page.

**CLI artifact inspection.** A developer uses `kden artifact inspect` to examine the tasks, resources, and configuration of an artifact version, including versions that are not currently deployed (historical, from another landscape, or never promoted). There is no CR to read from; a registry call is always required today.

The codebase already contains two patterns that inform the caching design: the `hashicorp/golang-lru/v2/expirable` LRU in `pkg/ocm/crypto/verifier_cache.go` (keyed by content digest, configurable size and TTL), and the singleflight pattern in `internal/auth/token_verifier.go` (collapses concurrent cache misses for the same key into a single in-flight call).

This ADR is out of scope for changes to how vectors are assembled or promoted, and for metadata storage and vector lifecycle history.

## Considered options

### Option 1 - CR storage + API endpoint

Expose the content already stored on CRs (`VectorDeployment.Status.ResolvedVectorOcm`, `ArtifactDeployment.Spec.Component.Resources`, `VectorData`) through new API endpoints. Fall back to a live registry fetch for content not covered by a live CR.

**What it covers.** Stage view is served from the existing `VectorDeployment` CR with no registry call. Promotion diff current side is also served from the CR. The promotion diff incoming side and all CLI inspect cases still require a live registry call, so no CR exists at `Waiting` state, and non-deployed versions have no CR at all.

**Persistence.** Content is tied to the CR lifecycle. If the `VectorDeployment` is deleted (rollback, cleanup), the descriptor is gone and the diff endpoint returns 404 for that version.

**Maintainability overhead.** Low - no new infrastructure, no new reconcilers, no new packages.

**Implementation time.** Fastest.

**Assessment.** Not adopted as a standalone solution. etcd is not a content store and storing large JSON blobs in `status` fields is a misuse of Kubernetes API machinery and a pattern to avoid. The 1.5 MB per-object hard limit is a concrete blocker as vector size grows; a 50-component descriptor can already reach 200–400 KB. The option also leaves the two highest-priority use cases - promotion diff incoming side and CLI inspect. The CR fields it relies on remain useful as an internal data source (the Phase 1 warmer reads `ResolvedVectorOcm` to get the current vector), but exposing them directly through the API as the primary content layer is not the right design.

### Option 2+3 - Controller-side LRU cache + promotion diff pre-compute

Wrap `VectorOcmPort` with a caching adapter (LRU + singleflight) shared across controllers. A new `VectorPromotionCacheWarmer` reconciler watches promotions entering `Waiting` state, pre-fetches both sides of the diff in the background, and writes the result to `VectorPromotionStatus.Diff`. The approval UI reads the diff from the CR with no registry call at request time.

`VectorOcmPort` is currently private to `internal/vectordeployment/internal/controller/` and must be promoted to a shared package before this work can start.

**What it covers.** Promotion diff is pre-computed before the user opens the approval page. The singleflight layer collapses concurrent cache misses for the same digest into a single in-flight registry call, eliminating thundering-herd across reconciles. Stage view and CLI inspect remain unaddressed and the controller-side cache is not accessible to the API server.

**Persistence.** In-memory only, lost on controller restart. The cache self-heals quickly: any promotion in `Waiting` state re-triggers the warmer on the first informer event after startup.

**Maintainability overhead.** Medium - new `VectorPromotionCacheWarmer` reconciler, a new shared package for `VectorOcmPort`, LRU cache size tuning, and the `VectorPromotion` controller acquiring an OCM client dependency for the first time.

**Implementation time.** Medium.

**Assessment.** Adopted for the promotion diff use case. Moves the unavoidable registry call for the incoming vector out of the request path entirely and into the controller background. Incomplete on its ownm, so stage view and CLI inspect remain unaddressed.

### Option 4 - API server in-process cache

The API server acquires an OCM client and caches responses in-process using the `otter`-backed pattern already established in `internal/api/oidc/exchangestore.go`. All three use cases are served through a single code path. The API server currently makes zero OCM calls and has no OCM client wired in.

OCM content is digest-addressed where the same digest always produces the same bytes, so per-replica cache misses result in redundant fetches rather than stale reads. This is the same property that makes Harbor's in-process OCI manifest cache and the Kubernetes apiserver's watch cache safe without shared state. For mutable references (vector tags), a short TTL is required to prevent serving stale content after a tag moves.

**What it covers.** Stage view, promotion diff, and CLI inspect are all served from cache after the first request per version per replica. Independent of the controller lifecycle: reads are served even if controllers are restarted or temporarily unavailable.

**Persistence.** In-memory only, lost on API server restart. Each replica warms its cache independently; under many replicas, total registry call volume on cold start scales with replica count, though redundant fetches rather than stale reads.

**Maintainability overhead.** Medium - OCM client wired into the API server for the first time (credential secret env vars, RBAC, Helm chart values); cache size and TTL tuning; registry unavailability becomes a new failure mode for read operations where today it only affects writes.

**Implementation time.** Medium-fast.

**Assessment.** Adopted as the planned follow-on layer for stage view and CLI inspect. Covers what Options 2+3 leave out. Deferred until Phase 1 is stable, but treated as the explicit next step rather than a speculative future option. Becomes a priority if the API server is scaled beyond a few replicas or if the fallback registry path on the incoming-side lookup becomes measurable.

### Option 5 - Database storage

Introduce a PostgreSQL schema for vector descriptors, artifact manifests, and computed diffs. The controller writes to the database after fetching from OCM; the API server reads from the database. The DB infrastructure already exists (`cmd/api/db/`, goose migrations, sqlc) but is currently opt-in - the API server only connects when `API_SESSION_STORAGE_TYPE=db-pg` is set.

**What it covers.** All three use cases, plus historical queries ("what was deployed on this stage six months ago", "which vectors have ever contained artifact X"), which is a capability class none of the other options provide. Content outlives the CRs that produced it; the diff endpoint never returns 404 due to a deleted `VectorDeployment`. Registry call volume is bounded by the number of distinct digests ever seen, not by replica count - the only option that scales horizontally without per-replica redundancy.

**Persistence.** Full - survives restarts, shared across all replicas.

**Maintainability overhead.** High - new schema, migrations, queries, and repository layer in both the controller and API server; write-path coupling between controller and DB requires an async write buffer to decouple failure domains (a DB outage must not block reconciliation); Postgres becomes a hard runtime dependency for operators who do not need it today, since it is currently opt-in.

**Implementation time.** Slowest.

**Assessment.** Deferred. Architecturally the strongest long-term choice and the only option that fully solves the scalability and persistence problems. Too heavy to build and operate now. Re-evaluate when multi-replica coherence or historical content queries become a concrete requirement.

## Decision

Two combinations were considered before settling on the approach below.

### Option 1 + 2 + 3 - CR layer plus controller cache

This combination adds Option 1 (expose CR-stored content through the API) on top of Options 2+3 (controller-side LRU cache and promotion diff pre-compute). The appeal is that Option 1 delivers the stage view immediately with zero new infrastructure, while Options 2+3 handle the promotion diff.

The problem is that Option 1 should not be built at all as a content layer. Storing large JSON blobs in `status` fields is a misuse of etcd, so the 1.5 MB per-object hard limit becomes a real constraint as vector size grows, and the pattern sets a precedent of treating CRs as a content store that will be difficult to walk back. Building the stage view on top of `ResolvedVectorOcm` today means migrating off it later when the limit bites, which is a second migration that Options 2+3+4 avoid entirely. The CR fields remain useful as an internal data source for the Phase 1 warmer, but they should not be the API-facing layer.

This combination also leaves the CLI inspect use case entirely unaddressed: there is no CR for non-deployed versions, so every `kden artifact inspect` call still hits the registry directly.

### Option 2 + 3 + 4 - Controller cache plus API server cache (proposed)

Options 2+3 address the promotion diff by moving the unavoidable registry call for the incoming vector out of the request path and into the controller background. Option 4 addresses the stage view and CLI inspect by adding an in-process cache to the API server. Together they cover all three use cases without storing content in etcd.

The tradeoff versus Option 1+2+3 is implementation time: Option 4 requires wiring an OCM client into the API server for the first time (credential secrets, RBAC, Helm values), whereas Option 1 would reuse data that already exists on CRs. That cost is real but one-time and the `vector-diff` branch has already paid it. The ongoing cost of maintaining a CR-based content layer including size monitoring, guards, potential migrations, is higher over the lifetime of the feature.

**This is the proposed approach**, delivered in two phases.

---

**Phase 1 - Promotion diff (Options 2+3).** A shared LRU cache with singleflight wraps `VectorOcmPort` and is injected into both the `VectorDeployment` and `VectorPromotion` controllers. A new `VectorPromotionCacheWarmer` reconciler watches for promotions entering `Waiting` state and immediately pre-fetches both sides of the diff in the background:

- **Incoming vector** (`VectorPromotion.Spec.Vector`) - no CR exists yet at this point; the warmer makes the registry call off the request path and populates the cache.
- **Current vector** (`Stage.Spec.Vector`) - the `VectorDeployment` CR is available; `ResolvedVectorOcm` is read directly.

The warmer computes the artifact-level diff in-process from the cached descriptors and stores it keyed by the digest pair of the two vectors. When the user opens the approval UI, `getVectorDiffV1` resolves both refs to their digests, looks up the cached diff, and returns it — replacing the current `vector-diff` implementation which fetches both sides live from the registry on every request. The diff is exposed as a nullable field on the `VectorPromotion` API response (`state: pending | ready | failed`). A diff computation failure never blocks the promotion itself; the warmer writes `DiffState: Failed` and retries on backoff while the main reconciler proceeds normally.

**Cache key design.** All cache entries are keyed by OCI content digest (SHA-256). This is safe because the OCI digest is globally unique by definition, so the same digest always means the same bytes regardless of which project, landscape, or registry the vector came from. Using the vector name, tag, or reference string as a key is not sufficient because the same logical name can resolve to different content over time (tags are mutable) or across namespaces (name conflicts). The digest is the only identifier that unambiguously identifies a specific version of content.

**Fallback behaviour.** The in-process cache is an optimisation layer, not a hard dependency. If the cache is cold, evicted, or the controller restarts, every content endpoint and the diff endpoint fall back to a direct OCI registry call. This applies uniformly across all endpoints — `getVectorContentV1`, `getArtifactContentV1`, and `getVectorDiffV1` — so the system degrades gracefully to the pre-cache behaviour rather than failing.

**Phase 2 - Stage view and CLI inspect (Option 4).** The `vector-diff` branch has already laid the foundation: `pkg/ocm/content.Reader`, `buildOCMReader`, and the `getVectorContentV1` / `getArtifactContentV1` endpoints are in place. What remains is adding an in-process `otter` cache in front of the `Reader` so that subsequent calls for the same digest are served without a registry round-trip. The same fallback behaviour applies: a cache miss or unavailable cache falls back to a direct OCI registry call.

**API surface for UI consumers.** In case we proceed with the current desing of the endpoints as defined in the `vector-diff` branch, the backend exposes three distinct endpoints so that the UI team doesn't need to perform any content fetching, diff computation, or cache coordination itself. All heavy work happens in the backend before the response is served.

`GET /v1/projects/{projectId}/vectors/content?refs=<ref>&refs=<ref>&...` — returns the full content of one or more vectors by reference: for each ref, the list of components with their resolved versions and the vector configuration (`features` and `authored` values). The `refs` parameter is repeatable; pass multiple `refs=` values to batch-fetch several vectors in a single call. Backed by the API server in-process cache (Phase 2). On cache miss, falls back to a direct OCI registry call. The UI could utilise this for the stage detail view.

`GET /v1/projects/{projectId}/artifacts/content?ref=<ref>` — returns the content of a single component artifact by reference: type, tasks, resources, and whether reuse is allowed. Also backed by the API server in-process cache (Phase 2) with OCI fallback. The UI and CLI use this for artifact inspection.

`GET /v1/projects/{projectId}/vectors/diff?incoming=<incomingVectorRef>&current=<currentVectorRef>` — returns the diff between two vectors identified by their refs. The backend computes the diff in the `VectorPromotionCacheWarmer` before the user opens the page and caches the result keyed by the digest pair. The endpoint resolves both refs to their OCI digests, looks up the cached diff, and returns it. If the diff is not yet cached (`DiffState: Pending`) or the cache is unavailable (`DiffState: Failed`), the endpoint falls back to fetching both sides live from the OCI registry and computing the diff inline. The response includes the diff state so the UI can distinguish between a ready diff, a still-computing diff, and a failed diff. Because the endpoint accepts arbitrary vector refs rather than a promotion ID, the UI can request a diff between any two vectors — not only those involved in an active promotion.

The key contract with the UI team is: the UI never calls the OCI registry directly, never computes diffs, and never coordinates cache state. It calls one of these three endpoints and receives a fully resolved response. The backend decides whether to serve from cache, from a pre-computed CR field, or from a live registry call. On cold start or after a cache eviction, each replica fetches from the OCI registry independently. Because all cache entries are digest-keyed and OCM content is immutable, concurrent misses across replicas result in redundant fetches rather than stale reads, hence the correctness property is preserved. Cross-replica cache synchronisation (shared Redis, distributed cache, gossip) is not adopted because it adds infrastructure dependency and operational complexity that outweighs the cost of redundant fetches. This decision should be re-evaluated if registry call volume at scale becomes a measurable problem or if Option 5 (database) is adopted.

**Option 5** is deferred until multi-replica coherence or historical content queries become a concrete requirement. Also contradicts with OCI design principles

## Consequences

- `VectorOcmPort` must be promoted to a shared package before Phase 1 can start. It's currently private to `internal/vectordeployment/internal/controller/`
- The `VectorPromotion` controller acquires an OCM client dependency for the first time
- The `VectorPromotionCacheWarmer` reconciler must be registered in `setup.go` alongside the existing promotion controllers
- LRU cache size must be tuned to the expected number of distinct vector digests in flight concurrently; an undersized cache evicts entries under high load, increasing registry pressure rather than reducing it; controller HA typically runs two replicas, so in practice each warms its own cache independently, doubling calls on cold start
- Phase 2 introduces the OCI registry as a new failure mode for API read operations, but registry unavailability currently only affects writes; operators must be informed of this change through release notes and Helm chart documentation. Note: the `vector-diff` branch has already introduced this dependency, but all three content endpoints make live registry calls today.
- Phase 2 requires credential secret management in the API server deployment (env vars, RBAC, Helm values). The env vars and OCM client wiring are already in place in `vector-diff`; Helm chart values and RBAC may still need to be added.
- `getVectorDiffV1` currently fetches both vector sides sequentially from the OCI registry. Until Phase 1 caching lands, these two independent calls should be made in parallel to halve per-request latency on cache miss.

## Open questions

- What LRU cache size is appropriate for the expected number of concurrent vector digests in flight? Should this be configurable via the Helm chart?
- Should the `VectorPromotionCacheWarmer` also pre-warm on `Ready` state (approved but not yet executing), or only `Waiting`? Pre-warming on `Ready` would cover the gap between approval and execution. Because all endpoints fall back to the OCI registry on cache miss, this is a performance question rather than a correctness one.
