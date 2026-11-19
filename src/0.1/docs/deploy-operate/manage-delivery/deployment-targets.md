---
title: Configure deployment targets for a landscape
description: Create one deployment target per deployment class in a landscape and verify that its deployer accepts it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Configure deployment targets for a landscape {#manage-deployment-targets}

Create a [deployment target](../../reference/glossary.md#deployment-target) to make a [deployment class](../../reference/glossary.md#deployment-class) available in a [landscape](../../reference/glossary.md#landscape). A target names the class and carries a `connection` block that tells the class's [deployer](../../reference/glossary.md#deployer) where to deploy. The deployer defines what the block contains and reports whether it accepts the target.

The deployer is installed centrally. This task configures a landscape to use one of its classes; repeat it for each class the landscape's applications need.

For the relationship between artifacts, deployment classes, deployers, targets, and landscapes, see the [Deployment model](../../core-concepts/deployment-model.md).

## Prerequisites

- A [ready landscape](./landscapes.md).
- A deployer that provides the class you need. Check: `kubectl get deploymentclasses` lists it. See [Choose a deployer](../install/deployer/overview.md).
- The connection block for that deployer, from its page. For the Kubernetes deployer, see [Connection types](../install/deployer/kubernetes.md#connection-types).
- `kubectl` access with permission to read `DeploymentClass` and `Landscape` resources, and to create and read `DeploymentTarget` resources in the landscape namespace.

Set the names used below:

```bash
export PROJECT_NAMESPACE=kden-p-ecommerce-platform
export LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.namespace}')
```

## Choose the deployment class

Each [artifact](../../reference/glossary.md#artifact) names the deployment class it requires. A landscape needs one ready target for every class its [stages](../../reference/glossary.md#stage) deploy. List the classes installed deployers advertise:

```bash
kubectl get deploymentclasses
```

Use the exact value from the `NAME` column as `spec.deploymentClassName`. A landscape can hold only one target per class. The class name is immutable after creation, because changing it would hand the target to another deployer.

## Create the target

Save the following manifest as `deployment-target.yaml`. The `connection` block is the Kubernetes deployer's `local` connection, which deploys into the cluster the deployer runs in:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: helm-local
  namespace: kden-l-dev
spec:
  deploymentClassName: helm.konfidence.cloud
  connection:
    type: local
```

Replace `kden-l-dev` with the value of `LANDSCAPE_NAMESPACE`, then apply the manifest:

```bash
kubectl apply -f deployment-target.yaml
```

## Verify the target

The deployer that owns the class validates the target and sets its `Ready` condition:

```bash
kubectl wait deploymenttarget/helm-local \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --for=condition=Ready \
  --timeout=60s
```

The command returns `condition met`. What `Ready` checks is up to the deployer. It can include configuration validation, credential checks, or a connectivity check. List all targets of the landscape:

```bash
kubectl get deploymenttargets --namespace="$LANDSCAPE_NAMESPACE"
```

## Troubleshooting

- `Ready` stays `False` with reason `UnsupportedType`: no deployer owns the class. Check the class name against `kubectl get deploymentclasses`.
- `Ready` stays `False` with another reason: the connection block is wrong for the deployer. The reason and message come from the deployer. For the Kubernetes deployer, see [Connection types](../install/deployer/kubernetes.md#connection-types).
- The target never gets a condition: the deployer that owns the class is not running. See [Install the Kubernetes deployer](../install/deployer/kubernetes.md#install-the-deployer).

## Next steps

- [Connect artifact registries](../install/connect-registries.md#give-the-deployer-credentials) supplies credentials for private artifacts in this landscape.
- [Choose landscape services](../install/runtime-components/overview.md) identifies the runtime services your applications need.
- [Create a stage](./stages.md) selects a vector to deploy through the prepared landscape's targets.
- [Types of artifacts](../../develop-integrate/artifact-types/index.md) explains how developers select a class for an artifact.
- [DeploymentTarget CRD reference](../../reference/crd.md#deploymenttarget) lists all fields.
