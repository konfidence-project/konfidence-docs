---
title: Deployment model
description: Understand how deployment classes connect artifacts, deployers, deployment targets, and landscapes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Deployment model

Konfidence separates the application version to deliver from the platform-specific work required to run it.
Artifacts declare what they need for deployment, while each landscape provides configured destinations that meet those requirements.

This separation allows one delivery model to work across different infrastructure and deployment technologies.

## From artifact to infrastructure

The diagram shows how deployment classes, deployers, targets, and landscapes connect an artifact to infrastructure:

<DrawioDiagram src="/assets/diagrams/deployment-model.drawio" />

An artifact names the deployment class it requires. A deployer provides that class and uses a matching deployment target in the landscape to connect to infrastructure. The class identifier links the artifact's requirements to the deployer and its configured destination.

For example, an artifact with manifest type `helm.konfidence.cloud` can be deployed in a landscape only when the class `helm.konfidence.cloud` exists and the landscape contains a ready target for that class.

## Deployment classes describe capabilities

A deployment class is a named capability for deploying a particular kind of artifact.
It answers two questions:

- Which deployer understands this artifact?
- Does a landscape provide a destination for it?

Deployers make their capabilities available by installing cluster-wide `DeploymentClass` resources.
A class names the controller responsible for the capability.
Helm and Kustomize are separate classes even when the same Kubernetes deployer provides both and they connect to the same cluster.

Class identifiers give artifact authors and platform operators a shared way to identify deployment requirements.
Changing an artifact to require another class changes its deployment requirements.

## Deployers implement deployment classes

A deployer is a platform-specific controller that interprets artifacts of the classes it provides.
It turns their deployable content into running workloads and participates in platform-specific migration and activation work.

Konfidence coordinates delivery of the vector selected for a stage.
The deployer handles the platform-specific work needed to run it.
This keeps the Konfidence delivery model independent of Kubernetes, managed cloud services, or future target platforms.

One deployer can implement several deployment classes.
Conversely, a deployment class identifies one responsible controller so that ownership of its deployments is unambiguous.

## Deployment targets configure destinations

A deployment target makes one deployment class available in one landscape.
It contains the connection information the responsible deployer needs, such as credentials for a remote platform.

A landscape can contain several targets for different classes.
For example, it might provide both Helm and Kustomize targets that connect to the same Kubernetes cluster.
Within a landscape, each deployment class has a single target.

## Landscapes define the operational scope

A [landscape](./landscapes-and-stages.md) groups stages and deployment resources that share an operational context.
Deployment targets describe which deployment capabilities are available in that context and where those deployments go.

When a stage selects a vector, every artifact in the vector must have a matching ready target in that stage's landscape.
If the vector requires a class that the landscape does not provide, Konfidence cannot deploy that artifact there.

This gives platform operators control over the technologies and destinations available in each landscape without embedding infrastructure details in stages or vectors.

::: details Where the class identifier appears

The same deployment-class identifier appears in three places:

| Location | Purpose |
| --- | --- |
| Artifact manifest `type` | Declares the capability required to deploy the artifact. |
| `DeploymentClass.metadata.name` | Advertises that an installed deployer provides the capability. |
| `DeploymentTarget.spec.deploymentClassName` | Makes the capability available in a particular landscape. |

:::

## Responsibilities at a glance

Application developers and platform operators provide the inputs Konfidence needs to coordinate deployment:

| Role or component | Responsibility |
| --- | --- |
| Application developer | Packages an artifact and selects the deployment class it requires. |
| Platform operator     | Installs deployers and configures matching targets in each landscape. |
| Konfidence | Matches artifact requirements to targets and coordinates the deployment lifecycle. |

## Related information

Use these pages to explore landscape boundaries or configure deployments:

- [Landscapes and stages](./landscapes-and-stages.md) explains operational and delivery boundaries.
- [Types of artifacts](../develop-integrate/artifact-types/index.md) helps application developers choose and author supported artifacts.
- [Choose a deployer](../deploy-operate/install/deployer/overview.md) explains how operators select deployment capabilities and inspect installed classes.
- [Configure deployment targets for a landscape](../deploy-operate/manage-delivery/deployment-targets.md) explains how to make a class available in a landscape.
