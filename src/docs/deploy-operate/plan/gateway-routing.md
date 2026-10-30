---
title: Gateway routing
description: Understand how Konfidence routes external requests to a stage and what your Gateway API setup must provide.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Gateway routing

Konfidence routes every request for a [stage](../../reference/glossary.md#stage) to the stage's active vector. This applies to stages that the [Kubernetes deployer](../install/deployer/kubernetes.md) deploys.

As the cluster administrator, you provide the gateways that external requests enter through. This guide explains how Konfidence uses those gateways and describes what you set up.

## How the two-gateway architecture works

Konfidence keeps one HTTPRoute per stage. On each activation, it re-points that route at the newly active vector's deployment result Services. Clients keep the same address while the vector behind it changes.

Konfidence attaches these routes to Gateways that you create. Whether a Gateway is reachable from outside or only inside the cluster depends on the Gateway API implementation. Konfidence leaves the Gateways to you so that it never exposes an internal Gateway by accident.

Konfidence creates and updates these routes only if the `gateway-route.konfidence.cloud` activation task is registered in the landscape namespace. Without the registration, activations succeed but no route exists.

A request passes two Gateways:

```text
client
  → edge Gateway            (yours, reachable from outside)
      HTTPRoute per stage   (yours): match the hostname and path,
                            set x-konfidence-stage: <stage>
                            set x-konfidence-service: <deployment-result-name>
  → konfidence-router       (yours, cluster-internal, one per landscape namespace)
      HTTPRoute per stage   (Konfidence): match x-konfidence-stage
                            and x-konfidence-service
  → deployment result Service of the active vector
```

The two headers select the target. `x-konfidence-stage` selects the stage, and `x-konfidence-service` selects the deployment result within it. You choose the external hostnames and paths in your edge routes. Konfidence matches only the two headers, so any hostname and path scheme works.

## Your setup provides five things

Any Gateway API implementation works if your setup provides the following. [Set up Envoy Gateway](../install/deployer/kubernetes/envoy-gateway.md) covers each item. For another implementation, use this list as the contract.

1. **Activation task registration per landscape:** Create an `ActivationTaskRegistration` of type `gateway-route.konfidence.cloud` in each [landscape](../../reference/glossary.md#landscape) namespace. Konfidence attaches routes only for registered landscapes.
2. **Inner Gateway per landscape:** Create a Gateway named `konfidence-router` in each landscape namespace. Konfidence attaches its routes there.
3. **Cluster-internal inner Gateway:** Make `konfidence-router` reachable only from inside the cluster. A client that reaches it directly can set `x-konfidence-stage` and `x-konfidence-service` itself and select any stage. [GEP-5093](https://gateway-api.sigs.k8s.io/geps/gep-5093/) adds `routability: Cluster` to Gateway addresses for this. Use it if your implementation supports it. Otherwise, pin the Service of `konfidence-router` to `ClusterIP` the way your implementation provides. In both cases, restrict traffic between the edge and the inner Gateways with NetworkPolicies.
4. **Stage and service headers at the edge:** For each stage that you want to expose, set `x-konfidence-stage` to the stage name. Set `x-konfidence-service` to the deployment result name. Use `set`, not `add`, so that client-supplied values are overwritten. Then forward the request to `konfidence-router`.
5. **ReferenceGrant per landscape namespace:** Your edge routes live in another namespace. Allow them to reference the `konfidence-router` Service.

Konfidence creates one HTTPRoute per stage, named `konfidence-stage-<stage>`. It has one rule per [deployment result](../../reference/glossary.md#deployment-result) of type `http-k8s-service`. A rule matches `x-konfidence-stage: <stage>` and `x-konfidence-service: <deployment-result-name>`. It removes both headers before it forwards the request.

To attach the routes to a different Gateway, set `gatewayName` and `gatewayNamespace` in the `spec.spec` of the registration. They default to `konfidence-router` and the landscape namespace.

<!-- TODO(konfidence maintainers): verify the release that ships the gateway-route.konfidence.cloud activation (kubernetes-landscape-orchestrator PR #79). -->

## Konfidence can provision konfidence-router for you

Instead of creating `konfidence-router` yourself, you can let Konfidence provision it. Set `gatewayClassName` in the `spec.spec` of the registration:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: ActivationTaskRegistration
metadata:
  name: gateway-route
  namespace: <LANDSCAPE_NAMESPACE>
spec:
  type: gateway-route.konfidence.cloud
  spec:
    gatewayClassName: <GATEWAY_CLASS>
```

Konfidence then creates a cluster-internal `konfidence-router` in the landscape namespace. You still provide the ReferenceGrant and the edge routes. Provisioning needs the Gateway API experimental-channel CRDs of v1.7.0 or later. Your Gateway API implementation must support [GEP-5093](https://gateway-api.sigs.k8s.io/geps/gep-5093/).

[ADR-0043](../../extend-customize/decisions/adr-0043-provision-konfidence-router.md) explains how Konfidence keeps the provisioned Gateway internal.

<!-- TODO(konfidence maintainers): verify the release that ships Gateway provisioning (kubernetes-landscape-orchestrator PR #87), and which Gateway API implementations honour routability: Cluster. -->

## Envoy Gateway has a step-by-step guide

To install this setup with Envoy Gateway, follow [Set up Envoy Gateway](../install/deployer/kubernetes/envoy-gateway.md).
