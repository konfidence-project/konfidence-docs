---
title: Expose a Service through stage ingress
description: Select a Service port for external requests routed to a stage without exposing every deployment result.
outline: deep
editLink: true
lastUpdated: true
---

# Expose a Service through stage ingress

Select one named TCP port of your Kubernetes Service for the Konfidence-managed stage route. Publishing a [deployment result](../vector-data/deployment-results.md) alone does not add an ingress rule.

## Prerequisites

Before you begin, make sure you have:

- A Service manifest in a [Helm](../artifact-types/helm.md) or [Kustomize](../artifact-types/kustomize.md) artifact.
- A landscape with [Gateway routing](../../deploy-operate/plan/gateway-routing.md) configured by your administrator, including a `gateway-route.konfidence.cloud` activation task registration.
- `kubectl` access to read `Stage`, `VectorDeployment`, and `HTTPRoute` resources in the landscape namespace.

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

Only the selected port gets an ingress rule. Other ports remain available for in-cluster calls. See [Service ingress opt-in](#service-ingress-opt-in) for defaults and validation errors.

## Publish and activate the change

Deliver the manifest change through your artifacts, rather than patching a deployed Service:

1. [Publish a new artifact version](../artifact-types/publish-artifacts.md) and [build a vector](../observe-improve/build-vectors.md) that references it.
2. Deliver that vector to the intended stage through your [promotion flow](../../deploy-operate/manage-delivery/promote-vectors.md).
3. Ask your administrator to configure the edge route with `x-konfidence-service` set to your deployment result name (`candidates` in this example) and `x-konfidence-stage` set to the target stage name. The annotation enables stage routing for the Service. It does not create an external hostname or edge route.

## Verify the result

After the target vector is active, read the stage's active `StageVersion` name. Replace the stage and namespace placeholders with your target values:

```bash
kubectl get stage <stage-name> -n <landscape-namespace> \
  -o jsonpath='{.status.activeStageVersion.name}{"\n"}'
```

The active `StageVersion` and its `VectorDeployment` share the same name and namespace. Use the returned name as `<vector-deployment-name>` below.

If the output is empty, the stage has no active version yet. Wait for activation before continuing.

```bash
kubectl get vectordeployment <vector-deployment-name> -n <landscape-namespace> -o yaml
kubectl get httproute konfidence-stage-<stage-name> -n <landscape-namespace> -o yaml
```

The `candidates` deployment result has `spec.IngressExposedPortName: http`. The stage route has a rule matching `x-konfidence-service: candidates` with the deployed Service's name and backend port `80`. An unselected Service has no rule.

## Remove ingress exposure

If no deployment result selects an exposed port, the next gateway-route activation removes any existing stage `HTTPRoute` and succeeds. It does not delete workloads, Services, or administrator-owned Gateways and edge routes.

To stop routing ingress traffic to a Service, remove `konfidence.cloud/exposed-port-name` from its artifact manifest, then publish and deliver a new vector. Keep `konfidence.cloud/deployment-result` if other components still need to discover the Service.

## Service ingress opt-in

The Kubernetes deployer reads the following annotations from each Service it deployed:

| Annotation | Value | Effect |
| --- | --- | --- |
| `konfidence.cloud/deployment-result` | A nonempty stable result name. | Publishes an `http-k8s-service` deployment result for in-cluster discovery. Required for stage ingress selection. |
| `konfidence.cloud/exposed-port-name` | The exact name of one TCP port in `spec.ports`. | Adds `IngressExposedPortName` to the deployment-result spec. The gateway-route activation creates a rule for that selected port. |

An absent or empty `konfidence.cloud/exposed-port-name` annotation produces no ingress rule, even for a Service with one port. If a Service has no deployment result name, the deployer ignores it and its exposure annotation.

The exposure annotation selects a Service port by `name`, not by its position, port number, or `targetPort`. You can select only one port per Service. All Service ports remain in the deployment result for in-cluster callers.

An invalid selection sets `DeploymentResultCreated=False`, `Ready=False`, and `Stalled=True` on the `ArtifactDeployment`. Its conditions report one of these reasons:

| Reason | Meaning |
| --- | --- |
| `ExposePortNotFound` | No Service port has the exact annotated name. |
| `ExposePortUnsupportedProtocol` | The selected port does not use TCP. |

If no result selects a port, the gateway-route activation removes any existing stage `HTTPRoute` and succeeds. Services and workloads remain deployed.
