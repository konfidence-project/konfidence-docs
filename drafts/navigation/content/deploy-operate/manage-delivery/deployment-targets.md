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
- The parameter format for that deployer.
- `kubectl` access to read the `Landscape` and create and read `DeploymentTarget` resources in the landscape namespace.

Set the names used below:

```bash
export PROJECT_NAMESPACE=kden-p-ecommerce-platform
export LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.namespace}')
```

## Choose the artifact type

Each [artifact](../../reference/glossary.md#artifact) declares its artifact type. A landscape needs one ready target for every type its stages deploy. Use the exact type supported by the artifact's deployer. A landscape has at most one target for each artifact type.

## Create the target

Follow the guide for the deployer that handles your artifact type. It defines the target parameters and provides the manifest to apply:

- [Configure a Kubernetes deployment target](../install/deployer/kubernetes/deployment-target.md) for Helm and Kustomize artifacts.

The target belongs in the namespace reported by the landscape. Its `spec.artifactType` selects the deployer; its `spec.parameters` follows that deployer's format. The [DeploymentTarget reference](../../reference/crd.md#deploymenttarget) describes the shared resource fields.

## Verify the target

The responsible deployer validates the target parameters and reports the result in its `Ready` condition. `Ready=True` indicates acceptance of the parameters. It does not guarantee that a future artifact deployment will succeed.

List all targets of the landscape:

```bash
kubectl get deploymenttargets --namespace="$LANDSCAPE_NAMESPACE"
```

## Troubleshooting

- `Ready` stays `False`: inspect the condition reason and message, then consult your deployer's parameter guidance.
- The target has no condition: confirm that a running deployer supports the exact `spec.artifactType` value.

## Next steps

- Configure registry credentials and runtime services required by your deployer. For Kubernetes, see [Configure registry access](../install/deployer/kubernetes/registry-access.md) and [Choose landscape services](../install/runtime-components/overview.md).
- [Create a stage](./stages.md) to select a vector for the prepared landscape.
