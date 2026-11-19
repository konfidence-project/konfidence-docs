---
title: "Cloud Foundry prototype capabilities"
scope: "Cloud Foundry · Proof of concept"
editLink: false
lastUpdated: false
---
# Cloud Foundry prototype capabilities

The Cloud Foundry deployer is a proof of concept for deploying and removing a multi-target application (MTA).

## What the prototype covers

The recorded proof of concept demonstrates basic MTA deployment and removal. It does not cover every lifecycle edge case. Reading the deployment target configuration from a ConfigMap remains an open task in the prototype ticket.

## What remains shared

The [Konfidence deployment model](../../core/deployment-model.md) distinguishes the application version from the platform that deploys its artifacts. Projects, vectors, stages, and promotions remain the shared concepts. A Cloud Foundry integration supplies the platform-specific execution and configuration.

For an installation you can try today, follow the [Kubernetes-based Quickstart](../../start/quickstart.md).
