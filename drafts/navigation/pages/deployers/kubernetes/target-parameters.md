---
title: "Kubernetes target parameters"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Kubernetes target parameters

Use these parameters when you [configure deployment targets for a landscape](../../core/deployment-targets.md). They belong to the Kubernetes deployer.

## Target parameters

A [deployment target](../../core/deployment-targets.md) sets `spec.artifactType` to one of the supported types.
Omitted `spec.parameters` configures deployment to the cluster where the deployer runs.
For a remote cluster, `spec.parameters` references a secret in the landscape namespace that contains a kubeconfig.

::: warning Remote targets are work in progress
Use targets with empty parameters to deploy into the local cluster.
Remote targets can validate a kubeconfig and become `Ready`. Deployment of all resources to the remote cluster is not yet complete.
:::

An in-cluster target needs no parameters:

```yaml
kind: DeploymentTarget
spec:
  artifactType: helm.konfidence.cloud
```

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

Pulling artifacts from private registries needs a secret in the landscape namespace as well. See [Connect artifact registries](./registry-access.md#give-the-deployer-credentials).


## Related guides

- [Install the Kubernetes deployer](./install.md)
- [Use deployment results](./deployment-results.md)
