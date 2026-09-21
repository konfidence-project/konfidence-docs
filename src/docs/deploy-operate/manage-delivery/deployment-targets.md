---
title: Manage deployment targets
description: Create one deployment target per deployment class in a landscape and verify that its deployer accepts it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Manage deployment targets

Create a deployment target to make a deployment class available in a landscape. A target names the class and carries a `connection` block that tells the class's deployer where to deploy. The deployer defines what the block contains and reports whether it accepts the target.

For the relationship between artifacts, deployment classes, deployers, targets, and landscapes, see the [Deployment model](../../core-concepts/deployment-model.md).

## Prerequisites

- A [ready landscape](./landscapes.md).
- A deployer that provides the class you need. Check: `kubectl get deploymentclasses` lists it. See [Manage deployers](../install/deployer/overview.md).
- The connection block for that deployer, from its page. For the Kubernetes deployer, see [Connection types](../install/deployer/kubernetes.md#connection-types).
- Permission to create resources in the landscape namespace.

Set the names used below:

```bash
export PROJECT_NAMESPACE=kden-p-ecommerce-platform
export LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.namespace}')
```

## Pick the deployment class

Each artifact names the deployment class it requires. A landscape needs one ready target for every class its stages deploy. List the classes installed deployers advertise:

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

## What to do if it fails

- `Ready` stays `False` with reason `UnsupportedType`: no deployer owns the class. Check the class name against `kubectl get deploymentclasses`.
- `Ready` stays `False` with another reason: the connection block is wrong for the deployer. The reason and message come from the deployer. For the Kubernetes deployer, see [Connection types](../install/deployer/kubernetes.md#connection-types).
- The target never gets a condition: the deployer that owns the class is not running. See [Install the deployer](../install/deployer/kubernetes.md#install-the-deployer).

## Next steps

- [Manage stages](./stages.md) creates stages that deploy through the landscape's targets.
- [Types of artifacts](../../develop-integrate/artifact-types/index.md) explains how developers select a class for an artifact.
- [DeploymentTarget CRD reference](../../reference/crd.md#deploymenttarget) lists all fields.
