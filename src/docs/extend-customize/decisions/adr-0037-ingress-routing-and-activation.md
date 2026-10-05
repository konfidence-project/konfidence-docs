---
id: ADR-0037
title: "Ingress routing and activation"
description: "First working replacement for the hardcoded-Gateway activation: how external traffic reaches the active vector of a stage without Konfidence owning internet ingress. Gateway API is the first analyzed option; further options (e.g. a shipped proxy) will be added."
status: accepted
date_approved: 2026-08-20
authors: [AMNKramer]
category: Architecture Pattern
impact: High
dependencies: [ADR-0005, ADR-0012, ADR-0015, ADR-0027]
pageClass: adr
outline: deep
---
# ADR-0037: Ingress routing and activation

<AdrHeader />

::: info Scope
This ADR proposes a new, working solution for activation/ingress that improves on the current mechanism. Gateway API is the first analyzed option; further options (e.g. shipping our own proxy) will be added and compared. Konfidence's ingress approach may evolve in the future — this ADR captures the solution chosen now, not a claim that it is the final architecture.
:::
## Context

External traffic must reach the **currently active vector of a stage**. The runtime mapping is:

```
request → stage (from subdomain) → active vector of that stage → service (from path) → x-vector-id injected → backend
```

Once `x-vector-id` is set at the edge, east-west service-to-service routing is already handled by deployment results; services forward the header and never re-set it.

The current implementation (ADR-0012, ADR-0015) has the activation controller create one `HTTPRoute` **per service** with hostname `<service>.<stage>.<domain>`, attached to a **hardcoded** `Gateway` (`konfidence-system/gateway`) that is backed by a hyperscaler's managed external L7 load balancer.

Problems with the current mechanism:

- **Hardcoded Gateway** name/namespace — no per-landscape configuration.
- **Konfidence owns internet-facing ingress** — routes are attached directly to the external Gateway.
- **Cloud-LB programming latency** — every route change reprograms the hyperscaler's managed load balancer (minutes; observed on a managed Google Cloud load balancer).
- **Create-only, per-`(service, vector)` HTTPRoutes** — each route is named per service and vector and is only ever created, never patched in place; a superseded route is removed only via owner-reference garbage collection when its `VectorActivation` is deleted, rather than a stable route being re-pointed on the flip.

The following constraints apply:

- No hardcoded Gateway.
- Konfidence must **not** ship an ingress controller / gateway implementation; the cluster admin provides the internet edge and forwards traffic to Konfidence.
- The `x-vector-id` header contract must be preserved for east-west.
- No TLS in scope.

(The east-west synthesized "routing" Service and its HTTPRoutes already fell away via deployment results; this ADR concerns only the north-south path into a stage.)

## Considered Solutions

### Option 1: Two-hop Gateway API (Konfidence-owned inner Gateway)

The admin owns the internet edge and forwards all traffic for their domain to a stable Konfidence `Service`. Konfidence owns an internal Gateway plus the per-stage routing rules behind it.

```
client
  → [admin] edge Gateway (internet-facing, admin's class/impl)
  → [admin] one HTTPRoute per stage: match FQDN, add header x-konfidence-stage=<stage>,
            backendRef Service/konfidence-router
  → [konfidence] Service/konfidence-router (impl-agnostic, selects the inner Gateway's pods)
  → [konfidence] inner Gateway (ClusterIP, no hostname)
  → [konfidence] per-(stage,service) HTTPRoute: match header x-konfidence-stage + path /<result-name>,
            add header x-vector-id=<active VectorDeployment name>, backendRef the deployment-result Service
  → backend workload
```

Key properties:

- Konfidence's routes **match on the `x-konfidence-stage` header + path only** — never on the external FQDN. Konfidence never learns the domain.
- The inner Gateway uses an **in-cluster** Gateway API implementation (e.g. Istio `istio` class), pinned to a `ClusterIP` Service so it is never exposed externally and never provisions a cloud LB. Its routes are programmed by the mesh control plane (istiod), not by the cloud provider.
- `Service/konfidence-router` selects the inner Gateway's pods via the standard `gateway.networking.k8s.io/gateway-name` label, so the admin's `backendRef` is implementation-agnostic.
- The inner Gateway + Service are lifecycled from the landscape's Kubernetes `DeploymentTarget` (ADR-0027).
- **Activation lifecycles the HTTPRoutes.** On each activation the controller patches (or creates) the stage's HTTPRoute so its `backendRef` points at the newly active vector's deployment-result Service and its `x-vector-id` header value carries that vector's id — a stable route re-pointed in place, not a new route per vector.

