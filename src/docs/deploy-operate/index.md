---
title: Deploy & Operate
description: Install and operate Konfidence, administer project access, prepare delivery environments, and run promotion flows.
outline: deep
editLink: true
lastUpdated: true
---

# Deploy & Operate

Install and operate Konfidence on your Kubernetes cluster, prepare environments for your applications, and run delivery for your projects. These pages cover platform administration, project access, and release tasks. Application developers find packaging and integration guidance under [Develop & Integrate](../develop-integrate/index.md).

Choose the section for the result you need. One person can perform several tasks, or teams can hand the results to each other. Each guide states the access it requires: Kubernetes permissions for the `kubectl` examples, or Konfidence project roles for API and `kden` operations.

Here, *platform* means Konfidence and its installed deployers. Landscape services run alongside applications and are configured when you prepare a delivery environment.

## Prepare {#plan-the-installation}

[System architecture](./plan/system-architecture.md) explains what a Konfidence installation consists of and which topology the current release supports.

[Plan for high availability](./plan/high-availability.md) explains which components can run with more than one replica and what that requires.

## Install the platform {#install-the-control-plane}

Install the shared services and make them reachable:

1. [Install Konfidence](./install/konfidence-installation.md) installs the operator and the API server from one Helm chart.
2. [Give teams access to the dashboard and API](./install/expose-api.md) publishes both and connects the login to your identity provider.
3. [Choose a deployer](./install/deployer/overview.md) matches your target platform and artifact types to deployment classes. [Install the Kubernetes deployer](./install/deployer/kubernetes.md) provides Helm and Kustomize deployment capabilities.
4. [Connect artifact registries](./install/connect-registries.md) configures credentials for Konfidence and the deployer. Set up the central credentials now and return to the landscape-specific steps after creating a landscape.

## Administer projects and access {#control-access}

Create a project and give people and automation access through the Konfidence API:

1. [Create a project](./control-access/projects.md) establishes the scope that owns landscapes, vector templates, and promotion flows.
2. [Grant teams access to a project](./control-access/access-control.md) binds project roles to identity provider groups and workload identities.
3. [Grant CI pipelines access](./control-access/grant-ci-access.md) lets a CI workflow call the Konfidence API with a project role.

## Prepare delivery environments {#manage-delivery}

Prepare the landscape before selecting application versions for its stages:

1. [Create a landscape](./manage-delivery/landscapes.md) establishes the namespace-backed scope in which stages deploy.
2. [Configure deployment targets for a landscape](./manage-delivery/deployment-targets.md) makes the required deployment classes available there. Add [deployer registry credentials](./install/connect-registries.md#give-the-deployer-credentials) when artifacts come from private registries.
3. [Choose landscape services](./install/runtime-components/overview.md) identifies services your applications use at runtime. [Install the Vector Data Service](./install/runtime-components/vector-data-service.md) provides access to vector data in a Kubernetes landscape.

## Run delivery

Use the prepared landscape to select and deliver application versions:

1. [Create a stage](./manage-delivery/stages.md) selects the vector for a delivery checkpoint and shows how to inspect its desired and active versions.
2. [Set up and run promotion flows](./manage-delivery/promote-vectors.md) configures recorded, approvable updates to the vector a stage selects.

These guides cover the progress of application delivery. The next section concerns the Konfidence installation itself.

## Operate the platform

[Upgrade Konfidence](./operate/upgrading-konfidence.md) points to the release-specific upgrade and migration information available for pre-release installations.

## Related

- [Getting started](../getting-started/index.md) installs Konfidence into a local kind cluster.
- [Core concepts](../core-concepts/index.md) explains vectors, stages, landscapes, and the delivery flow.
