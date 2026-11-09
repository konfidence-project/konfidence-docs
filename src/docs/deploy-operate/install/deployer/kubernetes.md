---
title: Install the Kubernetes deployer
description: Install and verify the Kubernetes deployer, then use its target parameters, artifact formats, and deployment results.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install the Kubernetes deployer {#kubernetes-deployer}

Install the Kubernetes [deployer](../../../reference/glossary.md#deployer) to deliver Helm and Kustomize artifacts to Kubernetes through Flux. 
It supports the artifact types `helm.konfidence.cloud` and `kustomize.konfidence.cloud` and is the reference implementation of Konfidence's deployer interface.
See the [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md) for the control plane contract.

After installation, use the target parameters on this page to configure targets in your landscapes. 
The later sections describe supported artifact types and Service [deployment results](../../../reference/glossary.md#deployment-result). 
For packaging and naming requirements, see [Author a Helm artifact](../../../develop-integrate/artifact-types/helm.md) or [Author a Kustomize artifact](../../../develop-integrate/artifact-types/kustomize.md).

## Prerequisites

- [Konfidence installed](../konfidence-installation.md) in the cluster, including the listed Flux prerequisites.
- Helm and `kubectl` access with permission to install the chart and its resources.

## Install the deployer

The deployer ships as the Helm chart `kubernetes-landscape-orchestrator`. Install it into the Konfidence namespace:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_NAMESPACE=konfidence-system

helm upgrade --install kubernetes-landscape-orchestrator oci://ghcr.io/konfidence-project/charts/kubernetes-landscape-orchestrator \
  --version "$KONFIDENCE_VERSION" \
  --namespace "$KONFIDENCE_NAMESPACE" \
  --create-namespace \
  --set image.repository=ghcr.io/konfidence-project/kubernetes-landscape-orchestrator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --wait
```

## Verify the installation

Verify that the deployer is running:

```bash
kubectl get deployment kubernetes-landscape-orchestrator -n "$KONFIDENCE_NAMESPACE"
```

The deployment should show one available replica. 
The supported types are `helm.konfidence.cloud` and `kustomize.konfidence.cloud`. 
Every chart value is listed in the [Helm values reference](../../../reference/helm-values-orchestrator.md). 
[Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) configures destinations for these types.

## Target parameters

A [deployment target](../../manage-delivery/deployment-targets.md) sets `spec.artifactType` to one of the supported types. 
Omitted `spec.parameters` configures deployment to the cluster where the deployer runs. 
For a remote cluster, `spec.parameters` references a secret in the landscape namespace that contains a kubeconfig.

::: warning Remote targets are work in progress
Use targets with empty parameters to deploy into the local cluster. 
Remote targets can validate a kubeconfig and become `Ready`, but deployment of all resources to the remote cluster is not yet complete.
:::

An in-cluster target needs no parameters:

```yaml
kind: DeploymentTarget
spec:
  artifactType: helm.konfidence.cloud
```

A remote target references a secret in the landscape namespace. 
The deployer reads the kubeconfig from the key `value` or `value.yaml`, the keys Flux uses:

```bash
kubectl create secret generic prod-eu-kubeconfig \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --from-file=value="$HOME/.kube/prod-eu.yaml"
```

```yaml
kind: DeploymentTarget
spec:
  artifactType: helm.konfidence.cloud
  parameters:
    apiGroup: ""
    kind: Secret
    name: prod-eu-kubeconfig
```

The deployer validates target parameters and reports the result in the `Ready` condition:

| Reason | Meaning |
| --- | --- |
| `Accepted` | The target passed validation. |
| `InvalidParameters` | Parameters do not identify a Kubernetes secret containing a kubeconfig. |
| `ValidationError` | The deployer could not complete validation, for example because the referenced secret could not be read. |

Pulling artifacts from private registries needs a secret in the landscape namespace as well. See [Connect artifact registries](../connect-registries.md#give-the-deployer-credentials).

## Supported artifact types

The `.spec.artifactType` on an [`ArtifactDeployment`](../../../reference/glossary.md#artifactdeployment) selects the deployer. 
The following table lists its supported types, their Open Component Model (OCM) resource types, and the Flux resources created:

| Artifact type | OCM resource type | Flux resources created |
| :--- | :--- | :--- |
| `kustomize.konfidence.cloud` | `kustomize` | `OCIRepository` (source) and `Kustomization` (`kustomize.toolkit.fluxcd.io`) |
| `helm.konfidence.cloud` | `helmChart` | `HelmRepository` (source) and `HelmRelease` (`helm.toolkit.fluxcd.io`) |

An `ArtifactDeployment` whose `spec.artifactType` does not match either value is ignored by this deployer.

Each `ArtifactDeployment` must carry at most one OCM resource of the matching type. Deployments with more than one matching resource are rejected with `[Ready=False] MultipleKustomizeResources` (Kustomize path) or `[Ready=False] MultipleHelmChartResources` (Helm path). Deployments with zero matching resources produce no Flux resources.

## How deployment results work

By default, the Services in your bundle or chart are internal. To let other components in the same [vector](../../../reference/glossary.md#vector) discover and call a Service, annotate it:

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

The deployer applies a per-vector `nameSuffix` (Kustomize) or `releaseName` (Helm), so the Service's deployed name is not known ahead of time and a caller cannot hard-code it. The annotation makes the Service discoverable and supplies the **stable name** (its value) that consumers look up. Services without the annotation do not produce deployment results.

### How the deployer processes the annotation

After the [artifact](../../../reference/glossary.md#artifact) is deployed, the deployer lists the Services it created. For each Service carrying the annotation, it records a deployment result on the `ArtifactDeployment` containing:

- The annotation value as the result name.
- The Service's namespace and its actual (suffixed) name.
- The Service's ports verbatim (multi-port Services are supported as-is).

Konfidence aggregates these into the vector's [`VectorData`](../../../reference/glossary.md#vector-data), keyed by artifact component. Every component in the vector can then resolve the Service by its stable name at runtime. See [Use deployment results](../../../develop-integrate/vector-data/deployment-results.md).

### Scope

Only Kubernetes `Service` objects can be exposed this way today (deployment-result type `http-k8s-service`). Other resource kinds are not yet supported.

### Service ingress opt-in

The Kubernetes deployer reads the following annotations from each Service it deployed:

| Annotation | Value | Effect |
| --- | --- | --- |
| `konfidence.cloud/deployment-result` | A nonempty stable result name. | Publishes an `http-k8s-service` deployment result for in-cluster discovery. Required for stage ingress selection. |
| `konfidence.cloud/exposed-port-name` | The exact name of one TCP port in `spec.ports`. | Adds `IngressExposedPortName` to the deployment-result spec. The gateway-route activation creates a rule for that selected port. |

An absent or empty `exposed-port-name` produces no ingress rule, even for a Service with one port. A Service without a deployment-result name is ignored, including its exposure annotation. The value selects a Service port by `name`, not by its position, port number, or `targetPort`. Only one port per Service can be selected; all Service ports remain in the deployment result for in-cluster callers.

An invalid selection sets `DeploymentResultCreated=False`, `Ready=False`, and `Stalled=True` on the `ArtifactDeployment`. Its conditions report one of these reasons:

| Reason | Meaning |
| --- | --- |
| `ExposePortNotFound` | No Service port has the exact annotated name. |
| `ExposePortUnsupportedProtocol` | The selected port does not use TCP. |

If no result selects a port, the gateway-route activation removes any existing stage `HTTPRoute` and succeeds. Services and workloads remain deployed. For the application developer procedure and version requirement, see [Expose a Service through stage ingress](../../../develop-integrate/advanced-features/expose-service.md).

## Next steps {#related}

Configure destinations for the supported types:

- [Create a landscape](../../manage-delivery/landscapes.md) if you do not have one yet.
- [Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) using the parameters on this page.
- [Connect artifact registries](../connect-registries.md#give-the-deployer-credentials) supplies deployer credentials in each landscape that needs them.
- Read [Gateway routing](../../plan/gateway-routing.md), then [set up Envoy Gateway](./kubernetes/envoy-gateway.md) to route external traffic to stages.

For artifact authoring and the deployment model, see:

- [Publish artifacts](../../../develop-integrate/artifact-types/publish-artifacts.md)
- [Deployment model](../../../core-concepts/deployment-model.md)
- [Choose a deployer](./overview.md)
