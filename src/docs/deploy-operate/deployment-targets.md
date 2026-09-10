---
title: Managing Deployment Targets
description: Connect a landscape to infrastructure through the deployment classes provided by installed deployers.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Managing Deployment Targets

Configure deployment targets to make installed deployment capabilities available in a landscape. This guide covers discovering deployment classes, connecting them to infrastructure, and verifying that their targets are ready.

For the relationship between artifacts, deployment classes, deployers, targets, and landscapes, see the [Deployment Model](../core-concepts/deployment-model.md).

## Prerequisites

Before you begin, make sure you have:

- a [ready landscape](./landscapes.md);
- an installed deployer that supports the required artifact format and target platform;
- credentials for the destination when it is not local to the deployer;
- permission to create resources in the landscape namespace.

## Discover available deployment classes

List the deployment capabilities advertised by installed deployers:

```bash
kubectl get deploymentclasses
```

The Kubernetes deployer commonly provides classes such as `helm.konfidence.cloud` and `kustomize.konfidence.cloud`. Use the exact value from the `NAME` column as `spec.deploymentClassName`.

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

::: warning  

Remote deployment targets are still in heavy development and not yet fully supported.

:::

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

## Next steps

- [Managing Stages](./stages.md) explains how to create stages that use the landscape's deployment targets.
- [Managing Deployers](./deployer/overview.md) explains how to inspect the controllers that provide deployment classes.
- [Types of artifacts](../develop-integrate/artifact-types/index.md) explains how application developers select a class for an artifact.
- Consult the [DeploymentTarget CRD reference](../reference/crd.md#deploymenttarget) for all fields.
