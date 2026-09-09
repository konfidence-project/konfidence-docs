---
title: Kubernetes deployer
description: Reference for the built-in Kubernetes deployer, its supported manifest types, and how it exposes Services as deployment results.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Kubernetes deployer

The **Kubernetes deployer** is the reference implementation of Konfidence's
deployer interface.

<!-- TODO: link to the Deployer interface specification once available; see
[Deployer Specification](../../reference/deployer-specification.md). -->

This page lists the manifest types this deployer supports and how it turns an annotated Service into a deployment result. For packaging and naming requirements, see [Author a Helm artifact](../../develop-integrate/artifact-types/helm.md) or [Author a Kustomize artifact](../../develop-integrate/artifact-types/kustomize.md).

## Supported manifest types

The value of `.spec.manifest.type` on an `ArtifactDeployment` selects the
sub-controller that reconciles it. The following table lists the supported manifest types, their Open Component Model (OCM) resource types, and the Flux resources the deployer creates:

| `manifest.type`                    | OCM resource type | Flux resources created                                    |
| :--------------------------------- | :---------------- | :-------------------------------------------------------- |
| `cloud.konfidence.flux.kustomize`  | `kustomize`       | `OCIRepository` (source) + `Kustomization` (kustomize.toolkit.fluxcd.io) |
| `cloud.konfidence.flux.helm`       | `helmChart`       | `HelmRepository` (source) + `HelmRelease` (helm.toolkit.fluxcd.io)       |

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
- [Deployer definition](../../reference/glossary.md#deployer)
