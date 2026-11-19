---
title: Set up and run promotion flows
description: Define a promotion flow to a target stage, approve promotions, and verify the target.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Set up and run promotion flows {#promote-vectors}

Define a [promotion](../../reference/glossary.md#promotion) flow so that a stage selects its vector through a recorded, approvable step. A `VectorPromotionConfig` names a source and a target stage. Konfidence creates a `VectorPromotion` whenever the source vector differs from the vector the target stage selects. The promotion waits for approval if required. It then updates the target stage to reference the concrete vector version.

[Delivery flow](../../core-concepts/delivery-flow.md) explains the model behind promotions.

Use the setup sections to configure sources, target stages, and retention through Kubernetes. Once a flow exists, release managers or pipelines with the required project role can [approve promotions](#approve-a-promotion) through `kden`. The inspection sections distinguish a successful promotion from the stage's subsequent rollout.

## Prerequisites

- A [project](../control-access/projects.md) with a [landscape](./landscapes.md) and a target [stage](./stages.md).
- A source: either a `VectorTemplate` that assembles vectors, as described in [Build vectors](../../develop-integrate/observe-improve/build-vectors.md), or another `Stage` resource.
- For setup: `kubectl` access with Kubernetes permission to create and read `VectorPromotionConfig` resources in the project namespace `kden-p-<PROJECT>`.
- For the Kubernetes inspection commands: permission to read promotions and `Landscape` resources in the project namespace, and `Stage` and rollout resources in the landscape namespace.
- For approvals: `kden` installed and configured for the Konfidence API, and the `pm` or `admin` role in the project. Use `kden project list` to check project visibility; [project role bindings](../control-access/access-control.md) determine the granted role.

The approval role does not grant the Kubernetes permissions used for setup and inspection. A platform administrator can configure the flow and pass its project and configuration names to the person or pipeline responsible for approvals.

Set the names used below:

```bash
export PROJECT=ecommerce-platform
export PROJECT_NAMESPACE=kden-p-$PROJECT
```

## Set up the promotion flow {#define-the-promotion-flow}

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

### Verify the references resolve

The config controller resolves the source and the target and reports the result in the `Ready` condition:

```bash
kubectl get vectorpromotionconfig shop-to-integration \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.conditions[?(@.type=="Ready")]}{"\n"}'
```

The condition has `status: "True"`. A `False` status names the reference that does not resolve in its message.

### Chain stages

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

### Retain or delete finished promotions

Two fields on the config control cleanup:

- `ttlAfterFinished` deletes a promotion after the configured interval once it reaches a terminal state. Without it, promotions stay.
- `keepLastPromotions` sets the maximum number of terminal promotions retained per configuration. The default is 10. Older promotions beyond the limit are deleted.

Promotions that are not terminal are never deleted. Deleting the config deletes its promotions.

## Run the promotion flow

### Watch promotions appear

When the template assembles a vector that the target stage does not select yet, the controller creates a `VectorPromotion`:

```bash
kubectl get vectorpromotions \
  --namespace="$PROJECT_NAMESPACE" \
  --output=custom-columns='NAME:.metadata.name,SEQ:.spec.sequence,STATE:.status.state,VECTOR:.spec.vector'
```

A promotion from a `VectorTemplate` source runs without approval and reaches `Succeeded` on its own. A promotion from a `Stage` source starts in `Waiting`. Only one promotion per config executes at a time. The approved promotion with the highest sequence number executes next. Promotions with a lower sequence number that have not executed become `Superseded`.

### Approve a promotion

For a flow with a `Stage` source, use its project and configuration names to list the promotions with their IDs. Replace `shop-to-integration` below if your configuration has a different name. The template-source example above needs no approval.

```bash
kden vector-promotion get --projectId "$PROJECT" --vectorPromotionConfigId shop-to-integration
```

Approve the promotion that is `Waiting`:

```bash
kden vector-promotion approve <VECTOR_PROMOTION_ID> --projectId "$PROJECT"
```

The promotion moves to `Ready` and then to `InProgress`. Approving twice is accepted without effect. The API returns `409` when the promotion is superseded, finished, or needs no approval.

## Inspect the result

### Verify the target stage

The stage now selects the promoted vector:

```bash
kubectl get stage integration \
  --namespace="$(kubectl get landscape dev --namespace="$PROJECT_NAMESPACE" --output=jsonpath='{.status.namespace}')" \
  --output=jsonpath='{.spec.vector}{"\n"}'
```

The output equals the promotion's `spec.vector`. The promotion records the same stage in `status.promotedStageRef`. This confirms the selected vector, not its activation. [Inspect desired and active state](./stages.md#inspect-desired-and-active-state) to follow the subsequent rollout on the stage.

### Promotion states

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

## Troubleshooting

- `Blocked`: read the config's `Ready` condition. The target stage or landscape does not exist or has a different name.
- `Failed` with reason `PromotionTimedOut`: the execution exceeded the fixed five-minute deadline. Inspect the target stage. The next vector the source selects creates a fresh promotion.
- No promotion appears: the source vector equals the target stage's vector, or a live promotion already pins the same vector. Check `kubectl get vectorpromotions`.
- `kden vector-promotion approve` returns `403`: the caller lacks the `pm` or `admin` role. See [Grant teams access to a project](../control-access/access-control.md).

## Next steps

- [Grant CI pipelines access](../control-access/grant-ci-access.md) lets a pipeline approve promotions.
- [Verify the active version](./stages.md#verify-the-active-version) after a promotion succeeds to confirm which vector is receiving traffic.
