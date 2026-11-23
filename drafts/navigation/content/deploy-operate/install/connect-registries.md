---
title: Connect artifact registries
description: Give the Konfidence control plane credentials for private OCI registries.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Connect artifact registries

Give the Konfidence control plane credentials for the private OCI registries that hold vectors and artifacts. The control plane pulls a vector when a stage changes. Without credentials, private registries return `401` or `403`.

Configure these credentials during installation. The Kubernetes deployer reads registries separately; follow [Configure registry access](./deployer/kubernetes/registry-access.md) after creating each landscape that uses a private registry.

Vector assembly credentials belong to the project, not to the installation. A `VectorTemplate` names its own secrets in `spec.credentials.ocm.refs`. See [Configure signing and verification](../../develop-integrate/advanced-features/configure-signing-and-verification.md) and the [Credentials reference](../../reference/crd.md#credentials).

## Prerequisites

- A registry account with pull permission, its username, and its password or token.
- The registry host name, for example `registry.example.com`.
- For the control plane steps, `kubectl` access to create secrets in `konfidence-system` and restart the operator Deployment.

Set the values used below:

```bash
export REGISTRY_HOST=registry.example.com
export REGISTRY_USER=konfidence
export REGISTRY_PASSWORD='<TOKEN>'
```

## Give the control plane credentials

The vector deployment controllers read one secret named `registry-credentials` in `konfidence-system`. Create it as a Docker registry secret:

```bash
kubectl create secret docker-registry registry-credentials \
  --namespace konfidence-system \
  --docker-server="$REGISTRY_HOST" \
  --docker-username="$REGISTRY_USER" \
  --docker-password="$REGISTRY_PASSWORD"
```

The controllers load the secret at startup. Restart the operator so it loads the secret:

```bash
kubectl rollout restart deployment/konfidence --namespace konfidence-system
kubectl rollout status deployment/konfidence --namespace konfidence-system
```

The rollout completes. The next stage change that pulls a vector from this registry succeeds instead of failing with `401`.

## Use an OCM configuration instead of a Docker configuration

The control plane secret accepts an Open Component Model (OCM) configuration under the `.ocmconfig` key instead of `.dockerconfigjson`. Use it when the same secret also carries signing or verification keys. [Configure signing and verification](../../develop-integrate/advanced-features/configure-signing-and-verification.md#configure-cli-credentials) shows the `credentials.config.ocm.software/v1` format.

The operator can load a second secret with another name or namespace. Set both environment variables through the chart's `env` value:

```yaml
env:
  - name: KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAME
    value: extra-registry-credentials
  - name: KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAMESPACE
    value: konfidence-system
```

Setting only one of the two variables stops the operator at startup with an error that names the missing one.

## Troubleshooting

- A stage rollout fails with `401` or `403` from the registry. The control plane secret is missing, or the operator was not restarted after creating it.
- The operator does not start after setting `env`: both environment variables must be set together.

## Next steps

- [Create a project](../control-access/projects.md) and [Create a landscape](../manage-delivery/landscapes.md) establish the scope for deployment.
- [Configure registry access](./deployer/kubernetes/registry-access.md) supplies separate credentials for the Kubernetes deployer in each landscape.
