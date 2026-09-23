---
title: "Choose a deployer"
description: "Choose deployment capabilities for your target platform and inspect the classes available to landscapes."
outline: deep
editLink: true
lastUpdated: true
---

# Choose a deployer {#manage-deployers}

Choose a deployer for the platform where your applications will run and the artifact types they use. [Deployers](../../../reference/glossary.md#deployer) provide the platform-specific capabilities Konfidence uses to turn [artifacts](../../../reference/glossary.md#artifact) into workloads. Administrators install them centrally, then configure [deployment targets](../../../reference/glossary.md#deployment-target) in individual [landscapes](../../../reference/glossary.md#landscape) to make their [deployment classes](../../../reference/glossary.md#deployment-class) available.

For the relationship between deployers, classes, targets, and artifacts, see the [Deployment model](../../../core-concepts/deployment-model.md).

## Available deployers

The Kubernetes deployer is the deployer available in the current release:

| Deployer | Target platform | Artifact formats | Provided deployment classes |
| --- | --- | --- | --- |
| [Kubernetes deployer](./kubernetes.md) | Kubernetes through Flux | Helm, Kustomize | `helm.konfidence.cloud`, `kustomize.konfidence.cloud` |

Choose it when your applications are packaged as Helm or Kustomize artifacts. [Install the Kubernetes deployer](./kubernetes.md#install-the-deployer), then use its [connection types](./kubernetes.md#connection-types) when configuring landscape targets. The current release supports local targets; remote targets are work in progress.

Deployers are extensible. A deployer can provide several classes for one platform, or introduce classes for another platform and artifact format. The target platform describes where artifacts run; Konfidence itself is installed on Kubernetes.

## Prerequisites for inspecting installed capabilities

- `kubectl` access to read cluster-scoped `DeploymentClass` resources.
- For the landscape check below, a [landscape](../../manage-delivery/landscapes.md) and permission to read `DeploymentTarget` resources in its namespace.

## List deployment classes

Each installed deployer advertises one or more capabilities as cluster-scoped `DeploymentClass` resources:

```bash
kubectl get deploymentclasses
```

The resource name is the class identifier used by artifact manifests and deployment targets.
The `spec.controller` field identifies the deployer responsible for the class.

Deployment classes are installed and owned by their deployer.
Do not create or modify them to configure an individual landscape.

## Check which classes a landscape provides

List the targets in the landscape namespace:

```bash
kubectl get deploymenttargets --namespace=<landscape-namespace>
```

The `spec.deploymentClassName` field identifies the capability each target makes available.
The landscape can deploy an artifact only when it contains a ready target whose class matches the artifact manifest type.

Use [Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) to add a missing capability or investigate a target that is not ready.

## Next steps

- [Install the Kubernetes deployer](./kubernetes.md) provides the Helm and Kustomize deployment classes.
- [Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) makes an installed class available to that landscape.
- [Types of artifacts](../../../develop-integrate/artifact-types/index.md) describes the classes available to application developers.
- [Extend & Customize](../../../extend-customize/index.md) introduces extension development.
