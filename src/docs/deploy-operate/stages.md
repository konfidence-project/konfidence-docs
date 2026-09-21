---
title: Manage stages
description: Create a delivery checkpoint, select its desired vector, and inspect its active version.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Manage stages

Create a stage to select the vector Konfidence should deliver for a checkpoint. Stages are created in a landscape namespace and use the deployment targets configured there.

For help deciding how stages and landscapes should relate, see [Landscapes and stages](../core-concepts/landscapes-and-stages.md).

## Prerequisites

Before you begin, make sure you have:

- A [ready landscape](./landscapes.md) with targets for the vector's required deployment classes.
- A concrete vector reference in an Open Component Model (OCM)-compatible repository.
- Permission to create `Stage` resources in the landscape namespace.

## Get the landscape namespace

Read the namespace from the landscape status rather than deriving its generated name:

```bash
LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace=kden-p-ecommerce-platform \
  --output=jsonpath='{.status.namespace}')
```

## Create a stage

Save the following manifest as `stage.yaml`. It creates the stage in the landscape namespace and sets `spec.vector` to the concrete vector version it should deliver:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Stage
metadata:
  name: integration
  namespace: <landscape-namespace>
spec:
  vector: registry.example.com//konfidence.cloud/ecommerce:1.4.0
```

Replace `<landscape-namespace>` with the namespace retrieved in the previous step and apply the manifest:

```bash
kubectl apply -f stage.yaml
```

Konfidence records immutable rollout state for the selected vector and starts the deployment, migration, and activation lifecycle.

## Inspect desired and active state

List stages in the landscape:

```bash
kubectl get stages --namespace="$LANDSCAPE_NAMESPACE"
```

The `Vector` column is the vector currently desired by the stage. The `Active-Version` column identifies the immutable stage version currently active there. During a rollout, these values can represent different vectors.

Inspect the complete stage status and related rollout resources when you need more detail:

```bash
kubectl describe stage integration --namespace="$LANDSCAPE_NAMESPACE"
kubectl get stageversions --namespace="$LANDSCAPE_NAMESPACE"
```

Do not use the stage's `Ready` condition alone as proof that the desired vector is receiving traffic. Confirm the active stage version and inspect the related deployment or activation resources for the operational signal you need.

## Change the desired vector

Update `spec.vector` to select another immutable vector:

```bash
kubectl patch stage integration \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --type=merge \
  --patch='{"spec":{"vector":"registry.example.com//konfidence.cloud/ecommerce:1.5.0"}}'
```

Konfidence starts a new rollout while retaining resources required by the active version. In a managed delivery flow, a [promotion](./promote-vectors.md) normally performs this update and records the decision.

## Verify the active version

Read the active stage-version reference:

```bash
kubectl get stage integration \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --output=jsonpath='{.status.activeStageVersion.name}{"\n"}'
```

Then inspect the vector captured by that immutable stage version:

```bash
ACTIVE_VERSION=$(kubectl get stage integration \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --output=jsonpath='{.status.activeStageVersion.name}')

kubectl get stageversion "$ACTIVE_VERSION" \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --output=jsonpath='{.spec.vector}{"\n"}'
```

The output matches the desired vector after its activation has completed and it has become the active stage version.

## Troubleshooting

Use the following checks if stage creation or activation does not complete:

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| The `Stage` is rejected at admission. | It was created outside a landscape namespace. | Use the namespace reported in `Landscape.status.namespace`. |
| The desired vector does not deploy. | The landscape lacks a ready target for an artifact's deployment class. | Inspect the vector's required classes and [configure the missing target](./deployment-targets.md). |
| The active version does not change. | Deployment, migration, or activation has not completed. | Inspect the related `StageVersion`, `VectorDeployment`, `VectorMigration`, and `VectorActivation` resources. |
| The selected vector cannot be resolved. | The reference is incorrect or the registry is inaccessible. | Verify the concrete OCM reference and registry credentials. |

## Next steps

- [Promote vectors](./promote-vectors.md) to update stages through a controlled delivery flow.
- [Delivery flow](../core-concepts/delivery-flow.md#runtime-boundary) to understand the runtime lifecycle behind a rollout.
- Consult the [Stage CRD reference](../reference/crd.md#stage) for all fields.
