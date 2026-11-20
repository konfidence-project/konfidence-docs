---
title: "Service results on Kubernetes"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Service results on Kubernetes

The Kubernetes deployer publishes Service information for discovery and stage ingress. This reference explains the annotations and deployment results.

## How deployment results work

By default, the Services in your bundle or chart are internal. To let other components in the same [vector](../../reference/glossary.md#vector) discover and call a Service, annotate it:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: candidates
  annotations:
    konfidence.cloud/deployment-result: candidates
spec:
  ports:
    - name: http
      port: 80
```

### Why the annotation is required

The deployer applies a per-vector `nameSuffix` (Kustomize) or `releaseName` (Helm). The Service's deployed name is therefore unknown ahead of time, and a caller cannot hard-code it. The annotation makes the Service discoverable and supplies the **stable name** (its value) that consumers look up. Services without the annotation do not produce deployment results.

### How the deployer processes the annotation

After the [artifact](../../reference/glossary.md#artifact) is deployed, the deployer lists the Services it created. For each Service carrying the annotation, it records a deployment result on the `ArtifactDeployment` containing:

- The annotation value as the result name.
- The Service's namespace and its actual (suffixed) name.
- The Service's ports verbatim (multi-port Services are supported as-is).

Konfidence aggregates these into the vector's [`VectorData`](../../reference/glossary.md#vector-data), keyed by artifact component. Every component in the vector can then resolve the Service by its stable name at runtime. See [Use deployment results](./deployment-results.md).

### Scope

Only Kubernetes `Service` objects can be exposed this way today (deployment-result type `http-k8s-service`). Other resource kinds are not yet supported.

### Service ingress opt-in

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

If no result selects a port, the gateway-route activation removes any existing stage `HTTPRoute` and succeeds. Services and workloads remain deployed. For step-by-step instructions, see [Expose a Service through stage ingress](./expose-service.md).


## Related guides

- [Install the Kubernetes deployer](./install.md)
- [Use deployment results](./deployment-results.md)
