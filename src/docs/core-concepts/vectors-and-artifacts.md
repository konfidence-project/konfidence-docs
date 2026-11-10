---
title: Artifacts and vectors
description: Learn how artifacts, aliases, and vectors define an application version in Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Artifacts and vectors

An artifact describes one piece of your software, such as a microservice, a configuration file, or an asset. A vector is the complete, immutable snapshot of your application that Konfidence delivers.
This page explains both concepts, how artifact aliases link them, and how to define the assembly that produces a vector from your artifacts.

## Artifacts

An [artifact](../reference/glossary.md#artifact) describes one piece of your software, such as a microservice, a configuration file, or an asset.
Development teams usually build and publish artifacts in their continuous integration (CI) pipelines.

Artifacts are packaged via Open Component Model (OCM). They contain a reference to a build result, such as a Docker image, and its metadata.
The artifact can point to the deployable content or include binary resources directly.

## Artifact aliases

An [artifact alias](../reference/glossary.md#artifact-alias) is a dynamic reference (movable pointer) that tells Konfidence which artifact is included in the vector assembly.

An alias can describe any dimension that matters to your delivery model, for example:

- Maturity, such as `experimental` or `stable`.
- Time, such as `latest` or `nightly`.
- Source branch, such as `main` or `develop`.
- Team-specific or product-specific tracks.

In most setups, one branch-based alias is enough. For example, a service publishes each successful build from the main branch under the `main` alias. The alias then acts as a movable pointer that lets the `VectorTemplate` custom resource detect artifact changes without requiring you to update the template for every new build.

## Vectors

A [vector](../reference/glossary#vector) is an OCM component with a fixed collection of artifacts that belong together. It is a complete, immutable snapshot of your application at a specific point in time.

Because a vector is immutable, the exact combination of services you tested is the exact combination you deliver.
When an artifact reference changes, Konfidence creates a new vector instead of changing an existing one.

You can define vectors for different purposes, for example:

- A production vector with stable artifact aliases.
- A preview vector with experimental artifact aliases.
- A team-focused vector that contains only the services owned by one team.

A vector is the complete application version that Konfidence moves through the [Delivery flow](./delivery-flow.md).

## How they work together

A CI pipeline publishes each artifact as a component version. [`VectorTemplate`](../reference/glossary#vectortemplate) assembles a set of artifacts into a vector, either by resolving aliases that track moving build outputs, or by referencing specific component versions directly.

<DrawioDiagram src="/assets/diagrams/artifact-to-vector-flow.drawio" />

## Related pages

- [Delivery flow](./delivery-flow.md) explains how vectors move from build outputs to controlled [stage](../reference/glossary.md#stage) state.
- [Landscapes and stages](./landscapes-and-stages.md) explains where vectors are delivered and how stages express the desired application version.
- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md) explains the task-oriented flow for packaging and publishing build outputs as artifacts, including optional alias creation.
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md) explains the task-oriented flow for assembling vectors.
