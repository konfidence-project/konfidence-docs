---
title: Landscapes and Stages
description: Understand how landscapes provide operational boundaries while stages express application delivery intent.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Landscapes and Stages

Konfidence separates the place where applications run from the checkpoints through which application versions move. **Landscapes** organize deployment contexts with shared operational requirements. **Stages** select the application version intended for a particular checkpoint in the delivery process.

This separation lets organizations design delivery flows without tying them to a particular infrastructure topology.

## Overview

Application delivery usually has two different kinds of boundaries:

* **Operational boundaries** separate deployments by ownership, access, security, compliance, region, cost, or reliability requirements. Those boundaries focus on the question: Which deployments share the same operational rules and infrastructure context?
* **Delivery boundaries** represent checkpoints at which an application version is developed, evaluated, or released. The driving key question here is: Which application version should be present at this checkpoint?

Konfidence separates those boundaries into landscapes and stages. A landscape forms an operational boundary and described the underlying infrastructure. A stage represents a checkpoint in the delivery flow and focuses on the purpose it serves in the delivery flow and also which application version is served at this checkpoint

## Landscapes organize deployment contexts

A landscape is a logical group of stages, deployment targets, and the resources that support their deployments. The resources in one landscape share an operational context.

Organizations choose landscape boundaries according to their needs. A boundary might reflect:

- who can deploy and operate the application;
- security and network isolation requirements;
- regional or data-residency constraints;
- resource quotas, cost controls, and service levels;
- the infrastructure and deployers available to the application.

Common designs use landscapes for development and production, for geographic regions, or for combinations such as production in the EU. These are conventions rather than fixed environment types. Two landscapes can use the same underlying infrastructure, while one landscape can provide several kinds of deployment target.

Each landscape belongs to a [project](../deploy-operate/projects.md). Konfidence gives the landscape a dedicated scope for its stages, target configuration, credentials, and deployment resources. This keeps independently operated contexts separate while allowing one Konfidence control plane to manage them consistently.

## Stages express delivery intent

A stage is a logical checkpoint that selects one [vector](./vectors-and-artifacts.md). The vector is an immutable description of an application version; the stage expresses that this is the version Konfidence should deliver for the checkpoint.

Stage names describe the purpose of the checkpoint, not the infrastructure behind it. Depending on the delivery model, a landscape might contain:

- a development stage for each team;
- one shared integration stage;
- stable and experimental demonstration stages.

Changing the vector selected by a stage changes the desired application state. Konfidence then deploys, migrates, and activates that vector through its runtime lifecycle. The desired vector and the currently active vector version can differ while this transition is in progress.

Stages become a delivery flow when [promotions](./delivery-flow.md) connect them.

## How landscapes and stages work together

Projects provide the organizational context. Landscapes define operational boundaries within that context. Deployment targets connect each landscape to concrete infrastructure, while stages select the vectors to deliver there.

The following example shows how one project can separate development and production operations while each stage independently selects a vector.

<DrawioDiagram src="/assets/diagrams/landscapes-and-stages.drawio" />

In this example, team development and integration stages share the same underlying infrastructure of the development landscape. The production stages are isolated under stricter operational requirements. The EU and US stages may advance independently even when they select the same vector.

Stages in the same landscape can also [share deployments of reusable artifacts](../develop-integrate/artifact-types/#choose-whether-vectors-share-one-instance-of-your-artifact). For example, if two team vectors contain the same stable database artifact, Konfidence can reuse that deployment instead of creating one copy per stage. Separating the production landscape prevents this sharing from crossing the intended operational boundary.

::: details Why the concepts are separated

Landscapes and stages allow delivery flows to remain infrastructure-independent. Stages describe application delivery intent without encoding infrastructure details. And not every stage needs separate infrastructure. The landscape boundary makes this an explicit operational decision. Several development stages can share a low-cost landscape, while production stages can use landscapes divided by region or compliance regime.

Applications represented by different vectors often have many artifacts in common. Stages in one landscape can reuse compatible artifact deployments, which avoids unnecessary copies while preserving each stage's application-level identity.

:::

## Choosing boundaries

Place stages in the same landscape when they can safely share the same operational context and deployment targets. This is often appropriate for multiple teams' development stages or temporary demonstrations of experimental features.

Use separate landscapes when any of the operational concerns described above must be managed independently. In practical terms, ask whether the stages can share access policies, isolation, credentials, deployment destinations, resource controls, and service-level expectations. If any answer is no, separate landscapes make that boundary explicit.

Do not create a new landscape solely because a stage has a different name in the delivery flow. Conversely, do not place stages together merely because they use the same infrastructure technology. The landscape should reflect the boundary at which deployments are operated together.

## Related information

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains the immutable application versions selected by stages.
- [Promotions and Delivery Flow](./delivery-flow.md) explains how vectors move between delivery checkpoints.
- [Managing Landscapes](../deploy-operate/landscapes.md) explains how operators establish landscape boundaries.
- [Managing Deployment Targets](../deploy-operate/deployment-targets.md) explains how a landscape is connected to infrastructure.
- [Managing Stages](../deploy-operate/stages.md) explains how to define and inspect delivery checkpoints.
- [Define promotions](../deploy-operate/define-promotions.md) explains how to connect stages in a controlled delivery flow.
- [Vector Deployments](../deploy-operate/vector-deployments.md) explains the runtime lifecycle after a stage selects a vector.