**Pros:**

- Reuses stock Gateway API; no new data-plane component to build or operate.
- Reuses an in-cluster Gateway API implementation (e.g. Istio); route changes are programmed fast enough that the activation transition time is negligible (no cloud-LB programming delay).
- Konfidence never owns internet ingress and never sees the external hostname.
- Admin's edge holds only forwarding rules; Konfidence owns all stage/vector/service logic.
- `x-vector-id` contract and east-west behaviour unchanged.

**Cons:**

- **Requires a Gateway API implementation in every landscape cluster.** Either Konfidence installs one (e.g. Istio) or the admin provides it.
- Admin edge configuration grows linearly with stages (one HTTPRoute per stage), because Gateway API cannot match on a subdomain alone. (Not necessarily a con — the per-stage forwarding rule is trivial and static and gives more control to the admin.)
- The inner Gateway must be made internal (ClusterIP) via implementation-specific configuration (differs per Gateway implementation); a naive default Gateway would provision an external LB. How this configuration (GatewayClass and annotations) is supplied — e.g. whether it is passed through the `DeploymentTarget` — is TBD.

### Option 2: Admin-owned Gateway(s)

Same header/path routing as Option 1, but the **cluster admin owns all Gateway resources** — however many they choose to configure (the two-hop setup we tried, or one, or more). Konfidence creates and lifecycles **only the per-stage HTTPRoutes**, attached to the admin's Gateway.

Rationale: correctly configuring the Gateway's generated Service — in particular making it internal (`ClusterIP`) instead of external (`LoadBalancer`) — is **not covered by the Gateway API** and differs per implementation (Istio: an annotation / `parametersRef` ConfigMap; Envoy Gateway: a separate `EnvoyProxy` CR; etc.). For Konfidence to create the Gateway generically it would have to hook in implementation-specific configuration for every supported Gateway API implementation, which is impractical. Configuring the Gateway is therefore left in the admin's domain, where it belongs.

Contract:

- The admin owns the Gateway CRs (edge + inner), typically created once per landscape (but not necessarily). Konfidence ships **examples / best practices** in the docs (e.g. one edge Gateway, one internal `konfidence-router` Gateway pinned to `ClusterIP`), but the exact topology and configuration are the admin's choice.
- The admin's edge sets the `x-konfidence-stage` header.
- Konfidence assumes by default an inner Gateway named `konfidence-router` in the landscape namespace; the **name and namespace are configurable** (e.g. via the `DeploymentTarget`) so Konfidence knows where to attach its HTTPRoutes.
- Konfidence creates and lifecycles the per-stage HTTPRoutes (match `x-konfidence-stage` + path, inject `x-vector-id`), attached to the admin's inner Gateway.

**Pros:**

- Konfidence never touches implementation-specific Gateway internals; it stays fully impl-agnostic and **cannot misconfigure exposure** (no accidental external LB originating from Konfidence).
- Clean ownership boundary matching the Gateway API role model: the cluster operator owns Gateways (data plane / exposure), the application (Konfidence) owns Routes.
- No need for Konfidence to learn per-implementation configuration knobs.

**Cons:**

- More admin setup: the admin creates and maintains the Gateway CRs (typically once per landscape).
- Still requires a Gateway API implementation present in the cluster (same as Option 1).
- Correct (internal) configuration of the inner Gateway now depends on the admin following the documented best practice.
- Depending on the topology the admin chooses, traffic may take an extra in-cluster hop (e.g. the two-hop edge → inner Gateway setup).

### Option 3: Konfidence-shipped data plane (proxy)

