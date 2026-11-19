---
title: "Deploy"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Deploy

Select a concrete vector for a stage and verify that it becomes active. Konfidence coordinates the rollout; the deployer performs the work for the target platform.

## Before you begin

You need a vector reference, a ready landscape, and ready deployment targets for the vector's artifact types. If your platform team has prepared these, continue with **Select and verify a version** below.

For Kubernetes, [install the Kubernetes landscape orchestrator](../deployers/kubernetes/install.md) and configure its target. Its guides cover workload packaging, runtime services, and routing.

## Prepare the delivery environment

Platform administrators prepare the shared installation and destinations:

1. Review [System architecture](./system-architecture.md) and [High availability](./high-availability.md), then [install Konfidence](./install.md).
2. Configure [dashboard and API access](./dashboard-and-api.md) and [registry access](./connect-registries.md).
3. Use your team's [project](./projects.md), [create a landscape](./landscapes.md), and [configure its deployment targets](./deployment-targets.md).
4. Complete the setup described by your [deployer](../deployers/index.md), including its runtime services and activation requirements.

## Select and verify a version

1. [Create a stage](./stages.md) and set its desired vector.
2. [Inspect desired and active state](./stages.md#inspect-desired-and-active-state) while deployment proceeds.
3. [Verify the active version](./stages.md#verify-the-active-version) before treating the rollout as complete.

A stage selecting a vector does not by itself mean that version is receiving traffic. The [delivery flow](./delivery-flow.md#runtime-boundary) explains the deployment, data, task, and activation steps.

## Continue to another environment

After validating this application version, use [Promote](./release.md) to select the same vector for another stage without rebuilding it.
