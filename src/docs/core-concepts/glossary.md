---
title: Glossary
description: Comprehensive glossary of Konfidence terminology, acronyms, and technical terms. Quick reference for developers and operators.
outline: false
editLink: true
lastUpdated: true
---

# Glossary

Comprehensive glossary of Konfidence terminology and technical terms.

## Artifact

An artifact is a versioned object produced during a build or continuous integration (CI) process. When you use Konfidence, a build pipeline typically produces two outputs:
1. The build result, such as a Docker image, which is uploaded to a registry.
2. The Konfidence artifact, which contains a reference to that build result and additional metadata.

The artifact itself does not include the deployable content. Instead, it serves as a declarative reference to the build result, along with all the information required for consistent and reproducible deployments across environments.

## ArtifactDeployment

A Kubernetes CRD that contains the deployment information for a specific artifact. 
An artifact deployment can be reused by multiple vector deployments within a landscape if the corresponding vectors share the same artifact.

## Deployer

A controller responsible for executing the deployment of individual artifacts. 
A deployer acts upon ArtifactDeployment CRs and performs the deployment of an artifact for a specific runtime, e.g. Kubernetes.
 
## Global Control Plane
A global control plane is the primary interface to manage the software delivery process. 

It defines and distributes the desired state for multiple local control planes, assembling, validating, and dispatching deployment configurations, such as software versions or stage resources. 

The global control plane also receives regular status updates from its connected local control planes, enabling centralized tracking and consistency of software delivery.

## Landscape

A landscape is the logical grouping of multiple stages and deployment targets. In Konfidence, it is represented by a Kubernetes namespace. A landscape is where deployments are physically executed. 


## Local Control Plane

A local control plane is a runtime orchestrator that manages and executes software deployments in one or more environments based on a specific target state, such as a stage resource. 

The local control plane pulls its configuration and target deployment state from the global control plane, applies those specifications to its managed resources, and regularly sends updates about its current status back to the global control plane. It belongs to at most one global control plane, but it can also act independently.

## Promotion

A promotion is a defined description of a desired future state for part of an application or service at a specific point in time. 

It acts as a blueprint for how selected components are expected to evolve as they progress toward deployment.

## Stage

## Task

A task is an instruction that must be executed to promote a vector from one stage to another, for example database migrations. 

Tasks can be anything from simple scripts to complex workflows. 
They need to be defined in a way that allows the platform to understand their purpose, parameters, and execution context. A task can be described in a TaskDefinition CRD.

## Vector

A vector is a complete, versioned set of artifacts which together comprise the application to be delivered. It is immutable and represents exactly one version of this application.

A vector contains only references to the required artifacts and their configurations. Any change to an artifact triggers the creation of a new vector, ensuring deployments are auditable, reproducible, and isolated from previous versions.

## VectorActivation

A Kubernetes CRD used to trigger activation of vector deployments after successful migration.

## VectorAssignment

A Kubernetes CRD that represents one logical binding between a VectorDeployment and an ArtifactDeployment. 

Since a single artifact may be reused across multiple vectors, an n:m relationship exists between vectors and artifacts. VectorAssignment creates a concrete instance of that relationship.

## VectorDeployment

A Kubernetes CRD representing the fulfillment of the deployment of all artifacts which are part of a vector. 

## VectorMigration
A Kubernetes CRD used to trigger migration tasks for stage versions before activation.
