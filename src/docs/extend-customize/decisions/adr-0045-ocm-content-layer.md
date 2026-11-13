---
id: ADR-0045
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

# ADR-0045: OCM Content Layer - Exposing storage-level OCM data through the Konfidence API

<AdrHeader />

## Context

Previously the Konfidence API only exposed in-cluster deployment state: what is deployed, where, and in what configuration. All of that data lives in Kubernetes CRs and the API server reads it directly from the control plane without ever touching the OCI registry.

**This ADR crosses a new boundary: the API now also exposes storage-level OCM data.** Vector descriptors and artifact manifests are read directly from the OCI registry and served through the API. The OCI registry is a network dependency outside the cluster where latency is higher and availability is not guaranteed, so **eliminating redundant registry calls is the central engineering concern.** Without a cache, every request for the same ref pays a full registry round-trip for identical bytes.

The concrete use cases that drive this are:

**UI — vector and artifact content inspection.** Users inspect vectors and artifacts that may have no corresponding CR and browsing available versions before deploying, reviewing what a vector contains, drilling into an artifact's task graph and resource list, or comparing two arbitrary vector versions outside of an active promotion. In all these cases the registry is the only source of truth. Without a cache, every page load or view transition triggers a live registry call for data that hasn't changed. With a two-layer cache design, each distinct ref pays exactly one cold-miss registry call and every subsequent request across refreshes and concurrent users is served from memory. The incoming vector in a promotion diff has no `VectorDeployment` yet (one is only created after promotion executes), so a live registry call is the only way to read it.

**CLI — artifact and vector data inspection.** The CLI commands for these endpoints are not yet implemented but follow naturally from the API surface. The intended commands are:

```
# inspect the component list and config of a vector
kden vector content <ocmRef> --project <projectId>

# inspect the tasks, resources, and type of an artifact
kden artifact content <ocmRef> --project <projectId>

# compare two vectors
kden vector diff <leftRef> <rightRef> --project <projectId>
```

The singleflight layer is server-side and collapses concurrent in-flight requests from any combination of callers including UI tabs, CLI invocations, or background processes that arrive for the same ref at the same time. CLI usage is inherently sequential from the client side, while multiple users can hit the API in parallel through both the UI and CLI simultaneously. The LRU benefit for CLI is about not re-fetching the same ref on back-to-back commands within a short window. For example, a user running `vector diff` and `vector content` against the same ref in the same session pays one registry call rather than two.

## Considered options

### Option 1 - CR storage + API endpoint

Expose content already stored on CRs (`VectorDeployment.Status.ResolvedVectorOcm`, `ArtifactDeployment.Spec.Component.Resources`, `VectorData`) through new API endpoints, falling back to a live registry fetch for content not covered by a live CR.

**Assessment.** Not adopted. etcd is not a content store and storing large JSON blobs in `status` fields misuses Kubernetes API machinery and the 1.5 MB per-object hard limit is a concrete blocker as vector size grows. The option also leaves the diff incoming side unaddressed. The CR fields remain useful as internal data sources but are not the right primary content layer.

### Option 2+3 - Controller-side LRU cache + diff pre-warm

A `VectorCacheWarmer` reconciler watches `VectorPromotion` objects and pre-fetches referenced vectors in the background, populating a controller-side LRU cache before the user requests a diff.

**Assessment.** Moving forward with the implementation where the API server has a OCM client. Without that change, moving the registry call into the controller background was the only way to keep it out of the request path.

More importantly, pre-warming does not reduce total registry call volume, but it only shifts *when* the call happens. The LRU in Option 4 achieves the same result: one registry call per ref, every subsequent request served from memory. The pre-warm only saves the latency of the very first cold-miss request, which costs 50–200 ms in a workflow where the `VectorPromotion` has been sitting `Waiting` for human approval for minutes to hours (per ADR-0032). That saving is imperceptible in a UI context and does not justify introducing a new reconciler, promoting `VectorOcmPort` to a shared package, and adding an OCM dependency to the controller tier purely to serve the API server's read path.

### Option 4 - API server in-process cache

The API server caches OCM responses in-process. All three use cases are served through a single code path via `pkg/ocm/content.Reader`.

**Mutable references vs immutable digests.** Digest-keyed entries are immutable and held without TTL expiry. Tag-keyed entries carry a short configurable TTL to prevent serving stale content after a tag reassignment.

