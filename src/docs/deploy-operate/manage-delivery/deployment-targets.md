---
title: Configure deployment targets for a landscape
description: Configure one deployment target per artifact type in a landscape and verify that its deployer accepts it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Configure deployment targets for a landscape {#manage-deployment-targets}

Create a [deployment target](../../reference/glossary.md#deployment-target) to configure a destination for an artifact type in a [landscape](../../reference/glossary.md#landscape). 
The target's `spec.artifactType` selects its [deployer](../../reference/glossary.md#deployer).
`spec.parameters` contains the connection information defined by that deployer. 
The deployer validates the parameters and reports whether it accepts the target.

The deployer is installed once per Konfidence installation and is shared across all projects and landscapes. 
For the relationship between artifacts, artifact types, deployers, targets, and landscapes, see the [Deployment model](../../core-concepts/deployment-model.md).

## Prerequisites

- A [ready landscape](./landscapes.md).
- A deployer that supports the artifact type you need. See [Choose a deployer](../install/deployer/overview.md).
- The parameter format for that deployer. For the Kubernetes deployer, see [Target parameters](../install/deployer/kubernetes.md#target-parameters).
- `kubectl` access to read the Landscape and create and read `DeploymentTarget` resources in the landscape namespace.

Set the names used below:

```bash
export PROJECT_NAMESPACE=kden-p-ecommerce-platform
export LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.namespace}')
```

## Choose the artifact type

Each [artifact](../../reference/glossary.md#artifact) declares its artifact type. 
A landscape needs one ready target for every type its [stages](../../reference/glossary.md#stage) deploy. 
Use the exact type supported by the artifact's deployer.
For example, the Kubernetes deployer supports `helm.konfidence.cloud` and `kustomize.konfidence.cloud`.

## Create the target

Save the following manifest as `deployment-target.yaml`. 
Empty parameters select the Kubernetes deployer's local cluster:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: helm-local
  namespace: kden-l-dev
spec:
  artifactType: helm.konfidence.cloud
```

Replace `kden-l-dev` with the value of `LANDSCAPE_NAMESPACE`, then apply the manifest:

```bash
kubectl apply -f deployment-target.yaml
```

## Verify the target

The deployer that supports the artifact type validates the target and sets its `Ready` condition:

```bash
kubectl wait deploymenttarget/helm-local \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --for=condition=Ready \
  --timeout=60s
```

The command returns `condition met` when the deployer accepts the target parameters. 
`Ready=True` indicates acceptance of the parameters by the deployer. 
It does not guarantee that a future artifact deployment will succeed. 

List all targets of the landscape:

```bash
kubectl get deploymenttargets --namespace="$LANDSCAPE_NAMESPACE"
```

## Troubleshooting

- `Ready` stays `False`: inspect the condition reason and message for invalid parameters. For the Kubernetes deployer, see [Target parameters](../install/deployer/kubernetes.md#target-parameters).
- The target has no condition: confirm that a running deployer supports the exact `spec.artifactType` value.

## Next steps

- [Connect artifact registries](../install/connect-registries.md#give-the-deployer-credentials) supplies credentials for private artifacts in this landscape.
- [Choose landscape services](../install/runtime-components/overview.md) identifies the runtime services your applications need.
- [Create a stage](./stages.md) selects a vector to deploy through the prepared landscape's targets.
- [Types of artifacts](../../develop-integrate/artifact-types/index.md) explains artifact types and supported formats.
- [DeploymentTarget CRD reference](../../reference/crd.md#deploymenttarget) lists all fields.
