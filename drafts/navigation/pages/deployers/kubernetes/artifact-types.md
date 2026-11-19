---
title: "Kubernetes artifact types"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Kubernetes artifact types

The Kubernetes deployer supports Helm and Kustomize. This reference describes the resources each artifact type requires.

## Supported artifact types

The `.spec.artifactType` on an [`ArtifactDeployment`](../../reference/glossary.md#artifactdeployment) selects the deployer.
The following table lists its supported types, their Open Component Model (OCM) resource types, and the Flux resources created:

| Artifact type | OCM resource type | Flux resources created |
| :--- | :--- | :--- |
| `kustomize.konfidence.cloud` | `kustomize` | `OCIRepository` (source) and `Kustomization` (`kustomize.toolkit.fluxcd.io`) |
| `helm.konfidence.cloud` | `helmChart` | `HelmRepository` (source) and `HelmRelease` (`helm.toolkit.fluxcd.io`) |

An `ArtifactDeployment` whose `spec.artifactType` does not match either value is ignored by this deployer.

Each `ArtifactDeployment` must carry at most one OCM resource of the matching type. Deployments with more than one matching resource are rejected with `[Ready=False] MultipleKustomizeResources` (Kustomize path) or `[Ready=False] MultipleHelmChartResources` (Helm path). Deployments with zero matching resources produce no Flux resources.


## Related guides

- [Install the Kubernetes deployer](./install.md)
- [Use deployment results](./deployment-results.md)

## Choose an artifact type

The [Kubernetes deployer](./install.md) creates Flux resources that deploy Helm charts and Kustomize bundles to Kubernetes.

Choose the type that matches the deployment configuration you already maintain:

| Deployment configuration | Artifact manifest `type` | Authoring guide |
| --- | --- | --- |
| Helm chart | `helm.konfidence.cloud` | [Author a Helm artifact](./helm.md) |
| Kustomize bundle | `kustomize.konfidence.cloud` | [Author a Kustomize artifact](./kustomize.md) |

If both formats are available, follow your team's existing release workflow. You do not need to convert your deployment configuration for Konfidence.

Before deploying, confirm that the [landscape](../../reference/glossary.md#landscape) has a ready [deployment target](../../reference/glossary.md#deployment-target) for the selected type.
The [deployment model](../../core/deployment-model.md) explains how artifacts, deployers, and targets connect.
Operators set up targets by following [Configure deployment targets for a landscape](../../core/deployment-targets.md).

To add a deployment method or a target platform, see [Community](../../community/index.md).
