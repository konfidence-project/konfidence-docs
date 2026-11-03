---
id: ADR-0042
title: "OCM Content Layer: Exposing storage-level OCM data through the Konfidence API"
description: "The Konfidence API previously only exposed in-cluster deployment state. This ADR extends it to also expose storage-level OCM data where vector descriptors and artifact manifests read directly from the OCI registry and establishes the caching strategy to keep registry calls out of the request path."
status: proposed
date_proposed: 2026-10-20
authors: [AleksandarMuradyan, StefanShivarov]
category: Architecture Pattern
impact: High
dependencies: [ADR-0006, ADR-0019, ADR-0032]
pageClass: adr
outline: deep
---

# ADR-0042: OCM Content Layer - Exposing storage-level OCM data through the Konfidence API

<AdrHeader />

## Context

Currently the Konfidence API only exposes in-cluster deployment state: what is deployed, where, and in what configuration. All of that data lives in Kubernetes CRs (`Stage`, `VectorDeployment`, `VectorData`, `ArtifactDeployment`) and the API server reads it directly from the control plane without ever touching the OCI registry.

**This ADR crosses a new boundary: the API now also exposes storage-level OCM data.** Vector descriptors and artifact manifests are read directly from the OCI registry and served through the API. This is a fundamentally different category of data from deployment state, as it lives in OCM rather than in the control plane and has no CR representation. The control plane remains the source of truth for deployment state and the OCI registry becomes an additional data source for OCM content. We set a ground rule that follows from this is to serve from the control plane first, and fall back to a registry call only for content the control plane does not hold.

The concrete driver for this change is the **vector diff** where a user compares two vectors, most commonly to review an incoming vector against what is currently deployed. The current vector is available on the existing `VectorDeployment` CR. The incoming vector has no CR yet, so a `VectorDeployment` for it is only created after the promotion executes. Until then, the only way to read the incoming vector descriptor is a live registry call. This call happens in the request path, so every time a user opens the diff view, the server waits on the registry before rendering the result.

Two additional use cases follow from this same architectural extension:

**Stage detail view.** The control plane already holds the data needed to show which artifact versions are currently deployed and what configuration they carry. What needs to be defined is the API contract for exposing it, so which fields are served from control plane CRs, at what point a request falls through to a registry call, and how the two sources are unified into a single response.

**Artifact and vector data inspection.** The API exposes artifact and vector content by OCM ref. What needs to be defined is the fallback boundary: content reachable through the control plane is served without a registry call, so content not yet present in the current landscape requires one.

Because the API now makes live registry calls in the request path, performance becomes a first-class concern. The codebase already contains two patterns that inform the caching design: the `hashicorp/golang-lru/v2/expirable` LRU in `pkg/ocm/crypto/verifier_cache.go` (keyed by content digest, configurable size and TTL), and the singleflight pattern in `internal/auth/token_verifier.go` (collapses concurrent cache misses for the same key into a single in-flight call).

## Considered options

### Option 1 - CR storage + API endpoint

Expose the content already stored on CRs (`VectorDeployment.Status.ResolvedVectorOcm`, `ArtifactDeployment.Spec.Component.Resources`, `VectorData`) through new API endpoints. Fall back to a live registry fetch for content not covered by a live CR.

**What it covers.** Stage view is served from the `VectorDeployment` CR reachable via `Stage.Status.ActiveStageVersion` with no registry call. The diff current side is also served from the CR when a `VectorDeployment` exists for that vector.

**Persistence.** Content is tied to the CR lifecycle. If the `VectorDeployment` is deleted (rollback, cleanup), the descriptor is no longer available from the control plane and the diff endpoint falls back to a live registry call for that vector.

**Maintainability overhead.** Low - no new infrastructure, no new reconcilers, no new packages.

**Implementation time.** Fastest.

**Assessment.** Not adopted as a standalone solution. etcd is not a content store and storing large JSON blobs in `status` fields is a misuse of Kubernetes API machinery. The 1.5 MB per-object hard limit is a concrete blocker as vector size grows where a 50-component descriptor can already reach 200-400 KB. The option also leaves the diff incoming side unaddressed. The CR fields it relies on remain useful as internal data sources, but exposing them directly through the API as the primary content layer is not the right design.

### Option 2+3 - Controller-side LRU cache + diff pre-warm

Wrap `VectorOcmPort` with a caching adapter (LRU + singleflight) shared across controllers. A new `VectorCacheWarmer` reconciler watches any resource that references a vector (promotions, stages, stage versions) and pre-fetches referenced vectors in the background, populating the cache before the user requests a diff.

