---
title: "Approve a promotion"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Approve a promotion

Approve an existing promotion so that its target stage selects the proposed vector. Your platform team configures the flow; you use the Konfidence CLI to make the release decision.

## Before you begin

- [Install the CLI](../start/install-cli.md) and configure it for your Konfidence API. The [login instructions](./dashboard-and-api.md#log-in-with-the-cli) explain the connection.
- Ask your platform team for the project and promotion configuration names.
- Your identity needs the project's `pm` or `admin` role. Use `kden project list` to check project visibility. [Project role bindings](./team-access.md) determine your role.

Set your project name. Replace the example value with the project you are releasing:

```bash
export PROJECT=ecommerce-platform
```

## Review and approve


For a flow with a `Stage` source, use its project and configuration names to list the promotions with their IDs. Replace `shop-to-integration` below if your configuration has a different name. Promotions from a VectorTemplate source need no approval.

```bash
kden vector-promotion get --projectId "$PROJECT" --vectorPromotionConfigId shop-to-integration
```

Approve the promotion that is `Waiting`:

```bash
kden vector-promotion approve <VECTOR_PROMOTION_ID> --projectId "$PROJECT"
```

The promotion moves to `Ready` and then to `InProgress`. Approving twice is accepted without effect. The API returns `409` when the promotion is superseded, finished, or needs no approval.

## Verify the decision

Run the same `kden vector-promotion get` command again to inspect the promotion. `Succeeded` means the target stage references the vector. It does not yet confirm that the vector is active. A platform operator can [inspect desired and active stage state](./stages.md#inspect-desired-and-active-state) to follow the rollout.


See [Promotion states](./promotion-flows.md#promotion-states) for the meaning of each state.

## If approval fails

- `403`: your identity lacks the `pm` or `admin` project role. Ask a project administrator to check the binding.
- `409`: the promotion is superseded, finished, or needs no approval. Inspect the current promotion before trying another decision.

For flow setup, retention, and Kubernetes inspection, see [Set up promotion flows](./promotion-flows.md).
