---
title: Deployment Model
description: Understand how deployment classes connect artifacts, deployers, deployment targets, and landscapes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Deployment Model

Konfidence separates application delivery intent from the platform-specific work required to run an application. 
Artifacts declare the deployment capability they need, while each landscape provides configured destinations for the capabilities it supports.

This separation allows one delivery model to work across different infrastructure and deployment technologies.

## From artifact to infrastructure

Four concepts connect an artifact to the place where it runs:

<DrawioDiagram src="/assets/diagrams/deployment-model.drawio" />

The deployment class is the shared contract between these concepts. 
The same identifier appears in three places:

| Location | Purpose |
| --- | --- |
| Artifact manifest `type` | Declares the capability required to deploy the artifact. |
| `DeploymentClass.metadata.name` | Advertises that an installed deployer provides the capability. |
| `DeploymentTarget.spec.deploymentClassName` | Makes the capability available in a particular landscape. |

For example, an artifact with manifest type `helm.konfidence.cloud` can be deployed in a landscape only when the class `helm.konfidence.cloud` exists and the landscape contains a ready target for that class.

## Deployment classes describe capabilities

A deployment class is a named capability for deploying a particular kind of artifact. 
It answers two questions:

- Which deployer understands this artifact?
- Does a landscape provide a destination for it?

Deployers advertise their capabilities by installing cluster-wide `DeploymentClass` resources. 
A class names the controller responsible for the capability. 
Helm and Kustomize are separate classes even when the same Kubernetes deployer provides both and they connect to the same cluster.

Class identifiers are part of the contract between artifact authors and platform operators. 
Changing an artifact to require another class changes its deployment requirements.

## Deployers implement deployment classes

A deployer is a platform-specific controller that interprets artifacts of the classes it provides. 
It turns their deployable content into running workloads and participates in platform-specific migration and activation work.

Core Konfidence decides which vector belongs in a stage and creates the corresponding deployment intent. 
The deployer decides how to realize that intent on its platform. 
This keeps the Konfidence delivery model independent of Kubernetes, managed cloud services, or future target platforms.

One deployer can implement several deployment classes. 
Conversely, a deployment class identifies one responsible controller so that ownership of its deployments is unambiguous.

## Deployment targets configure destinations

A deployment target makes one deployment class available in one landscape. 
It contains the connection information the responsible deployer needs, such as credentials for a remote platform.

A landscape can contain several targets for different classes. 
For example, it might provide both Helm and Kustomize targets that connect to the same Kubernetes cluster. 
Within a landscape, there is one single target for each deployment class.

## Landscapes define the operational scope

A [landscape](./landscapes-and-stages.md) groups stages and deployment resources that share an operational context. 
Deployment targets describe which deployment capabilities are available in that context and where those deployments go.

When a stage selects a vector, every artifact in the vector must have a matching ready target in that stage's landscape. 
If the vector requires a class that the landscape does not provide, Konfidence cannot deploy that artifact there.

This gives platform operators control over the technologies and destinations available in each landscape without embedding infrastructure details in stages or vectors.

## Responsibilities at a glance

| Role                  | Responsibility |
|-----------------------| --- |
| Application developer | Packages an artifact and selects the deployment class it requires. |
| Platform operator     | Installs deployers and configures matching targets in each landscape. |
| Konfidence Platform   | Matches artifact requirements to targets and coordinates the deployment lifecycle. |

## Related information

- [Landscapes and Stages](./landscapes-and-stages.md) explains operational and delivery boundaries.
- [Types of artifacts](../develop-integrate/artifact-types/index.md) helps application developers choose and author supported artifacts.
- [Managing Deployers](../deploy-operate/deployer/overview.md) explains how operators inspect available deployers and classes.
- [Managing Deployment Targets](../deploy-operate/deployment-targets.md) explains how to make a class available in a landscape.