`VectorOcmPort` is currently private to `internal/vectordeployment/internal/controller/` and must be promoted to a shared package before this work can start.

**What it covers.** The unavoidable registry call for the incoming vector is moved out of the request path and into the controller background. When the user opens the approval UI, the diff endpoint resolves both refs, looks up the cached descriptors, and returns the diff. If the cache is cold (controller restart, eviction), the endpoint falls back to a direct registry call. The singleflight layer collapses concurrent cache misses for the same digest into a single in-flight registry call, eliminating thundering-herd across reconciles.

**Note on the current vector.** The currently deployed vector can change at any time (for example, a hotfix is deployed while a promotion is pending). The cache must therefore re-resolve `Stage.Spec.Vector` at request time rather than fixing it at pre-warm time. Only vectors without an existing `VectorDeployment` strictly need pre-warming and all other referenced vectors are served from the control plane first and cached as a fallback.

**Persistence.** In-memory only, lost on controller restart. The cache self-heals: the warmer re-triggers on the first informer event after startup for any resource still referencing a vector not yet in cache.

**Maintainability overhead.** Medium - new `VectorCacheWarmer` reconciler, a new shared package for `VectorOcmPort`, LRU cache size tuning, and the `VectorPromotion` controller acquiring an OCM client dependency for the first time.

**Implementation time.** Medium.

**Assessment.** Adopted for the diff use case. Stage view and artifact inspection remain unaddressed by this option alone.

### Option 4 - API server in-process cache

The API server acquires an OCM client and caches responses in-process. All three use cases are served through a single code path. The API server currently makes zero OCM calls and has no OCM client wired in.

**Mutable references vs immutable digests.** OCM component versions addressed by digest are immutable, so the same digest always produces the same bytes. OCM aliases (mutable tags) can be reassigned and require a short TTL to prevent serving stale content. The cache distinguishes the two: digest-keyed entries are held without TTL expiry, while alias-keyed entries are held with a short configurable TTL and re-validated on expiry.

