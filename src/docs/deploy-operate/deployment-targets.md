---
title: Managing Deployment Targets
description: Connect a landscape to infrastructure through the deployment classes provided by installed deployers.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Managing Deployment Targets

Configure a deployment target to tell a deployer where artifacts of a particular deployment class should run. A target belongs to one landscape and contains the connection information required by its deployer.

## Prerequisites

Before you begin, make sure you have:

- a [ready landscape](./landscapes.md);
- an installed deployer that supports the required artifact format and target platform;
- credentials for the destination when it is not local to the deployer;
- permission to create resources in the landscape namespace.

## Discover available deployment classes

Deployers advertise their capabilities through cluster-scoped `DeploymentClass` resources:

```bash
kubectl get deploymentclasses
```

The Kubernetes landscape orchestrator commonly provides classes such as `helm.konfidence.cloud` and `kustomize.konfidence.cloud`. Use the exact value from the `NAME` column as `spec.deploymentClassName`.

Each artifact identifies the deployment class it requires. A landscape needs one ready target for every class used by the vectors delivered to its stages.

## Get the landscape namespace

Deployment targets and their connection resources must be created in the namespace managed by the landscape:

```bash
LANDSCAPE_NAMESPACE=$(kubectl get landscape prod-eu \
  --namespace=kden-p-ecommerce-platform \
  --output=jsonpath='{.status.namespace}')
```

## Configure a local Kubernetes target

Use a `local` connection when the Kubernetes deployer should deploy through its local cluster connection:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: helm-local
  namespace: <landscape-namespace>
spec:
  deploymentClassName: helm.konfidence.cloud
  connection:
    type: local
```

Replace `<landscape-namespace>` with the value obtained from the landscape status, then apply the manifest:

```bash
kubectl apply -f deployment-target.yaml
```

## Configure a remote Kubernetes target

For a remote Kubernetes cluster, store its kubeconfig in a Secret in the landscape namespace. The Kubernetes landscape orchestrator accepts kubeconfig data under `value` or `value.yaml`.

```bash
kubectl create secret generic prod-eu-kubeconfig \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --from-file=value="$HOME/.kube/prod-eu.yaml"
```

Reference that Secret from the target:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: helm-prod-eu
  namespace: <landscape-namespace>
spec:
  deploymentClassName: helm.konfidence.cloud
  connection:
    type: kubeconfig
    ref:
      kind: Secret
      name: prod-eu-kubeconfig
```

Connection types and referenced resources are defined by the deployer. Consult the deployer's documentation before configuring targets for other platforms.

## Verify the target

Wait for the responsible deployer to accept the target:

```bash
kubectl wait \
  --for=condition=Ready \
  deploymenttarget/helm-prod-eu \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --timeout=60s
```

Inspect all targets in the landscape:

```bash
kubectl get deploymenttargets --namespace="$LANDSCAPE_NAMESPACE"
```

The meaning of `Ready` is defined by the responsible deployer. It can include configuration validation, credential checks, or a connectivity check.

## Observe target problems

If a target does not become ready, inspect its conditions and the referenced connection resource:

```bash
kubectl describe deploymenttarget helm-prod-eu \
  --namespace="$LANDSCAPE_NAMESPACE"
```

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| The deployment class is not found. | The required deployer or class is not installed. | Install the deployer or use a class returned by `kubectl get deploymentclasses`. |
| A kubeconfig target reports a missing Secret. | The Secret name or namespace does not match the target reference. | Create the Secret in the landscape namespace and verify `connection.ref.name`. |
| Deployments report multiple matching targets. | More than one target uses the same deployment class in the landscape. | Keep one target for that class and remove the duplicate. |
| The target remains not ready. | Its deployer rejected the connection configuration. | Read the target conditions and the deployer's logs for the specific validation failure. |

## Next steps

- [Managing Stages](./stages.md) explains how to create stages that use the landscape's deployment targets.
- [Prepare your application](../develop-integrate/prepare-your-application.md) to select appropriate deployment classes for its artifacts.
- Consult the [DeploymentTarget CRD reference](../reference/crd.md#deploymenttarget) for all fields.
