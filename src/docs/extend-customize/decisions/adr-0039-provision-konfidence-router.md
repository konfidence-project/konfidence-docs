---
id: ADR-0039
title: "Provision a cluster-internal konfidence-router through GEP-5093"
description: "Konfidence provisions konfidence-router on request. It attaches routes only once the Gateway reports a cluster-internal address."
status: proposed
date_proposed: 2026-10-21
authors: [nirnanaaa]
category: Architecture Pattern
impact: Medium
dependencies: [ADR-0037, ADR-0027]
pageClass: adr
outline: deep
---

# ADR-0039: Provision a cluster-internal konfidence-router through GEP-5093

<AdrHeader />

## Context

[ADR-0037](./adr-0037-ingress-routing-and-activation.md) chose Option 2: the cluster admin owns every Gateway, and Konfidence owns only the per-stage HTTPRoutes.
The reason was portability.
Making a Gateway cluster-internal needed implementation-specific configuration, so Konfidence could not create the inner Gateway without knowing each implementation.
ADR-0037 expected [GEP-5093 (Gateway Address Routability)](https://gateway-api.sigs.k8s.io/geps/gep-5093/) to lift this restriction.

GEP-5093 is now part of the Gateway API:

- Gateway API v1.7.0-rc.1 adds `routability` to `spec.addresses[]` and `status.addresses[]` of a Gateway.
- The value `Cluster` requests a ClusterIP address that is reachable only from inside the cluster.
- The field belongs to the experimental channel. On a cluster with the standard-channel CRDs, the API server prunes it without an error.
- The feature has Extended support. An implementation may ignore the request and assign its default address.

The inner Gateway is security-relevant.
Konfidence routes by the `x-konfidence-stage` and `x-konfidence-service` headers.
A client that reaches `konfidence-router` directly can set both headers itself and select any stage.

Setting up `konfidence-router` per landscape is the step admins get wrong most often in the current setup.
Each implementation needs its own way to pin the Service to `ClusterIP`.

## Considered options

### Option A: keep ADR-0037 unchanged

The admin keeps creating `konfidence-router` in every landscape namespace.

- Konfidence never creates a Gateway and cannot expose one by accident.
- Every admin still learns the implementation-specific way to make the Gateway internal.

### Option B: Konfidence always provisions konfidence-router

Konfidence creates `konfidence-router` with `routability: Cluster` in every landscape namespace.

- Admins need no per-landscape Gateway setup.
- Clusters without experimental-channel CRDs, or with an implementation that ignores routability, cannot run stage routing.
- Admins who already run their own `konfidence-router` lose control over it.

### Option C: Konfidence provisions konfidence-router on request and fails closed

Konfidence provisions `konfidence-router` only when the landscape's activation task registration sets a `gatewayClassName` and no admin Gateway exists.
It attaches routes only after it has verified that the Gateway is cluster-internal.

- Option 2 stays the default. Existing setups keep working without changes.
- Admins on an implementation with GEP-5093 support skip the per-landscape Gateway setup.
- Konfidence must verify the address itself, because the implementation may ignore the request.

## Decision

Adopt Option C.

### Design decisions

1. **Opt-in per landscape.** The `gateway-route.konfidence.cloud` registration takes `gatewayClassName`. Without it, Konfidence behaves as ADR-0037 describes.
2. **The admin's Gateway wins.** Konfidence never provisions a Gateway in these cases:
   - The registration sets `gatewayName` or `gatewayNamespace`.
   - A `konfidence-router` without the label `app.kubernetes.io/managed-by: konfidence` exists. Konfidence uses that Gateway and never modifies it.
3. **Provisioned shape.** The provisioned Gateway has these properties:
   - Its name is `konfidence-router`, and it lives in the landscape namespace.
   - It carries the label `app.kubernetes.io/managed-by: konfidence`.
   - It has one HTTP listener on port 80.
   - It has one address with `routability: Cluster`.
4. **Fail closed on pruning.** Konfidence reads the Gateway back after it creates it. If `routability` is missing, the cluster runs the standard-channel CRDs, and Konfidence deletes the Gateway at once. The activation fails with a message that names the missing CRDs.
5. **Fail closed on unsupported implementations.** Konfidence attaches routes only when `status.addresses[]` is not empty and every entry reports `routability: Cluster`. Until then, the activation retries.
6. **Gateway lifecycle.** The provisioned Gateway belongs to the landscape, not to a stage. Deleting a stage does not delete it.

ADR-0037 stays accepted.
This record extends it with a second way to provide the inner Gateway.

## Consequences

- **Prerequisites for provisioning:** The cluster runs the Gateway API experimental-channel CRDs of v1.7.0 or later. The implementation supports the `GatewayAddressRoutabilityCluster` feature.
- **Pre-release dependency:** The kubernetes-landscape-orchestrator depends on Gateway API v1.7.0-rc.1, which requires Go 1.27.1. It moves to v1.7.0 once the Gateway API project releases it.
- **Open: implementation support.** `TODO(maintainers): verify` which Gateway API implementations honour `routability: Cluster`. On an implementation that ignores it, routes never attach to a provisioned Gateway.
- **No automatic cleanup.** Nothing deletes a provisioned Gateway when its landscape goes away. The admin deletes it.
- **Admin RBAC change:** The kubernetes-landscape-orchestrator needs permission to create and delete Gateways.

## Related decisions

- **Extends**: [ADR-0037](./adr-0037-ingress-routing-and-activation.md): adds Konfidence-provisioned inner Gateways next to admin-owned ones.
- **Depends on**: [ADR-0027](./adr-0027-landscape-deployment-target.md): the landscape namespace and `DeploymentTarget` that the provisioned Gateway belongs to.