**Credentials.** The API server uses the same credential resolution mechanism as the controllers, reading registry credentials from the Kubernetes secret referenced by `KONFIDENCE_API_CREDENTIALS_SECRET_NAME` and `KONFIDENCE_API_CREDENTIALS_SECRET_NAMESPACE`. See [#393](https://github.com/konfidence-project/konfidence/issues/393) for the credential propagation design.

**What it covers.** Stage view, diff, and artifact inspection are all served from cache after the first request per version per replica. Independent of the controller lifecycle.

**Persistence.** In-memory only, lost on API server restart. Each replica warms its cache independently, therefore under many replicas, redundant fetches on cold start rather than stale reads.

**Maintainability overhead.** Medium - OCM client wired into the API server for the first time (credential secret env vars, RBAC, Helm chart values), cache size and TTL tuning, registry unavailability becomes a new failure mode for read operations where today it only affects writes.

**Implementation time.** Medium-fast.

**Assessment.** Adopted as the planned follow-on layer for stage view and artifact inspection. Covers what Options 2+3 leave out.

### Option 5 - Database storage

Introduce a PostgreSQL schema for vector descriptors, artifact manifests, and computed diffs. The controller writes to the database after fetching from OCM and the API server reads from the database.

**What it covers.** All three use cases, plus historical queries. Content outlives the CRs that produced it. Registry call volume is bounded by the number of distinct digests ever seen.

**Persistence.** Full - survives restarts, shared across all replicas.

**Maintainability overhead.** High - new schema, migrations, queries, and repository layer in both the controller and API server, write-path coupling between controller and DB, Postgres becomes a hard runtime dependency.

**Implementation time.** Slowest.

**Assessment.** Deferred. OCM is the intended primary storage layer for vectors and artifacts. Adding a parallel database store would duplicate that responsibility and create a synchronisation problem between the two stores. This option only makes sense if OCM gains an official database storage backend, or if historical content queries become a hard requirement that the OCI registry cannot satisfy. Re-evaluate then.

## Decision

Two combinations were considered before settling on the approach below.

### Option 1 + 2 + 3 - CR layer plus controller cache

This combination adds Option 1 on top of Options 2+3. The appeal is that Option 1 delivers the stage view immediately with zero new infrastructure.

The problem is that Option 1 should not be built as a content layer. Storing large JSON blobs in `status` fields misuses etcd, and the 1.5 MB per-object hard limit becomes a real constraint as vector size grows. Building the stage view on top of `ResolvedVectorOcm` today means migrating off it later, which is additional work that Options 2+3+4 avoid entirely.

### Option 2 + 3 + 4 - Controller cache plus API server cache (proposed)

Options 2+3 address the diff use case by moving the unavoidable registry call for the incoming vector out of the request path. Option 4 addresses stage view and artifact inspection by adding an in-process cache to the API server. Together they cover all three use cases without storing content in etcd, delivered in two phases.

---

**Phase 1 - Diff (Options 2+3).** A shared LRU cache with singleflight wraps `VectorOcmPort` and is accessible to both the `VectorDeployment` and `VectorPromotion` controllers. A new `VectorCacheWarmer` reconciler pre-fetches referenced vectors in the background for any resource that references a vector without an existing `VectorDeployment`. The warmer caches the vector content only — it does not pre-compute or store the diff. When a user compares two vectors in the UI, `getVectorDiffV1` fetches both vectors (trying in order from control plane, cache, or registry) and returns the diff between them. On cache miss, both vectors are fetched directly from the OCI registry. The diff computation is part of the ongoing implementation work. The API server requires an OCM client for this, which costs the same whether the diff is pre-computed or computed on request.

**Phase 2 - Stage view and artifact inspection (Option 4).** The foundation is already in place: `pkg/ocm/content.Reader`, `buildOCMReader`, and the three content endpoints make live registry calls today. What remains is adding an in-process cache in front of the `Reader` so that subsequent calls for the same ref are served without a registry round-trip. The same fallback behaviour applies: a cache miss falls back to a direct OCI registry call.

**Cache key design.** Cache entries for digest-addressed content are keyed by OCI content digest (SHA-256). The same digest always means the same bytes regardless of project, landscape, or registry. Mutable aliases (tags) are keyed by their full ref string and held with a short TTL.

**Fallback behaviour.** The cache is an optimisation layer, not a hard dependency. All three endpoints fall back to a direct OCI registry call on cache miss, so the system degrades to the pre-cache behaviour rather than failing.

**API surface.** The backend exposes three distinct endpoints so the UI never calls the OCI registry directly, never computes diffs, and never coordinates cache state. The concrete paths and parameters are defined in the OpenAPI schema and the descriptions below cover the intent and caching behaviour of each.

**Vector content endpoint** — returns the component list and configuration of one or more vectors by OCM ref. Accepts a repeatable ref parameter for batch fetches. Backed by the API server cache (Phase 2) with OCI fallback.

**Artifact content endpoint** — returns the type, tasks, resources, and reuse policy of a single artifact by OCM ref. Backed by the API server cache (Phase 2) with OCI fallback.

**Vector diff endpoint** — returns the diff between two vectors identified by their OCM refs. Both refs are fetched from the OCI registry (or cache in Phase 2). The diff computation is part of the ongoing implementation work. Because the endpoint accepts arbitrary vector refs rather than a promotion ID, the UI can request a diff between any two vectors at any point in their lifecycle, not only those involved in an active promotion.

**Authorization.** Access to these endpoints is gated by the existing project-scoped authorization, so a caller must have read access to the project identified by `projectId`. The `projectId` path parameter is validated via `resolveProjectNamespace`, which rejects requests for projects the caller is not authenticated for. Registry credentials are resolved from a single global credential secret configured at API server startup, not per-project.

**Multi-replica behaviour.** Each replica warms its cache independently. Because all cache entries are digest-keyed and OCM content is immutable, concurrent misses across replicas result in redundant fetches rather than stale reads. Cross-replica cache synchronisation is not adopted, so re-evaluate if registry call volume at scale becomes a measurable problem.

## Consequences

- `VectorOcmPort` must be promoted to a shared package before Phase 1 can start. It is currently private to `internal/vectordeployment/internal/controller/`
- The `VectorPromotion` controller acquires an OCM client dependency for the first time
- The `VectorCacheWarmer` reconciler must be registered in `setup.go` alongside the existing promotion controllers
- LRU cache size must be tuned to the expected number of distinct vector digests in flight concurrently, an undersized cache increases registry pressure rather than reducing it
- Phase 2 introduces the OCI registry as a new failure mode for API read operations, operators must be informed through release notes and Helm chart documentation
- Phase 2 requires credential secret management in the API server deployment. The env vars and OCM client wiring are already in place, Helm chart values and RBAC may still need to be added

## Open questions

- Should the cache pre-warm only vectors without an existing `VectorDeployment` (minimum viable), or eagerly warm all vectors referenced by any stage, stage version, or promotion to maximise cache hit rate across all diff and content requests?
- What LRU cache size is appropriate for the expected number of concurrent vector digests in flight? Should this be configurable via the Helm chart?
