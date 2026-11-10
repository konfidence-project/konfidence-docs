---
title: "Choose a deployer"
description: "Choose a deployer for your target platform and inspect the artifact types available to landscapes."
outline: deep
editLink: true
lastUpdated: true
---

# Choose a deployer {#manage-deployers}

Choose a deployer for the platform where your applications will run and the artifact types they use. [Deployers](../../../reference/glossary.md#deployer) provide the platform-specific capabilities Konfidence uses to turn [artifacts](../../../reference/glossary.md#artifact) into workloads. Administrators install them centrally, then configure [deployment targets](../../../reference/glossary.md#deployment-target) in individual [landscapes](../../../reference/glossary.md#landscape) for the types they support.

For the relationship between deployers, artifact types, targets, and artifacts, see the [Deployment model](../../../core-concepts/deployment-model.md).

## Available deployers

Following deployers are available in the current release:

| Deployer | Target platform | Artifact formats | Supported artifact types |
| --- | --- | --- | --- |
| [Kubernetes deployer](./kubernetes.md) | Kubernetes through Flux | Helm, Kustomize | `helm.konfidence.cloud`, `kustomize.konfidence.cloud` |

## Prerequisites for inspecting installed capabilities

- `kubectl` access to inspect the installed deployer and its configuration.
- For the landscape check below, a [landscape](../../manage-delivery/landscapes.md) and permission to read `DeploymentTarget` resources in its namespace.

## Check which types a landscape provides

List the targets in the landscape namespace:

```bash
kubectl get deploymenttargets --namespace=<landscape-namespace>
```

The `spec.artifactType` field identifies the artifact type and `Ready=True` indicates that its deployer accepts the target. 
The landscape can deploy an artifact when it contains a ready target matching the artifact manifest type.

Use [Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) to add a missing capability or investigate a target that is not ready.

## Next steps

- [Install the Kubernetes deployer](./kubernetes.md) supports Helm and Kustomize artifact types.
- [Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) configures destinations for supported types.
- [Types of artifacts](../../../develop-integrate/artifact-types/index.md) describes supported artifact types for application developers.
- [Extend & Customize](../../../extend-customize/index.md) introduces extension development.
