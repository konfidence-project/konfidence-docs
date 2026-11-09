---
title: Expose a Service through stage ingress
description: Select a Service port for external requests routed to a stage without exposing every deployment result.
outline: deep
editLink: true
lastUpdated: true
---

# Expose a Service through stage ingress

Opt one named TCP port of your Kubernetes Service into the Konfidence-managed stage route. Publishing a [deployment result](../vector-data/deployment-results.md) alone does not add an ingress rule.

::: warning Version requirement
The Kubernetes landscape orchestrator release `0.1.0-alpha.1` does not support this annotation. Use a build that includes [Service port exposure](https://github.com/konfidence-project/kubernetes-landscape-orchestrator/pull/88).
:::

## Prerequisites

Before you begin, make sure you have:

- A Service manifest in a [Helm](../artifact-types/helm.md) or [Kustomize](../artifact-types/kustomize.md) artifact.
- A landscape with [Gateway routing](../../deploy-operate/plan/gateway-routing.md) configured by your administrator, including a `gateway-route.konfidence.cloud` activation task registration.
- `kubectl` access to read `VectorDeployment` and `HTTPRoute` resources in the landscape namespace.

## Select the exposed port

Edit the Service manifest in your artifact:

1. Set `konfidence.cloud/deployment-result` to the stable name clients use to select the Service.
2. Set `konfidence.cloud/exposed-port-name` to the name of the TCP port in `spec.ports`, not its port number or `targetPort`.

For example, this Service selects its `http` port for stage ingress:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: candidates
  annotations:
    konfidence.cloud/deployment-result: candidates
    konfidence.cloud/exposed-port-name: http
spec:
  selector:
    app: candidates
  ports:
    - name: http
      port: 80
      targetPort: http
```

Only the selected port gets an ingress rule. Other ports remain available for in-cluster calls. See the [Service ingress annotation reference](../../deploy-operate/install/deployer/kubernetes.md#service-ingress-opt-in) for defaults and validation errors.

## Publish and activate the change

Deliver the manifest change through your artifacts, rather than patching a deployed Service:

1. [Publish a new artifact version](../artifact-types/publish-artifacts.md) and [build a vector](../observe-improve/build-vectors.md) that references it.
2. Deliver that vector to the intended stage through your [promotion flow](../../deploy-operate/manage-delivery/promote-vectors.md).
3. Ask your administrator to configure the edge route with `x-konfidence-service: candidates` and the target stage's `x-konfidence-stage` value. The annotation opts the Service into stage routing; it does not create an external hostname or edge route.

## Verify the result

Replace the placeholders with the active vector deployment, stage, and landscape namespace:

```bash
kubectl get vectordeployment <vector-deployment-name> -n <landscape-namespace> -o yaml
kubectl get httproute konfidence-stage-<stage-name> -n <landscape-namespace> -o yaml
```

The `candidates` deployment result has `spec.IngressExposedPortName: http`. The stage route has a rule matching `x-konfidence-service: candidates` with the deployed Service's name and backend port `80`. An unselected Service has no rule.

## Remove ingress exposure

If no deployment result selects an exposed port, the next gateway-route activation removes any existing stage `HTTPRoute` and succeeds. It does not delete workloads, Services, or administrator-owned Gateways and edge routes.

To stop routing ingress traffic to a Service, remove `konfidence.cloud/exposed-port-name` from its artifact manifest, then publish and deliver a new vector. Keep `konfidence.cloud/deployment-result` if other components still need to discover the Service.
