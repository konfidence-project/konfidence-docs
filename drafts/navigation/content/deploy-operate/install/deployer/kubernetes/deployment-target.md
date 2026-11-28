---
title: Configure a Kubernetes deployment target
description: Create a local target for a Kubernetes artifact type and verify that the deployer accepts it.
outline: [2, 3]
---

# Configure a Kubernetes deployment target

Create a target for `helm.konfidence.cloud` or `kustomize.konfidence.cloud` in your landscape. Empty parameters select the cluster where the Kubernetes deployer runs.

For the shared target model and the rule of one target per artifact type in a landscape, see [Configure deployment targets for a landscape](../../../manage-delivery/deployment-targets.md).

::: warning Remote targets are work in progress
Use targets with empty parameters to deploy into the local cluster. Remote targets can validate a kubeconfig and become `Ready`. Deployment of all resources to the remote cluster is not yet complete.
:::

## Prerequisites

- A [ready landscape](../../../manage-delivery/landscapes.md).
- The [Kubernetes deployer](../kubernetes.md) installed.
- `kubectl` access to read the `Landscape` and create and read `DeploymentTarget` resources in the landscape namespace.

Set the names used below:

```bash
export PROJECT_NAMESPACE=kden-p-ecommerce-platform
export LANDSCAPE_NAMESPACE=$(kubectl get landscape dev \
  --namespace="$PROJECT_NAMESPACE" \
  --output=jsonpath='{.status.namespace}')
```

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

To configure the same landscape for Kustomize artifacts, create a separate target with a different name and `spec.artifactType: kustomize.konfidence.cloud`.

## Target parameters

Omitted `spec.parameters` selects the local cluster. The following remote-target fragments describe the current parameter format; remote deployment remains incomplete as noted above.

A remote target references a secret in the landscape namespace.
The deployer reads the kubeconfig from the key `value` or `value.yaml`, the keys Flux uses:

```bash
kubectl create secret generic prod-eu-kubeconfig \
  --namespace="$LANDSCAPE_NAMESPACE" \
  --from-file=value="$HOME/.kube/prod-eu.yaml"
```

```yaml
kind: DeploymentTarget
spec:
  artifactType: helm.konfidence.cloud
  parameters:
    apiGroup: ""
    kind: Secret
    name: prod-eu-kubeconfig
```

The deployer validates target parameters and reports the result in the `Ready` condition:

| Reason | Meaning |
| --- | --- |
| `Accepted` | The target passed validation. |
| `InvalidParameters` | Parameters do not identify a Kubernetes secret containing a kubeconfig. |
| `ValidationError` | The deployer could not complete validation, for example because the referenced secret could not be read. |

Pulling artifacts from private registries needs a secret in the landscape namespace as well. See [Configure registry access](./registry-access.md).

## Troubleshooting

- The target has no condition: verify that the Kubernetes deployer is running and that `spec.artifactType` is one of its supported types.
- `Ready` is `False`: use the condition reason and message to check the parameters and referenced secret.

## Next steps

- [Configure registry access](./registry-access.md) for private artifacts.
- [Choose landscape services](../../runtime-components/overview.md) for runtime integration.
- [Create a stage](../../../manage-delivery/stages.md) to deploy a vector through the target.
