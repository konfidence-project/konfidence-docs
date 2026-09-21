---
title: Deploy & Operate
description: Install Konfidence on your own cluster, control who can use it, and run the delivery flow.
outline: deep
editLink: true
lastUpdated: true
---

# Deploy & Operate

Install Konfidence on your own Kubernetes cluster, control who can use it, and run the delivery flow for your projects. These pages are for platform administrators and DevOps engineers who operate a Konfidence installation. Application developers find their pages under [Develop & Integrate](/docs/develop-integrate/).

The sections follow the order in which you set up an installation.

## Plan the installation

[System architecture](./system-architecture.md) explains what a Konfidence installation consists of and which topology the current release supports.

[High availability](./high-availability.md) explains which components can run with more than one replica and what that requires.

## Install the control plane

1. [Install Konfidence](./konfidence-installation.md) installs the operator and the API server from one Helm chart.
2. [Expose the API and dashboard](./expose-api.md) publishes both through an Ingress and connects the login to your identity provider.
3. [Connect artifact registries](./connect-registries.md) gives the control plane and the deployer credentials for private OCI registries.
4. [Manage deployers](./deployer/overview.md) explains deployment classes. The [Kubernetes deployer](./deployer/kubernetes.md) page installs the one deployer of the current release.
5. [Runtime components](./runtime-components/overview.md) lists optional services that run next to your workloads.

## Control access

1. [Manage projects](./projects.md) creates the project that owns landscapes, vector templates, and promotion flows.
2. [Grant roles](./access-control.md) binds project roles to identity provider groups and workload identities.
3. [Grant CI pipelines access](./grant-ci-access.md) lets a CI workflow call the Konfidence API with a project role.

## Manage delivery

1. [Manage landscapes](./landscapes.md) creates the namespace-backed scope in which stages deploy.
2. [Manage deployment targets](./deployment-targets.md) makes a deployment class available in a landscape.
3. [Manage stages](./stages.md) creates stages and changes the vector a stage selects.
4. [Promote vectors](./promote-vectors.md) updates the vector a stage selects through recorded, approvable promotions.

## Related

- [Getting Started](/docs/getting-started/) installs Konfidence into a local kind cluster.
- [Core Concepts](/docs/core-concepts/) explains vectors, stages, landscapes, and the delivery flow.
