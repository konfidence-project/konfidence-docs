---
title: "Types of artifacts"
description: "Choose an artifact type and understand when vectors can share a deployed artifact."
outline: deep
editLink: true
lastUpdated: true
---

# Types of artifacts

Choose how to package your service for Konfidence and whether several vectors can share one deployed instance.
For the relationship between artifacts and application versions, see [Vectors and artifacts](../../core-concepts/vectors-and-artifacts.md).

## Choose an artifact type

The [Kubernetes deployer](../../deploy-operate/install/deployer/kubernetes.md) creates Flux resources that deploy Helm charts and Kustomize bundles to Kubernetes.

Choose the type that matches the deployment configuration you already maintain:

| Deployment configuration | Artifact manifest `type` | Authoring guide |
| --- | --- | --- |
| Helm chart | `helm.konfidence.cloud` | [Author a Helm artifact](./helm.md) |
| Kustomize bundle | `kustomize.konfidence.cloud` | [Author a Kustomize artifact](./kustomize.md) |

If both formats are available, follow your team's existing release workflow. You do not need to convert your deployment configuration for Konfidence.

Before deploying, confirm that the [landscape](../../reference/glossary.md#landscape) has a ready [deployment target](../../reference/glossary.md#deployment-target) for the selected type.
The [deployment model](../../core-concepts/deployment-model.md) explains how artifacts, deployers, and targets connect.
Operators set up targets by following [Configure deployment targets for a landscape](../../deploy-operate/manage-delivery/deployment-targets.md).

To add a deployment method or a target platform, see [Extend and customize](../../extend-customize/index.md).

## Supported artifact types

The `.spec.artifactType` on an [`ArtifactDeployment`](../../reference/glossary.md#artifactdeployment) selects the deployer.
The following table lists its supported types, their Open Component Model (OCM) resource types, and the Flux resources created:

| Artifact type | OCM resource type | Flux resources created |
| :--- | :--- | :--- |
| `kustomize.konfidence.cloud` | `kustomize` | `OCIRepository` (source) and `Kustomization` (`kustomize.toolkit.fluxcd.io`) |
| `helm.konfidence.cloud` | `helmChart` | `HelmRepository` (source) and `HelmRelease` (`helm.toolkit.fluxcd.io`) |

An `ArtifactDeployment` whose `spec.artifactType` does not match either value is ignored by this deployer.

Each `ArtifactDeployment` must carry at most one OCM resource of the matching type. Deployments with more than one matching resource are rejected with `[Ready=False] MultipleKustomizeResources` (Kustomize path) or `[Ready=False] MultipleHelmChartResources` (Helm path). Deployments with zero matching resources produce no Flux resources.

## Reuse an artifact instance

The shared [artifact model](../../core-concepts/vectors-and-artifacts.md#choose-whether-vectors-share-one-instance-of-your-artifact) explains `allowReuse` and when to share an instance. For the Kubernetes HTTP integration requirements, see [Share an artifact instance](../vector-data/access-vector-data.md#share-an-artifact-instance).

## Next steps

Use the following guides to prepare and publish your artifact:

- [Author a Kustomize artifact](./kustomize.md)
- [Author a Helm artifact](./helm.md)
- [Publish artifacts](./publish-artifacts.md) to package and push an artifact to a registry.