Konfidence ships and manages the lifecycle of its own data plane (most likely by extending an existing proxy such as Envoy, in the style of Knative's Kourier, rather than writing one from scratch), instead of relying on a Gateway API implementation being present. The admin still forwards edge traffic to a Konfidence `Service`; Konfidence programs its own proxy from stage/vector state. This also opens the door to expressing the routing intent as a **Konfidence-core CR/config** — a routing spec owned by the core and implemented by the deployers — reusable across target platforms beyond Kubernetes.

**Pros:**

- The routing spec can live in the Konfidence core: a Konfidence CR/config describes the routing rules and the deployers implement them, reusable across platforms (not just Kubernetes / Gateway API).
- Potentially far more control than Gateway API offers (behavior not expressible via `HTTPRoute`).
- No dependency on a Gateway API implementation being present in the cluster.

**Cons:**

- Konfidence must ship and manage the lifecycle of the proxy component.
- A Konfidence admin may not want the shipped proxy (licensing, feature set, bugs) and — unlike Gateway API — cannot swap in their preferred implementation.
- Significantly more effort than Option 2.

*Not yet analyzed in detail; to be expanded in a follow-up revision of this ADR.*

## Decision

Adopt **Option 2 (admin-owned Gateway(s))**.

Rationale: configuring a Gateway's exposure correctly — internal (`ClusterIP`) vs external (`LoadBalancer`) — is not part of the Gateway API and is implementation-specific, so Konfidence cannot create Gateways generically without embedding per-implementation knowledge. Leaving all Gateway CRs to the admin keeps Konfidence implementation-agnostic, removes any risk of Konfidence accidentally exposing an internal Gateway, and matches the Gateway API role model (the cluster operator owns Gateways, the application owns Routes). It is the smallest, safest step that satisfies these constraints and keeps the ADR-0012 activation lifecycle intact.

Why not the others, for now:

- **Not Option 1**, because Konfidence cannot portably pick and configure a Gateway implementation — making the generated Service internal is implementation-specific and not expressible through the Gateway API today. This is expected to change: [GEP-5093 (Gateway Address Routability)](https://gateway-api.sigs.k8s.io/geps/gep-5093/) adds a portable `routability: Cluster` request for a cluster-internal Gateway address. Once that is available and implemented, Konfidence could own the inner Gateway portably, and we could switch from Option 2 to Option 1.
- **Not Option 3**, because it is significantly more effort (shipping and operating a proxy) and imposes a fixed proxy implementation on the admin.

This remains a first working solution; Option 1 (via GEP-5093) or Option 3 may supersede it later.

### Design Decisions

1. **Ownership split.** The admin owns all Gateway CRs (however many); Konfidence owns only the per-stage HTTPRoutes.
2. **Header-based contract.** The admin's edge sets `x-konfidence-stage=<stage>`; Konfidence matches on that header + path and never sees the external FQDN.
3. **Gateway reference.** Konfidence attaches its HTTPRoutes to a Gateway referenced by name/namespace (default `konfidence-router` in the landscape namespace), configurable via the `DeploymentTarget`.
4. **Activation lifecycles the HTTPRoutes.** On each activation the controller patches (or creates) the stage's HTTPRoute in place with the active vector's deployment-result backend and `x-vector-id` header value.
5. **Gateway API implementation is a prerequisite.** It must be present in the cluster; providing/installing it is the admin's responsibility (to be revisited once GEP-5093 enables portable internal Gateways, or with Option 3).
6. **North-south exposure is opt-in (whitelist).** Only explicitly whitelisted deployment results get an ingress route; being an (east-west) deployment result does not automatically make a service internet-reachable. The stable path segment is the deployment result `Name` — the deployed Service name is Flux-suffixed and not stable. How the whitelist is expressed (its annotation/field name) is TBD.

## Open Questions

1. **What configuration does Konfidence need, and where does it live?** Likely on the Kubernetes `DeploymentTarget` (per-landscape, deployer-specific). It differs by option: Option 1 needs Gateway configuration (`gatewayClassName`, infrastructure annotations); Option 2 needs only a **reference** (name/namespace) to the admin-owned inner Gateway (default `konfidence-router` in the landscape namespace). The exact field/sub-resource is TBD.
2. **Do we also want an `x-konfidence-service` header set by the admin?** In addition to `x-konfidence-stage`, the admin's edge could set a header naming the target service (deployment result), instead of Konfidence selecting it from the URL path. Pro: enables more complex routing rules driven by the admin. Con: more complex for the admin, and would likely require Konfidence to emit n×m rules (per stage × service) instead of one per stage — still within one HTTPRoute per stage. TBD.

## Related ADRs

- **Depends on**: [ADR-0027](./adr-0027-landscape-deployment-target.md) — the `DeploymentTarget` that carries the per-landscape routing configuration (inner Gateway config, or a reference to the admin-owned Gateway).
- **Related to**: [ADR-0012](./adr-0012-activation-controller.md) — activation lifecycle retained; executor replaced.
- **Supersedes (partially)**: ADR-0015 — replaces the per-service HTTPRoute + hardcoded Gateway routing.
- **Relaxes**: [ADR-0005](./adr-0005-gateway-api-integration.md) — Gateway API is a pragmatic choice here, no longer a hard mandate.
