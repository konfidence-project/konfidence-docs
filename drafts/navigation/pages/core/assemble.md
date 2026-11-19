---
title: "Assemble"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Assemble

Combine the artifact versions that belong together into one immutable vector. A change to an artifact or versioned configuration produces a new application version.

## Before you begin

[Publish your artifacts](./publish-artifacts.md) and get access to your Konfidence project namespace. If you are preparing the team environment, [create a project](./projects.md) and [grant teams access](./team-access.md) first. A platform administrator provides the [Konfidence installation](./install.md).

## Define the application version

1. [Assemble a vector](./build-vectors.md) with a `VectorTemplate`. It resolves the artifacts and records the resulting vector reference.
2. [Add configuration to a vector](./vector-configuration.md) when your application needs versioned settings or feature flags.
3. [Configure signing and verification](./signing.md) when your workflow requires signed artifacts or vectors.

These tasks belong to Konfidence core. How an application reads vector data depends on its runtime; the [Kubernetes guides](../deployers/kubernetes/vector-data.md) describe the current implementation.

## Result

You have a concrete vector reference identifying the application version. Continue with [Deploy](./deploy.md) to select that version for a stage and inspect its rollout.
