---
title: Create a landscape
description: Create a landscape within a project and verify its managed deployment scope.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Create a landscape {#manage-landscapes}

Create a [landscape](../../reference/glossary.md#landscape) to establish an operational boundary for [stages](../../reference/glossary.md#stage) and their deployment resources. Konfidence manages a dedicated namespace for each landscape.

Use Kubernetes access to create and maintain the landscape. Once its namespace is ready, configure deployment targets, registry credentials, and landscape services before creating stages.

For guidance on choosing landscape boundaries, see [Landscapes and stages](../../core-concepts/landscapes-and-stages.md). To understand how a landscape connects [artifacts](../../reference/glossary.md#artifact) to infrastructure, see the [Deployment model](../../core-concepts/deployment-model.md).

## Prerequisites

Before you begin, make sure you have:

- A [project](../control-access/projects.md) in which to create the landscape.
- Kubernetes permission to create and read `Landscape` resources in the namespace of the [project](../../reference/glossary.md#project). The update and delete sections also require the corresponding Kubernetes permissions.
- Access to the Konfidence cluster through `kubectl`.

## Create a landscape

Save the following manifest as `landscape.yaml`. It defines a `Landscape` resource in the namespace managed by its project:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Landscape
metadata:
  name: prod-eu
  namespace: kden-p-ecommerce-platform
spec:
  displayName: Production - EU Region
```

Apply the manifest:

```bash
kubectl apply -f landscape.yaml
```

Konfidence creates and manages a namespace for the landscape. By default, its name starts with `kden-l-` and includes the landscape name and a stable suffix.

::: details Use a specific namespace name

Konfidence normally generates a collision-resistant namespace name. If an integration requires a predetermined name, set `spec.namespace` when creating the landscape:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Landscape
metadata:
  name: prod-eu
  namespace: kden-p-ecommerce-platform
spec:
  displayName: Production - EU Region
  namespace: ecommerce-prod-eu
```

The namespace setting is immutable. Decide whether an override is necessary before creating the landscape.

:::

## Verify the landscape

Inspect the landscape to find its managed namespace:

```bash
kubectl get landscape prod-eu -n kden-p-ecommerce-platform
```

The output includes the managed namespace and the landscape's readiness status:

```text
NAME      DISPLAY NAME             PROJECT              NAMESPACE                READY   AGE
prod-eu   Production - EU Region   ecommerce-platform   kden-l-prod-eu-5w54scz7   True    46h
```

When the landscape is ready, the `READY` column shows `True` and the `NAMESPACE` column shows its managed namespace.

## Update the display name

You can change the display name without changing the resource or namespace name:

```bash
kubectl patch landscape prod-eu \
  --namespace=kden-p-ecommerce-platform \
  --type=merge \
  --patch='{"spec":{"displayName":"Production - European Union"}}'
```

## Delete a landscape

Deleting a landscape also deletes its managed namespace and the resources contained in it, including stages and deployed artifacts. Confirm that the landscape is no longer needed before deleting it.

```bash
kubectl delete landscape prod-eu \
  --namespace=kden-p-ecommerce-platform
```

Konfidence keeps the landscape in a terminating state until its managed namespace and all associated resources have been removed.

## Next steps

- [Configure deployment targets for a landscape](./deployment-targets.md) makes the required deployment classes available.
- [Give the deployer registry credentials](../install/connect-registries.md#give-the-deployer-credentials) in this landscape when artifacts come from private registries.
- [Choose landscape services](../install/runtime-components/overview.md) identifies services to install alongside your applications.
- [Create a stage](./stages.md) once the landscape is prepared.
- Consult the [Landscape CRD reference](../../reference/crd.md#landscape) for all fields.
