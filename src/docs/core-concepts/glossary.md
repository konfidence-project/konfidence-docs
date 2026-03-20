---
title: Glossary
description: Comprehensive glossary of Konfidence terminology, acronyms, and technical terms. Quick reference for developers and operators.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Glossary

Comprehensive glossary of Konfidence terminology and technical terms.

## Artifact

An artifact is a versioned object produced during a build or continuous integration (CI) process. When you use Konfidence, a build pipeline typically produces two outputs:
1. The build result, such as a Docker image or a Helm chart, which is uploaded to an [Open Container Initiative (OCI)](https://opencontainers.org/) registry.
2. The Konfidence artifact in the form of an [Open Component Model (OCM)](https://ocm.software/) descriptor, which contains a reference to the build result and additional metadata.

The OCM artifact itself does not necessarily include the deployable content. Instead, it serves as a declarative reference to the build result, along with all the information required for consistent and reproducible deployments across environments.

## ArtifactDeployment

A Kubernetes CRD that contains the deployment information for a specific artifact. 
An artifact deployment can be reused by multiple vector deployments within a landscape if the corresponding vectors share the same artifact.

## Deployer

A controller responsible for executing the deployment of individual artifacts. 
A deployer acts upon ArtifactDeployment CRs and performs the deployment of an artifact for a specific runtime, e.g. Kubernetes.
 
## Global control plane

A global control plane is the primary interface to manage the software delivery process. 

It defines and distributes the desired state for multiple local control planes. The global control plane assembles, validates, and dispatches deployment configurations, such as software versions and stage resources.

The global control plane also receives regular status updates from its connected local control planes, enabling centralized tracking and consistency of software delivery.

## Landscape

A landscape is the logical grouping of multiple stages and deployment targets. In Konfidence, it is represented by a Kubernetes namespace. A landscape is where deployments are physically executed. 

## Local control plane

A local control plane is a runtime orchestrator that manages and executes software deployments in one or more environments based on a specific target state, such as a stage resource. 

The local control plane pulls its configuration and target deployment state from the global control plane, applies those specifications to its managed resources, and regularly sends updates about its current status back to the global control plane. It belongs to at most one global control plane, but it can also act independently.

## Promotion

A promotion describes the action of moving a vector from one stage to another.

It acts as a blueprint for how selected artifacts are expected to evolve as they progress towards production environments.

## Stage

A stage is a defined step in the delivery process, such as build, test, or release. It references exactly one vector at a time, which is a specific version of the application.

A stage serves as a checkpoint for quality assurance and approval. In Konfidence, stages are a virtual concept. They are represented by a Kubernetes CRD. 

Deployments are executed in landscapes and mapped to stages. Through this, a deployment can be part of multiple stages of the same landscape.

## Task

A task is an instruction that must be executed as part of the vector lifecycle. Its purpose is to prepare the stage for the artifact changes coming with a new vector. Common examples for tasks are database migrations, cache warm-ups or search index updates. 

Tasks can be anything from simple scripts to complex workflows. 
They are defined as part of the OCM descriptor of the Artifact and need to define their parameters and execution context. 

## Vector

A vector is a complete, versioned set of artifacts which describes the desired state of the application to be delivered. It is immutable and represents exactly one version of this application.

A vector contains only references to the required artifacts and their configurations. Any modification of an artifact must result in the creation of a new vector, ensuring deployments are auditable, reproducible, and isolated from previous versions.

## VectorActivation

A Kubernetes CRD that triggers the activation process in the vector lifecycle, designating one specific vector to receive live traffic.

## VectorAssignment

A Kubernetes CRD that represents the logical relationship between an ArtifactDeployment and a vector.

Since a single artifact may be reused across multiple vectors, an n:m relationship exists between vectors and artifacts. VectorAssignment creates a concrete instance of that relationship.

## VectorDeployment

A Kubernetes CRD representing the instantiation of a vector in a specific landscape through the deployment of all artifacts of that vector.

## VectorMigration

A Kubernetes CRD that triggers the migration process in the vector lifecycle. During that phase, all tasks belonging to the artifacts of the vector will be executed. 