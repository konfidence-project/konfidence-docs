---
title: Deliver an application
description: Use the Konfidence CLI to explore the deployed example application and promote it from development to production.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Deliver an application

In the [Quickstart](./quickstart.md), Konfidence was installed and the example application was deployed to a development [stage](../reference/glossary.md#stage). This guide uses the [kden CLI](./install-cli.md) to explore that setup and then promote the example application to the production stage.

## Prerequisites

- A completed [Quickstart](./quickstart.md): a local cluster with the example application running.
- The [kden CLI](./install-cli.md) installed.
- The Konfidence API reachable at `http://localhost:8090`. Keep the port-forward from the Quickstart running:

  ```bash
  kubectl -n konfidence-system port-forward svc/konfidence-api 8090:8090
  ```


The dashboard's **Landscapes** view shows the starting point: `dev-eu12` is live with the example application, and `prod-eu12` has no version yet.

![Konfidence dashboard Landscapes view: the dev-eu12 landscape is live and matches its target vector, while prod-eu12 has no target version and nothing active yet.](./screenshot_dashboard_dev.png)

## Inspect the existing resources

The Quickstart created a [project](../reference/glossary.md#project), two [landscapes](../reference/glossary.md#landscape), their stages, and a [promotion config](../reference/glossary.md#vectorpromotionconfig). Review each one with the CLI.

### Project

A project is the organizational boundary for an application's resources. It owns a dedicated namespace that holds its landscapes, [vector templates](../reference/glossary.md#vectortemplate), and promotion configs.

::: code-group

```console [kden]
$ kden project list --output pretty
 ID            Name
 example-app   Example App
```

```console [kubectl]
$ kubectl get projects
NAME          DISPLAY NAME   NAMESPACE            READY   AGE
example-app   Example App    kden-p-example-app   True    5m
```

:::

Use the project ID, `example-app`, in the commands that follow.

### Landscapes

A landscape is an operational boundary within a project. It groups the stages, [deployment targets](../reference/glossary.md#deployment-target), and deployment resources that share operational requirements, and it owns a namespace for them.

::: code-group

```console [kden]
$ kden landscape list -p example-app --output pretty
 ID     Name
 dev    Development
 prod   Production
```

```console [kubectl]
$ kubectl -n kden-p-example-app get landscapes
NAME   DISPLAY NAME   PROJECT       NAMESPACE     READY   AGE
dev    Development    example-app   kden-l-dev    True    5m
prod   Production     example-app   kden-l-prod   True    5m
```

:::

### Stages

A stage is a checkpoint in the [delivery flow](../reference/glossary.md#delivery-flow) that selects one [vector](../reference/glossary.md#vector) to deliver. List the stages in the `dev` landscape.

::: code-group

```console [kden]
$ kden stage list -p example-app -l dev
{
  "data": [
    {
      "id": "dev-eu12",
      "landscapeId": "dev",
      "name": "dev-eu12",
      "activeStageVersion": {
        "status": "Ready",
        "vector": "https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb"
      }
    }
  ]
}
```

```console [kubectl]
$ kubectl -n kden-l-dev get stages
NAME       READY   AGE   VECTOR                                                                                                           ACTIVE-VERSION
dev-eu12   True    5m    https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb   dev-eu12-5dk7wm6b9mxzb
```

:::

The `activeStageVersion` is the vector that `dev-eu12` runs, and its status is `Ready`. This is the example application deployed to development.

The `prod-eu12` stage in the `prod` landscape has no `activeStageVersion` yet. The [promotion](../reference/glossary.md#promotion) fills it in once you approve it.

### Promotion

A promotion config defines a promotion flow from a source stage to a target stage. When the source vector differs from the target's, Konfidence creates a promotion that updates the target stage to select that vector, without rebuilding or copying it.

::: code-group

```console [kden]
$ kden vector-promotion list -p example-app
{
  "data": [
    {
      "id": "dev-to-prod",
      "source": { "kind": "Stage", "landscape": "dev", "name": "dev-eu12" },
      "target": { "kind": "Stage", "landscape": "prod", "name": "prod-eu12" },
      "promotions": [
        {
          "id": "dev-to-prod-1",
          "requireApproval": true,
          "status": "Waiting",
          "vector": "https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb"
        }
      ]
    }
  ]
}
```

```console [kubectl]
$ kubectl -n kden-p-example-app get vectorpromotion
NAME            CONFIG        SOURCE     TARGET      STATE     AGE
dev-to-prod-1   dev-to-prod   dev-eu12   prod-eu12   Waiting   5m
```

:::

The promotion requires manual approval by default before it reaches production. The `dev-to-prod-1` promotion is in the `Waiting` state, holding the same vector that runs in `dev-eu12`.

## Approve the promotion to production

Approve the waiting promotion by its ID, `dev-to-prod-1`:

```bash
kden vector-promotion approve dev-to-prod-1 -p example-app
```

Pass the promotion ID (`dev-to-prod-1`), not the config ID (`dev-to-prod`). Konfidence updates `prod-eu12` to select that vector and deploys it.

Confirm the promotion succeeded:

::: code-group

```console [kden]
$ kden vector-promotion list -p example-app
{
  "data": [
    {
      "id": "dev-to-prod",
      "source": { "kind": "Stage", "landscape": "dev", "name": "dev-eu12" },
      "target": { "kind": "Stage", "landscape": "prod", "name": "prod-eu12" },
      "promotions": [
        {
          "id": "dev-to-prod-1",
          "requireApproval": true,
          "status": "Succeeded",
          "vector": "https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb"
        }
      ]
    }
  ]
}
```

```console [kubectl]
$ kubectl -n kden-p-example-app get vectorpromotion
NAME            CONFIG        SOURCE     TARGET      STATE       AGE
dev-to-prod-1   dev-to-prod   dev-eu12   prod-eu12   Succeeded   6m
```

:::

The `dev-to-prod-1` promotion is now in the `Succeeded` state and records who approved it. Check that `prod-eu12` runs the vector:

::: code-group

```console [kden]
$ kden stage list -p example-app -l prod
{
  "data": [
    {
      "id": "prod-eu12",
      "landscapeId": "prod",
      "name": "prod-eu12",
      "activeStageVersion": {
        "status": "Ready",
        "vector": "https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb"
      }
    }
  ]
}
```

```console [kubectl]
$ kubectl -n kden-l-prod get stages
NAME        READY   AGE   VECTOR                                                                                                           ACTIVE-VERSION
prod-eu12   True    6m    https://ghcr.io/konfidence-project/example-app//github.com/konfidence-project/example-app/vector:0.1.0-f486ecb   prod-eu12-7f3k2m9d4qxzc
```

:::

`prod-eu12` now runs the same vector version as `dev-eu12`. The verified application was promoted, not rebuilt.

## What you've learned

You have:

- inspected the project, landscapes, stages, and promotion the Quickstart created,
- approved the waiting promotion with the kden CLI, and
- confirmed the same vector runs in production.

## Next steps

- [Create your own app](./create-vector.md) to build and deliver your own vector.
- [Promotions and Delivery Flow](../core-concepts/delivery-flow.md) to see how promotions move a vector across stages.
