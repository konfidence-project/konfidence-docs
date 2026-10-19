---
title: Route external traffic to stages
description: Prepare your Gateway API setup so Konfidence can route external requests to a stage.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Route external traffic to stages

Konfidence routes every request for a [stage](../../../../reference/glossary.md#stage) to the stage's active vector. This applies to stages that the [Kubernetes deployer](../kubernetes.md) deploys. As the cluster administrator, you provide the Gateways that requests enter through. This page lists what those Gateways must provide.

## Konfidence switches each stage to its active vector

Konfidence keeps one HTTPRoute per stage. On each activation, it re-points that route at the newly active vector's deployment result Services. Clients keep the same address while the vector behind it changes.

Konfidence attaches these routes to Gateways that you create. Whether a Gateway is reachable from outside or only inside the cluster depends on the Gateway API implementation. The Gateway API has no portable setting for it. Konfidence leaves the Gateways to you so that it never exposes an internal Gateway by accident. [ADR-0037](../../../../extend-customize/decisions/adr-0037-ingress-routing-and-activation.md) records this decision.

A request passes two Gateways:

```text
client
  → edge Gateway            (yours, reachable from outside)
      HTTPRoute per stage   (yours): match the hostname,
                            set x-konfidence-stage: <stage>
  → konfidence-router       (yours, cluster-internal, one per landscape namespace)
      HTTPRoute per stage   (Konfidence): match x-konfidence-stage
                            and the path /<deployment-result-name>
  → deployment result Service of the active vector
```

You choose the external hostnames in your edge routes. Konfidence matches only the `x-konfidence-stage` header and the request path, so any hostname scheme works.

## Your setup provides four things

Any Gateway API implementation works if your setup provides the following:

1. **Inner Gateway per landscape:** Create a Gateway named `konfidence-router` in each [landscape](../../../../reference/glossary.md#landscape) namespace. Konfidence attaches its routes there.
2. **Cluster-internal inner Gateway:** Pin the Service of `konfidence-router` to `ClusterIP`. The Gateway API cannot express this, so every implementation configures it differently.
3. **Stage header at the edge:** For each stage, set `x-konfidence-stage` to the stage name. Then forward the request to `konfidence-router`.
4. **ReferenceGrant per landscape namespace:** Your edge routes live in another namespace. Allow them to reference the `konfidence-router` Service.

Konfidence creates one HTTPRoute per stage, named `konfidence-stage-<stage>`. It has one rule per [deployment result](../../../../reference/glossary.md#deployment-result). A rule matches the request path `/<deployment-result-name>` or the header `x-konfidence-service: <deployment-result-name>`.

<!-- TODO(konfidence maintainers): verify the release that ships the gateway-route.konfidence.cloud activation (kubernetes-landscape-orchestrator PR #79), and document where to override the Gateway name and namespace. -->

## Pick the guide for your gateway

| Gateway API implementation | Guide |
| --- | --- |
| Envoy Gateway | [Route traffic to stages with Envoy Gateway](./envoy-gateway.md) |