**Credentials.** Registry credentials are read from the Kubernetes secret referenced by `KONFIDENCE_API_CREDENTIALS_SECRET_NAME` and `KONFIDENCE_API_CREDENTIALS_SECRET_NAMESPACE`. See [#393](https://github.com/konfidence-project/konfidence/issues/393) for the credential propagation design.

**Assessment.** Adopted. Covers both use cases without controller coupling, without promoting internal packages, and without a new reconciler. The OCM client and all three content endpoints are already shipped.

### Option 5 - Database storage

Store vector descriptors and artifact manifests in PostgreSQL. Content survives restarts and is shared across replicas.

**Assessment.** Deferred. OCM is the intended primary storage layer, so a parallel database store would duplicate that responsibility and create a synchronisation problem. Re-evaluate if historical content queries become a hard requirement the OCI registry cannot satisfy.

## Decision

**Option 4 — API server in-process cache.**

The three content endpoints (`getVectorContentV1`, `getArtifactContentV1`, `getVectorDiffV1`) are already shipped and make live registry calls on every request today. The remaining work is adding a two-layer cache in front of `pkg/ocm/content.Reader` so that each distinct ref pays exactly one registry call where the cold miss and every subsequent request is served from memory.

**How a registry call is made** — a request arrives for a ref:

1. **LRU check** — ref already in cache → return immediately, no network call.
2. **Singleflight** — ref not in cache, but another request for the same ref is already in-flight → block and share that result, so no second registry call.
3. **Registry call** — no in-flight call exists → fetch from registry, write to LRU, return to all waiters.

The only time the registry is called is when the LRU misses **and** no other goroutine is already fetching the same ref. For instance, a user checking 10 vector deployments repeatedly triggers at most 10 registry calls total, one per distinct ref on first load and regardless of how many times they refresh or how many colleagues are looking at the same views.

**Cache key design.** Digest-keyed entries are keyed by OCI content digest (SHA-256), so the same digest always means the same bytes regardless of project or landscape, so these never expire. Tag-keyed entries are keyed by their full ref string and held with a short TTL.

**Fallback behaviour.** The cache is an optimisation layer, not a hard dependency. All three endpoints fall back to a direct registry call on cache miss, so the system degrades to pre-cache behaviour rather than failing.

**Configuration** via Helm chart values:

- `api.ocmCache.size` — LRU capacity (default ~500 entries). An undersized cache increases registry pressure rather than reducing it, so operators with large vector catalogs should tune this up.
- `api.ocmCache.tagTTL` — TTL for tag-keyed entries (default 5 minutes). Shorter values increase registry call volume while longer values risk serving stale content after a tag reassignment.

**API surface.** Three endpoints so the UI never calls the registry directly, never computes diffs, and never coordinates cache state:

- **Vector content** — component list and configuration of one or more vectors by OCM ref. Accepts a repeatable ref parameter for batch fetches.
- **Artifact content** — type, tasks, resources, and reuse policy of a single artifact by OCM ref.
- **Vector diff** — diff between two vectors by OCM ref. Accepts arbitrary refs so the UI can compare any two vectors at any point in their lifecycle, not only those in an active promotion.

**Authorization.** Gated by existing project-scoped authorization via `resolveProjectNamespace`. Registry credentials are resolved from a single global secret at API server startup, not per-project.

**Multi-replica behaviour.** Each replica warms its cache independently. Concurrent cold misses across replicas result in redundant fetches rather than stale reads. Cross-replica synchronisation is not adopted, this could be re-evaluated if registry call volume at scale becomes a measurable problem.

## Consequences

- The OCI registry is now a failure mode for the three content endpoints (`getVectorContentV1`, `getArtifactContentV1`, `getVectorDiffV1`). All other API endpoints continue to serve Kubernetes CR state only and are unaffected by registry unavailability. Prior to this change, registry unavailability only affected the controller write path (artifact downloads, promotions). Operators must be informed through release notes and Helm chart documentation.
- The OCM client and the three content endpoints are already shipped. Remaining work: cache layer implementation in `pkg/ocm/content/`, Helm chart values (`api.ocmCache.size`, `api.ocmCache.tagTTL`), and per-request credential resolution from `VectorTemplate.Spec.Credentials` in the project namespace witch is the same model the controller tier already uses via `ResolverFromCredentials` in `pkg/ocm/credentials`.
- Cache entries are in-memory only and lost on API server restart. The first request after restart for any given ref pays the registry round-trip cost. This is acceptable as the cache is a latency optimisation and not a reliability mechanism.
