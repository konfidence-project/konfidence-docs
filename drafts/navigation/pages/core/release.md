---
title: "Promote"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Promote

Promote the same immutable vector to the next stage. Konfidence records the decision and updates that stage's selected version. Deployment then runs for the target stage.

## Approve a promotion

If your team has already configured a flow, follow [Approve a promotion](./approve-a-promotion.md). You need its project and configuration names, CLI access, and the project's `pm` or `admin` role.

## Configure a flow

[Set up promotion flows](./promotion-flows.md) to connect a vector template or source stage to a target stage. The guide covers source selection, retention, and inspection. [Grant teams access](./team-access.md) or [grant CI pipelines access](./ci-access.md) for approvals.

## Verify the outcome

`Succeeded` means the target stage selects the promoted vector. [Verify the active version](./stages.md#verify-the-active-version) to confirm the result of the subsequent deployment.

For a complete example from development to production, follow [Deliver an application](../start/deliver-an-application.md).
