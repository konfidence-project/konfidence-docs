---
id: ADR-0047
title: "OCM content layer update: caching strategy revision and per-project credential resolution"
description: "Revises the ADR-0045 caching strategy from a two-phase controller+API approach to a single API server in-process cache, and replaces the global startup-time credential model with per-request and per-reconcile credential resolution scoped to the project namespace."
status: accepted
date_proposed: 2026-11-11
date_decided: 2026-11-12
authors: [AleksandarMuradyan]
category: Architecture Pattern
impact: Medium
dependencies: [ADR-0045, ADR-0028, ADR-0006, ADR-0032]
pageClass: adr
outline: deep
---

# ADR-0047: OCM content layer update - caching strategy revision and per-project credential resolution

<AdrHeader />

## Context

ADR-0045 established the OCM content layer - the API server now also exposes storage-level OCM data read directly from the OCI registry. It proposed a two-phase delivery plan and described credentials as resolved from a global secret at startup. Both of those decisions required revision before implementation could proceed.

### Caching strategy revision

ADR-0045 originally proposed Options 2+3 (controller-side LRU cache + `VectorCacheWarmer` reconciler) as Phase 1 for the diff use case, with the API server in-process cache (Option 4) as a later Phase 2. The OCI registry is a network dependency outside the cluster where latency is higher and availability is not guaranteed, so **eliminating redundant registry calls is the central engineering concern** - without a cache, every request for the same ref pays a full registry round-trip for identical bytes. The concrete use cases driving the content layer are:

**UI - vector and artifact content inspection.** Users inspect vectors and artifacts that may have no corresponding CR: browsing available versions before deploying, reviewing what a vector contains, drilling into an artifact's task graph and resource list, or comparing two arbitrary vector versions outside of an active promotion. In all these cases the registry is the only source of truth. Without a cache, every page load or view transition triggers a live registry call for data that has not changed. With a two-layer cache design, each distinct ref pays exactly one cold-miss registry call and every subsequent request across refreshes and concurrent users is served from memory. The incoming vector in a promotion diff has no `VectorDeployment` yet (one is only created after promotion executes), so a live registry call is the only way to read it.

**CLI - artifact and vector data inspection.** The CLI commands for these endpoints are not yet implemented but follow naturally from the API surface. The intended commands are:

```bash
# inspect the component list and config of a vector
kden vector content <ocmRef> --project <projectId>

# inspect the tasks, resources, and type of an artifact
kden artifact content <ocmRef> --project <projectId>

# compare two vectors
kden vector diff <leftRef> <rightRef> --project <projectId>
```

The singleflight layer is server-side and collapses concurrent in-flight requests from any combination of callers like UI tabs, CLI invocations, or background processes that arrive for the same ref at the same time. CLI usage is inherently sequential from the client side, while multiple users can hit the API in parallel through both the UI and CLI simultaneously. The LRU benefit for CLI is about not re-fetching the same ref on back-to-back commands within a short window: a user running `vector diff` and `vector content` against the same ref in the same session pays one registry call rather than two.

The two-phase plan was revised to a single phase: the controller-side pre-warm (Options 2+3) was originally the only way to keep the registry call out of the request path before the API server had its own OCM client. Once Option 4 was adopted, pre-warming only shifts *when* a registry call happens, not whether it happens. The LRU in Option 4 achieves the same result - one registry call per ref, every subsequent request served from memory - without introducing a new reconciler, promoting `VectorOcmPort` to a shared package, or adding an OCM dependency to the controller tier purely to serve the API server's read path. The latency saving from pre-warming a cold-miss (50–200 ms) is imperceptible in a workflow where the `VectorPromotion` has been sitting `Waiting` for human approval for minutes to hours (per ADR-0032).

### OCI credential problem

ADR-0045 Option 4 stated: "Registry credentials are resolved from a single global secret at API server startup, not per-project." The `VectorDeployment` controller had the same model. Both have two problems:

**Restart required on credential change.** Credentials resolved once at startup. A credential rotation or a new project pointing to a different registry requires a controller or API server restart. For teams managing multiple projects across different registries this is a significant operational burden.

