---
title: "Managing Deployers"
description: "Inspect the deployers and deployment classes available to landscapes."
outline: deep
editLink: true
lastUpdated: true
---

# Managing Deployers

Deployers provide the platform-specific capabilities Konfidence uses to turn artifacts into running workloads. 
Operators install deployers centrally, then configure deployment target in individual landscapes to make the deployment class available.

For the relationship between deployers, classes, targets, and artifacts, see the [Deployment Model](../../core-concepts/deployment-model.md).

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

Use [Managing Deployment Targets](../deployment-targets.md) to add a missing capability or investigate a target that is not ready.

## Available deployers

| Deployer | Platform | Provided deployment classes |
| --- | --- | --- |
| [Kubernetes deployer](./kubernetes.md) | Kubernetes through Flux | `helm.konfidence.cloud`, `kustomize.konfidence.cloud` |

Deployers are extensible. 
A deployer can provide several classes for one platform, or introduce classes for another platform and artifact format.

## Next steps

- [Managing Deployment Targets](../deployment-targets.md) explains how to configure a class in a landscape.
- [Kubernetes deployer](./kubernetes.md) describes its supported artifact formats and deployment results.
- [Types of artifacts](../../develop-integrate/artifact-types/index.md) describes the classes available to application developers.
- [Extend & Customize](../../extend-customize/index.md) introduces extension development.
