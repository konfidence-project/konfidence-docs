---
title: Promote vectors
description: Define a promotion flow to a target stage, approve promotions, and verify the target.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Promote vectors

Define a [promotion](/docs/reference/glossary#promotion) flow so that a stage selects its vector through a recorded, approvable step. A `VectorPromotionConfig` names a source and a target stage. Konfidence creates a `VectorPromotion` whenever the source vector differs from the vector the target stage selects. The promotion waits for approval if required. It then updates the target stage to reference that one concrete vector version.

[Delivery flow](../../core-concepts/delivery-flow.md) explains the model behind promotions.

## Prerequisites

- A [project](../control-access/projects.md) with a [landscape](./landscapes.md) and a target [stage](./stages.md).
- A source: a `VectorTemplate` that assembles vectors, see [Build vectors](/docs/develop-integrate/observe-improve/build-vectors), or another stage.
- `kubectl` access to the project namespace `kden-p-<PROJECT>`.
- For approvals: `kden` installed and the `pm` or `admin` role in the project. Check: `kden project list` shows the project.

Set the names used below:

```bash
export PROJECT=ecommerce-platform
export PROJECT_NAMESPACE=kden-p-$PROJECT
```

## Define the promotion flow

Save the following manifest as `promotion-config.yaml`. It promotes each vector the template `shop` assembles to the stage `integration` in the landscape `dev`:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: shop-to-integration
  namespace: kden-p-ecommerce-platform
spec:
  source:
    kind: VectorTemplate
    name: shop
  target:
    kind: Stage
    name: integration
    landscape: dev
  ttlAfterFinished: 24h
```

`landscape` is the name of the `Landscape` resource in the project namespace, not its managed namespace. Apply the manifest:

```bash
kubectl apply -f promotion-config.yaml
```

## Verify the references resolve

The config controller resolves the source and the target and reports the result in the `Ready` condition:

```bash
kubectl get vectorpromotionconfig shop-to-integration \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.conditions[?(@.type=="Ready")]}{"\n"}'
```

The condition has `status: "True"`. A `False` status names the reference that does not resolve in its message.

## Watch promotions appear

When the template assembles a vector that the target stage does not select yet, the controller creates a `VectorPromotion`:

```bash
kubectl get vectorpromotions \
  --namespace="$PROJECT_NAMESPACE" \
  --output=custom-columns='NAME:.metadata.name,SEQ:.spec.sequence,STATE:.status.state,VECTOR:.spec.vector'
```

A promotion from a `VectorTemplate` source runs without approval and reaches `Succeeded` on its own. A promotion from a `Stage` source starts in `Waiting`. Only one promotion per config executes at a time. The approved promotion with the highest sequence number executes next. Promotions with a lower sequence number that have not executed become `Superseded`.

## Approve a promotion

List the promotions of the config with their ids:

```bash
kden vector-promotion get --projectId "$PROJECT" --vectorPromotionConfigId shop-to-integration
```

Approve the promotion that is `Waiting`:

```bash
kden vector-promotion approve <VECTOR_PROMOTION_ID> --projectId "$PROJECT"
```

The promotion moves to `Ready` and then to `InProgress`. Approving twice is accepted without effect. The API answers `409` when the promotion is superseded, finished, or needs no approval.

## Verify the target stage

The stage now selects the promoted vector:

```bash
kubectl get stage integration \
  --namespace="$(kubectl get landscape dev --namespace="$PROJECT_NAMESPACE" --output=jsonpath='{.status.namespace}')" \
  --output=jsonpath='{.spec.vector}{"\n"}'
```

The output equals the promotion's `spec.vector`. The promotion records the same stage in `status.promotedStageRef`. [Manage stages](./stages.md) shows how to follow the rollout on the stage.

## Promotion states

`status.state` summarizes the promotion's conditions for display. The conditions are the source of truth.

| State | Meaning |
|-------|---------|
| `Waiting` | The promotion requires approval and has none yet. |
| `Ready` | Every gate has passed. The promotion is queued for execution. |
| `InProgress` | The promotion updates the target stage to reference the vector. |
| `Blocked` | The target does not resolve. The config's `Ready` condition names the cause. |
| `Succeeded` | The target stage references the vector. |
| `Failed` | Execution ended without success. The conditions name the reason. |
| `Superseded` | A promotion with a higher sequence number replaced this one. It can never be approved or executed. |

## Chain stages

To promote from one stage to the next, use a `Stage` source and name its landscape:

```yaml
spec:
  source:
    kind: Stage
    name: integration
    landscape: dev
  target:
    kind: Stage
    name: production
    landscape: prod
```

Promotions from a stage source require approval by default. Each config watches one source, so a three-stage flow needs two configs.

## Retain or delete finished promotions

Two fields on the config control cleanup:

- `ttlAfterFinished` deletes a promotion that time after it reaches a terminal state. Without it, promotions stay.
- `keepLastPromotions` keeps at most that many terminal promotions per config, default 10. The oldest beyond the bound are deleted.

Promotions that are not terminal are never deleted. Deleting the config deletes its promotions.

## What to do if it fails

- `Blocked`: read the config's `Ready` condition. The target stage or landscape does not exist or has a different name.
- `Failed` with reason `PromotionTimedOut`: the execution exceeded the fixed five-minute deadline. Inspect the target stage. The next vector the source selects creates a fresh promotion.
- No promotion appears: the source vector equals the target stage's vector, or a live promotion already pins the same vector. Check `kubectl get vectorpromotions`.
- `kden vector-promotion approve` returns `403`: the caller lacks the `pm` or `admin` role. See [Grant roles](../control-access/access-control.md).

## Next steps

- [Grant CI pipelines access](../control-access/grant-ci-access.md) lets a pipeline approve promotions.
- [Manage stages](./stages.md) inspects the rollout after a promotion succeeded.
