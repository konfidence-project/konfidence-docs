---
title: Landscapes and stages
description: Understand how landscapes provide operational boundaries while stages express application delivery intent.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Landscapes and stages

Konfidence separates the place where applications run from the checkpoints through which application versions move. **Landscapes** organize deployment contexts with shared operational requirements. **Stages** select the application version intended for a particular checkpoint in the delivery process.

This separation lets organizations design delivery flows independently of how their infrastructure is organized.

## Overview

Application delivery usually has two different kinds of boundaries:

- **Operational boundaries** separate deployments by ownership, access, security, compliance, region, cost, or reliability requirements. They answer the question: Which deployments share the same operational rules and infrastructure context?
- **Delivery boundaries** represent checkpoints at which an application version is developed, evaluated, or released. They answer the question: Which application version should be delivered to this checkpoint?

Konfidence represents these boundaries as landscapes and stages. A landscape groups resources that share operational requirements. A stage represents a checkpoint in the delivery flow and selects the application version to deliver there.

## Landscapes organize deployment contexts

A landscape is a logical group of stages, deployment targets, and the resources that support their deployments. The resources in one landscape share an operational context.

Organizations choose landscape boundaries according to their needs. A boundary might reflect:

- Who can deploy and operate the application.
- Security and network isolation requirements.
- Regional or data-residency constraints.
- Resource quotas, cost controls, and service levels.
- The infrastructure and deployers available to the application.

Common designs use landscapes for development and production, for geographic regions, or for combinations such as production in the EU. These are conventions rather than fixed environment types. Two landscapes can use the same underlying infrastructure, while one landscape can provide several kinds of [deployment target](./deployment-model.md#deployment-targets-configure-destinations).

Each landscape belongs to a [project](../deploy-operate/control-access/projects.md). Konfidence groups its stages, target configuration, credentials, and deployment resources within that landscape. This keeps independently operated contexts separate while allowing one Konfidence [control plane](../reference/glossary.md#control-plane) to manage them consistently.

## Stages express delivery intent

A stage is a logical checkpoint that selects one [vector](./vectors-and-artifacts.md). The vector is an immutable description of an application version; the stage expresses that this is the version Konfidence should deliver for the checkpoint.

Stage names describe the purpose of the checkpoint, not the infrastructure behind it. Depending on the delivery model, a landscape might contain:

- A development stage for each team.
- One shared integration stage.
- Stable and experimental demonstration stages.

Changing the vector selected by a stage changes the desired application state. Konfidence then deploys, migrates, and activates that vector through its runtime lifecycle. The desired vector and the currently active vector version can differ while this transition is in progress.

Stages become a delivery flow when [promotions](./delivery-flow.md) connect them.

## How landscapes and stages work together

Projects provide the organizational context. Landscapes define operational boundaries within that context. Deployment targets connect each landscape to concrete infrastructure, while stages select the vectors to deliver there.

The following example shows how one project can separate development and production operations while each stage independently selects a vector.

<DrawioDiagram src="/assets/diagrams/landscapes-and-stages.drawio" />

In this example, team development and integration stages share the development landscape's underlying infrastructure. The production stages are isolated under stricter operational requirements. The EU and US stages may advance independently even when they select the same vector.

Stages in the same landscape can also [share deployments of reusable artifacts](../develop-integrate/artifact-types/index.md#choose-whether-vectors-share-one-instance-of-your-artifact). For example, if two team vectors contain the same stable database artifact, Konfidence can reuse that deployment instead of creating one copy per stage. Separating the production landscape prevents this sharing from crossing the intended operational boundary.

::: details Why the concepts are separated

Landscapes and stages keep delivery flows independent of infrastructure. Stages select application versions without specifying infrastructure details. Several development stages can share a low-cost landscape, while production stages can use landscapes divided by region or compliance requirements.

Applications represented by different vectors often have many artifacts in common. Stages in one landscape can reuse compatible artifact deployments, which avoids unnecessary copies while each stage still selects its own vector.

:::

## Choosing boundaries

Place stages in the same landscape when they can safely share the same operational context and deployment targets. This is often appropriate for multiple teams' development stages or temporary demonstrations of experimental features.

Use separate landscapes when any of the operational concerns described above must be managed independently. In practical terms, ask whether the stages can share access policies, isolation, credentials, deployment destinations, resource controls, and service-level expectations. If any answer is no, separate landscapes make that boundary explicit.

Do not create a new landscape solely because a stage has a different name in the delivery flow. Conversely, do not place stages together merely because they use the same infrastructure technology. The landscape should reflect the boundary at which deployments are operated together.

## Related information

Use these pages to explore related concepts or configure the resources described here:

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains the immutable application versions selected by stages.
- [Promotions and Delivery Flow](./delivery-flow.md) explains how vectors move between delivery checkpoints.
- [Deployment model](./deployment-model.md) explains how artifacts, deployment classes, deployers, and targets connect.
- [Create a landscape](../deploy-operate/manage-delivery/landscapes.md) explains how operators establish landscape boundaries.
- [Configure deployment targets for a landscape](../deploy-operate/manage-delivery/deployment-targets.md) explains how a landscape is connected to infrastructure.
- [Create a stage](../deploy-operate/manage-delivery/stages.md) explains how to define and inspect delivery checkpoints.
- [Set up and run promotion flows](../deploy-operate/manage-delivery/promote-vectors.md) explains how to connect stages in a controlled delivery flow.
- [Delivery flow](./delivery-flow.md#runtime-boundary) explains the runtime lifecycle after a stage selects a vector.