**No per-project isolation.** A single global secret applies to all projects, violating the multi-tenancy model from ADR-0028 where each project operates in its own namespace with its own resources.

The `VectorTemplateReconciler` already solved this: it calls `ResolverFromCredentials` (`pkg/ocm/credentials`) on every reconcile, building a fresh resolver from `VectorTemplate.Spec.Credentials` in the project namespace. The API server now owning its own OCM client (from the Option 4 decision) makes the same per-request model straightforward for the content layer - no shared state is needed.

Both the API server and the `VectorDeployment` controller had four startup-time environment variables each - two for the credential secret location and two for comma-separated signature spec names. All eight are removed. Additionally, `setup.go` fetched the `konfidence-system/registry-credentials` Secret at startup and combined it with the environment-variable-selected secret into a single global resolver shared across all reconciles. That lookup is also removed.

## Considered options

### Option 1 - Helm chart values wiring the global secrets

Expose the existing environment variables as Helm chart values. The startup-time resolution model stays in place.

**Assessment.** Not adopted. Does not fix the restart requirement or the per-project isolation gap. Introduces Helm values that would immediately be superseded by per-request resolution, adding unnecessary churn.

### Option 2 - Per-request and per-reconcile credential resolution from the project namespace

On each API request, list `VectorTemplates` for the project namespace and call `ResolverFromCredentials` with `VectorTemplate.Spec.Credentials`. On each `VectorDeployment` reconcile, read the `konfidence.cloud/project` label from the landscape namespace, fetch the `Project` CR, and call `ResolverFromCredentials` with `Project.Spec.Credentials`. Pass the resulting resolver into the OCM client call for that operation only.

**Assessment.** Adopted. `ResolverFromCredentials` in `pkg/ocm/credentials` is already the shared abstraction used by `VectorTemplateReconciler`. The resolver is built from live Kubernetes secrets on each request or reconcile, so credential rotations and new projects propagate immediately without a restart. Credentials stay in the project namespace and are never carried through the promotion pipeline.

## Decision

### Caching strategy

**Option 4 (ADR-0045) adopted directly - single phase, no controller pre-warm.**

The three content endpoints (`getVectorContentV1`, `getArtifactContentV1`, `getVectorDiffV1`) are already shipped and make live registry calls on every request today. The remaining work is adding a two-layer cache in front of `pkg/ocm/content.Reader` so that each distinct ref pays exactly one registry call: the cold miss pays the round-trip, every subsequent request is served from memory.

**How a registry call is made** - a request arrives for a ref:

1. **LRU check** - ref already in cache, so return immediately, no network call.
2. **Singleflight** - ref not in cache, but another request for the same ref is already in-flight, so block and share that result, no second registry call.
3. **Registry call** - no in-flight call exists, so fetch from registry, write to LRU, return to all waiters.

A user checking 10 vector deployments repeatedly triggers at most 10 registry calls total - one per distinct ref on first load, regardless of how many times they refresh or how many colleagues view the same data concurrently.

**Cache key design.** Digest-keyed entries are keyed by OCI content digest (SHA-256) where the same digest always means the same bytes regardless of project or landscape, so these never expire. Tag-keyed entries are split by tag type: version tags (e.g. `1.0.0`, `v2.3.1`) follow semver and are never reassigned in practice, so they are held without TTL expiry the same as digest entries. Floating tags (e.g. `latest`, `stable`) can be reassigned and are held with a short configurable TTL to prevent serving stale content after a reassignment.

**Fallback behaviour.** The cache is an optimisation layer, not a hard dependency. All three endpoints fall back to a direct registry call on cache miss, so the system degrades to pre-cache behaviour rather than failing.

**Configuration** via Helm chart values:

- `api.ocmCache.size` - LRU capacity (default ~500 entries). An undersized cache increases registry pressure; operators with large vector catalogs should tune this up.
- `api.ocmCache.tagTTL` - TTL for tag-keyed entries (default 5 minutes). Shorter values increase registry call volume; longer values risk serving stale content after a tag reassignment.

