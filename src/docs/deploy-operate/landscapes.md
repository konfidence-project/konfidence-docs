---
title: Managing Landscapes
description: Create a landscape within a project and verify its managed deployment scope.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Managing Landscapes

Create a landscape to establish an operational boundary for stages, deployment targets, credentials, and deployment resources. Konfidence manages a dedicated namespace for each landscape.

For the design model and guidance on choosing boundaries, see [Landscapes and Stages](../core-concepts/landscapes-and-stages.md).

## Prerequisites

Before you begin, make sure you have:

- a [project](./projects.md) in which to create the landscape;
- permission to create `Landscape` resources in the project's namespace;
- `kubectl` access to the Konfidence cluster.

## Create a landscape

Create the `Landscape` resource in the namespace managed by its project:

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

Have a look at the landscape to find its managed namespace:

```bash
kubectl get landscape prod-eu -n kden-p-ecommerce-platform 
```

The output should look like this:

```text
NAME       DISPLAY NAME             PROJECT              NAMESPACE                 READY   AGE
prod-eu    Production - EU Region   ecommerce-platform   kden-l-prod-eu-5w54scz7   True    46h
```

As soon as the landscape is `Ready`, it will show the name of the managed namespace.

## Update the display name

The display name is intended for people and can be changed without changing the resource or namespace identity:

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

- [Managing Deployment Targets](./deployment-targets.md) explains how to connect the landscape to infrastructure.
- [Managing Stages](./stages.md) explains how to define delivery checkpoints in the landscape.
- [Configure access control](./access-control.md) for the parent project.
- Consult the [Landscape CRD reference](../reference/crd.md#landscape) for all fields.
