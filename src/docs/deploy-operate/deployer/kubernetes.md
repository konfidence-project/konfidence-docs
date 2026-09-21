---
title: Kubernetes deployer
description: Reference for the built-in Kubernetes deployer, its supported manifest types, and how it exposes Services as deployment results.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Kubernetes deployer

The **Kubernetes deployer** is the reference implementation of Konfidence's deployer interface. It provides the deployment classes `helm.konfidence.cloud` and `kustomize.konfidence.cloud` and realizes them through Flux.

<!-- TODO: link to the Deployer interface specification once available; see
[Deployer Specification](../../reference/deployer-specification.md). -->

This page covers everything specific to this deployer. It explains how to install it and which connection types its deployment targets accept. It lists the manifest types it supports and how it turns an annotated Service into a deployment result. For packaging and naming requirements, see [Author a Helm artifact](../../develop-integrate/artifact-types/helm.md) or [Author a Kustomize artifact](../../develop-integrate/artifact-types/kustomize.md).

## Install the deployer

The deployer ships as the Helm chart `kubernetes-landscape-orchestrator`. Install it into the Konfidence namespace after the control plane. It needs Flux in the cluster, which [Install Konfidence](../konfidence-installation.md#prerequisites) lists as a prerequisite.

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

Verify that the deployer runs and registered its deployment classes:

```bash
kubectl get deployment kubernetes-landscape-orchestrator -n "$KONFIDENCE_NAMESPACE"
kubectl get deploymentclasses
```

The first command shows one available replica. The second lists `helm.konfidence.cloud` and `kustomize.konfidence.cloud`. Every chart value is listed in the [Helm values reference](/docs/reference/helm-values-orchestrator). [Manage deployment targets](../deployment-targets.md) makes the classes available in a landscape.

## Connection types

A [deployment target](../deployment-targets.md) for one of this deployer's classes carries a `connection` block with one of two types.

::: warning Only local targets work as documented
Use `local` targets. The `kubeconfig` type is work in progress. The deployer validates the kubeconfig and marks the target `Ready`. It does not yet create every resource on the remote cluster. Deployments through a `kubeconfig` target are incomplete.
:::

| `connection.type` | Deploys into | Status |
| --- | --- | --- |
| `local` | The cluster the deployer runs in, through its own service account | Supported |
| `kubeconfig` | The cluster a kubeconfig in a Secret points to | Work in progress, incomplete |

A `local` connection has no further fields:

```yaml
spec:
  deploymentClassName: helm.konfidence.cloud
  connection:
    type: local
```

A `kubeconfig` connection references a Secret in the landscape namespace. The deployer reads the kubeconfig from the key `value` or `value.yaml`, the keys Flux uses:

```bash
kubectl create secret generic prod-eu-kubeconfig \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --from-file=value="$HOME/.kube/prod-eu.yaml"
```

```yaml
spec:
  deploymentClassName: helm.konfidence.cloud
  connection:
    type: kubeconfig
    ref:
      kind: Secret
      name: prod-eu-kubeconfig
```

The deployer validates every target and reports the result in the `Ready` condition:

| Reason | Meaning |
| --- | --- |
| `Accepted` | The target passed validation. |
| `UnsupportedConnectionType` | `connection.type` is neither `local` nor `kubeconfig`. |
| `UnsupportedRefKind` | `connection.ref.kind` is not `Secret`. |
| `SecretNotFound` | The referenced Secret does not exist in the landscape namespace. |
| `InvalidSecret` | The Secret has neither a `value` nor a `value.yaml` key. |
| `InvalidKubeconfig` | The key exists but does not parse as a kubeconfig. |

Pulling artifacts from private registries needs a Secret in the landscape namespace as well. See [Connect artifact registries](../connect-registries.md#give-the-deployer-credentials).

## Supported manifest types

The value of `.spec.manifest.type` on an `ArtifactDeployment` selects the
sub-controller that reconciles it. The following table lists the supported manifest types, their Open Component Model (OCM) resource types, and the Flux resources the deployer creates:

| Deployment class | OCM resource type | Flux resources created |
| :--- | :--- | :--- |
| `kustomize.konfidence.cloud` | `kustomize` | `OCIRepository` (source) + `Kustomization` (kustomize.toolkit.fluxcd.io) |
| `helm.konfidence.cloud` | `helmChart` | `HelmRepository` (source) + `HelmRelease` (helm.toolkit.fluxcd.io) |

An `ArtifactDeployment` whose `manifest.type` does not match either value is
ignored by this deployer.

Each `ArtifactDeployment` must carry **at most one** OCM resource of the
matching type. Deployments with more than one matching resource are rejected
with `[Ready=False] MultipleKustomizeResources` (kustomize path) or
`[Ready=False] MultipleHelmChartResources` (helm path). Deployments with zero
matching resources produce no Flux resources.

## Exposing a Service as a deployment result

By default the Services in your bundle or chart are internal. To let other
components in the same vector discover and call a Service, annotate it:

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

The deployer applies a per-vector
`nameSuffix` (kustomize) or `releaseName` (Helm), so the Service's deployed name
is not known ahead of time and a caller cannot hard-code it. The annotation both
opts the Service in and supplies the **stable name** (its value) that consumers
look up. Services without the annotation are never exposed.

### How the deployer processes the annotation

After the artifact is deployed, the deployer
lists the Services it created and, for each one carrying the annotation, records
a deployment result on the `ArtifactDeployment` containing:

- The annotation value as the result name.
- The Service's namespace and its actual (suffixed) name.
- The Service's ports verbatim (multi-port Services are supported as-is).

Konfidence aggregates these into the vector's `VectorData`, keyed by artifact
component, so every component in the vector can resolve the Service by its stable
name at runtime — see [Use deployment results](../../develop-integrate/vector-data/deployment-results.md).

### Scope

Only Kubernetes `Service` objects can be exposed this way today
(deployment-result type `http-k8s-service`). Other resource kinds are not yet
supported.

## Related

Use these pages for publishing instructions and the definition of a deployer:

- [Publish artifacts](../../develop-integrate/artifact-types/publish-artifacts.md)
- [Deployment model](../../core-concepts/deployment-model.md)
- [Manage deployers](./overview.md)
- [Manage deployment targets](../deployment-targets.md)