**API surface.** Three endpoints so the UI never calls the registry directly, never computes diffs, and never coordinates cache state:

- **Vector content** - component list and configuration of one or more vectors by OCM ref. Accepts a repeatable ref parameter for batch fetches.
- **Artifact content** - type, tasks, resources, and reuse policy of a single artifact by OCM ref.
- **Vector diff** - diff between two vectors by OCM ref. Accepts arbitrary refs so the UI can compare any two vectors at any point in their lifecycle, not only those in an active promotion.

**Multi-replica behaviour.** Each replica warms its cache independently. Concurrent cold misses across replicas result in redundant fetches rather than stale reads. Cross-replica cache synchronisation is not adopted; re-evaluate if registry call volume at scale becomes a measurable problem.

### Credential resolution

**Option 2 - Per-request and per-reconcile credential resolution from the project namespace.**

#### API server

Each content request resolves the project namespace via `resolveProjectNamespace`, lists `VectorTemplates` for that namespace, and passes `VectorTemplate.Spec.Credentials` (from the first result) to `ResolverFromCredentials`. The resulting `credentials.Resolver` is used for that request's OCM client call only and no state is shared between requests. This supersedes the ADR-0045 statement that credentials are resolved from a single global secret at startup.

#### VectorDeployment controller

`Project.Spec` gains three optional fields - `credentials`, `verifyVector`, and `verifyArtifacts`. An `AdapterFactory` function is wired in `setup.go` and called on every reconcile. The factory resolves the owning project by reading the `konfidence.cloud/project` label from the landscape namespace where the `VectorDeployment` lives, fetches the `Project` CR, and calls `ResolverFromCredentials` with `project.Spec.Credentials` using secrets from the project namespace. A fresh OCM client and adapter are built and scoped to that reconcile only.

**Credential ownership.** Credentials reference secrets in the project namespace. A credential configured for one project cannot be selected or used for another, due to namespace isolation enforcing this at the Kubernetes level.

**Credential lookup scope.** `VectorTemplate.Spec.Credentials` is the authority for API content reads. `Project.Spec.Credentials` is the authority for controller-side deployment pulls.

**Anonymous access.** If `Credentials` is nil or empty, `ResolverFromCredentials` returns an unauthenticated resolver. Public registries work without any secrets.

**Credential rotation.** Rotated credentials are picked up on the next request or reconcile with no restart required.

**Signature verification.** Signature specs follow the same per-operation model: read from `Project.Spec.VerifyVector` and `Project.Spec.VerifyArtifacts` for the controller, and from `VectorTemplate.Spec` for the API server. The global signature environment variables are removed.

**RBAC.** The `VectorDeployment` controller's `ClusterRole` gains `get` on `namespaces` and `get` on `projects` to support the namespace-to-project lookup. The API server's `ClusterRole` already has `get/list/watch` on `secrets`, so no further changes are required there.

## Consequences

- `Project.Spec` gains three optional fields (`credentials`, `verifyVector`, `verifyArtifacts`). Operators set these once on the Project and they apply to all `VectorDeployment` reconciles for that project automatically.
- Each content request makes one additional Kubernetes API call to list `VectorTemplates` in the project namespace. This is consistent with how every other handler in the API server operates and does not affect the data-plane latency that the LRU cache addresses.
- Credential management is unified at the project boundary: `Project.Spec.Credentials` controls all controller-side registry access for that project; `VectorTemplate.Spec.Credentials` controls API content reads. No credential data is carried through the promotion pipeline.
- The OCI registry is a failure mode for the three content endpoints. Prior to this change, registry unavailability only affected the controller write path (artifact downloads, promotions). All other API endpoints serve Kubernetes CR state only and are unaffected by registry unavailability. Operators must be informed through release notes and Helm chart documentation.
- Cache entries are in-memory only and lost on API server restart. The first request after restart for any given ref pays the registry round-trip cost. This is acceptable as the cache is a latency optimisation and not a reliability mechanism.
