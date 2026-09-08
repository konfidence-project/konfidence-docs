---
title: "Deployers"
description: "What a deployer does, how a landscape selects one, and how to find out which deployer serves your landscape."
outline: deep
editLink: true
lastUpdated: true
---

# Deployers

A deployer turns the artifacts of a vector into running workloads in a landscape. Konfidence ships the Kubernetes deployer and accepts custom deployers for other platforms.

## A deployer renders artifacts into a landscape

Konfidence decides which vector belongs in which stage. The deployer does the platform-specific work. It reads each artifact of the vector, renders the deployable content, and applies it to the target infrastructure. It also runs migration tasks and activation steps for that platform.

Each deployer handles a fixed set of artifact types. The artifact's manifest names its type, and only the deployer that supports this type picks the artifact up.

## A landscape selects its deployer through a deployment class

A deployer installs one cluster-scoped `DeploymentClass` per artifact type it supports. A landscape holds one or more `DeploymentTarget` resources. Each target references one `DeploymentClass` and carries the connection to the target infrastructure. This is how a landscape binds an artifact type to a deployer and a cluster.

Administrators create deployment targets when they set up a landscape. See [Managing Landscapes](../landscapes.md#deployment-targets).

## Find out which deployer serves your landscape

Ask your administrator, or query the cluster where Konfidence runs.

1. List the deployment classes. Each class names its deployer in `spec.controller`:

   ```bash
   kubectl get deploymentclass
   ```

2. List the deployment targets of your landscape. Each target names the class it uses in `spec.deploymentClass`:

   ```bash
   kubectl get deploymenttarget -n <landscape-namespace>
   ```

An artifact type without a matching deployment target in the landscape does not deploy there.

<!-- TODO(fkasper): verify the DeploymentClass names shown in Managing Landscapes (`konfidence.cloud/helm`, `konfidence.cloud/kustomize`) against the orchestrator. -->

## Available deployers

| Deployer | Platform | Artifact types |
| --- | --- | --- |
| [Kubernetes deployer](./kubernetes.md) | Kubernetes, through Flux | Helm charts, Kustomize bundles |

Deployers are extensible. To support another platform or deployment method, see [Extend & Customize](../../extend-customize/index.md).
