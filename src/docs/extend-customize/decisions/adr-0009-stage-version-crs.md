---
id: ADR-0009
title: "StageVersion custom resources"
description: "Refactoring of Landscape Control Plane domain model with StageVersion custom resources"
status: proposed
authors: [JoergBastian, niklasschoenberger, schulzh]
category: Architecture Pattern
impact: Medium
dependencies: []
pageClass: adr
outline: deep
---
# ADR-0009: StageVersion custom resources

<AdrHeader />

## Context

While implementing the Stage Controller, some issues were identified which made the model not ideal.

First, the Stage being mutable, it was easy to orchestrate the different associations between the Stage and the other objects (VectorDeploymentUsage, Migration, Activation),as these should behave immutable. It was also not easy to follow the current actual state of a stage, as these associations could relate to an older version of the Stage.

Second, the creation order of the VectorDeploymentUsage and the VectorDeployment was not ideal. The initial thought was to create the VectorDeploymentUsage first, then the VectorDeployment. However, its unnatural to create one object and then watch another one for its status. Additionally, while we wanted to enforce that VectorDeployments only exist with at least one usage, this is not what kubernetes could enforce naturally.

Third, we identified that additional usages by other controllers would only ever be valid in the context of a given stage, which was not reflected in the model.

## Considered Solutions


- Adapting the VectorDeployment and its Usage lifecycle
- Introducing a StageVersion CRD to represent the immutable state of a Stage at a given point in time

## Decision

We decided to introduce a new CR called **StageVersion** to represent the immutable state of a Stage at a given point in time. This allows us to track the history of changes to a Stage and ensures that associations with other objects (like VectorDeploymentUsage, Migration, Activation) are always referencing a specific version of the Stage. A change to the Stage will create a new StageVersion, which will then be used to create and reference the other objects like VectorDeployment, Migration, and Activation.

We will add a new CR called **StageVersionUsage** to fulfil the role of the previous VectorDeploymentUsage. This adds the context of the stage to the usage and allows us to enforce that usages are only valid in the context of a specific StageVersion. Additionally, this usage is designed to be added after a StageVersion has been created (by the Stage Controller), so that its lifecycle matches the one of kubernetes objects better.

## Consequences


- The stage controller must be adapted to create and manage StageVersion resources.
- The stage controller must be changed to reconcile the StageVersion to create the VectorDeployment, Migration and Activation objects.
- The StageVersionUsage must be added to the model to represent the usage of a VectorDeployment in the context of a specific StageVersion.
- The VectorDeploymentUsage must be removed from the model, as it is no longer needed.

