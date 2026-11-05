---
title: Deployment model
description: Understand how artifact types connect artifacts, deployers, deployment targets, and landscapes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Deployment model

Konfidence separates the application version to deliver from the platform-specific work required to run it.
[Artifacts](../reference/glossary.md#artifact) declare what they need for deployment, while each [landscape](../reference/glossary.md#landscape) provides configured destinations that meet those requirements.
This separation allows one delivery model to work across different infrastructure and deployment technologies.

This page explains how artifact types, deployers, and deployment targets work together. 
These are the components that connect an artifact to infrastructure in each landscape.

## Artifact types

The [artifact type](../reference/glossary.md#artifact-type) is an identifier for an artifact's packaging and deployment contract.
It is a lowercase identifier consisting of a type name and a vendor-owned DNS domain, such as `helm.konfidence.cloud`.

An artifact is packaged as an OCM component version. 
Its manifest declares the artifact type, while its other resources carry the deployable content required by that type. 
The provider of the type defines which resources and payloads are valid.
For example, artifacts of type `helm.konfidence.cloud` contain one helm chart resource. 

The artifact type appears in different places throughout the platform:

| Location | Purpose |
| --- | --- |
| Artifact manifest `type` | Declares the artifact's packaging and deployment contract. |
| `ArtifactDeployment.spec.artifactType` | Selects the responsible deployer. |
| `DeploymentTarget.spec.artifactType` | Configures a destination for that type in a landscape. |
| A deployer's list of supported artifact types | Used to select which resources are reconciled by the deployer. |


## Deployers implement artifact types

A [deployer](../reference/glossary.md#deployer) is a Kubernetes controller that interprets artifacts.
It declares which artifact types it supports and therefor acts as the provider of the artifact type contract. 
It turns an artifact's deployable content into running workloads and participates in platform-specific migration and activation work according to the [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md).

Konfidence coordinates delivery of the [vector](../reference/glossary.md#vector) selected for a [stage](../reference/glossary.md#stage).
The deployer handles the platform-specific work needed to run it.
This keeps the Konfidence delivery model independent of Kubernetes, managed cloud services, or future target platforms.

One deployer can support several artifact types. 
Platform operators need to ensure that only one deployer is configured to reconcile each type.

## Deployment targets configure destinations

A deployment target configures a destination for one artifact type in one landscape.
Its `spec.artifactType` selects the responsible deployer, and `spec.parameters` carries deployer-defined connection information such as a secret reference for remote credentials.

A landscape can contain several targets for different artifact types.
For example, it might provide both Helm and Kustomize targets that connect to the same Kubernetes cluster.
A landscape must have at most one target for each artifact type.

## Landscapes define the operational scope

A [landscape](./landscapes-and-stages.md) groups stages and deployment resources that share an operational context.
Deployment targets describe which deployment capabilities are available in that context and where those deployments go.

When a stage selects a vector, every artifact in the vector must have a matching ready target in that stage's landscape.
If the vector includes an artifact that has no ready target in the landscape, Konfidence cannot deploy that artifact there.

This gives platform operators control over the technologies and destinations available in each landscape without embedding infrastructure details in stages or vectors.

## From artifact to infrastructure

The diagram shows how deployers connect artifact deployments and deployment targets in a landscapes to the corresponding infrastructure:

<DrawioDiagram src="/assets/diagrams/deployment-model.drawio" />

An artifact comes with its declared artifact type.
A deployer recognizes that type and uses a matching [deployment target](../reference/glossary.md#deployment-target) in the artifact's landscape to connect to runtime infrastructure.
The artifact type identifier links the artifact to its deployer and destination.

For example, an artifact of type `helm.konfidence.cloud` can be deployed in a landscape when

* a deployer for that type is installed (for example the [Kubernetes deployer](../deploy-operate/install/deployer/kubernetes.md)
* and the landscape contains a deployment target for it (for example defined by a kubeconfig).

## Responsibilities at a glance

Application developers and platform operators provide the inputs Konfidence needs to coordinate deployment:

| Role or component | Responsibility |
| --- | --- |
| Application developer | Packages an artifact and declares its artifact type. |
| Platform operator | Installs deployers and configures one matching deployment target per type in each landscape. |
| Konfidence | Matches artifact requirements to targets and coordinates the deployment lifecycle. |

## Related information

Use these pages to explore landscape boundaries or configure deployments:

- [Landscapes and stages](./landscapes-and-stages.md) explains operational and delivery boundaries.
- [Types of artifacts](../develop-integrate/artifact-types/index.md) helps application developers choose and author supported artifacts.
- [Choose a deployer](../deploy-operate/install/deployer/overview.md) explains how operators select deployers and their supported artifact types.
- [Configure deployment targets for a landscape](../deploy-operate/manage-delivery/deployment-targets.md) explains how to configure a destination for an artifact type.
