---
title: Connect artifact registries
description: Give the control plane and the Kubernetes deployer credentials for private OCI registries.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Connect artifact registries

Give Konfidence credentials for the private OCI registries that hold artifacts and vectors. Two components read registries on their own, and each needs its own Secret. The control plane pulls a vector when a stage changes. The Kubernetes deployer pulls artifact contents when it creates workloads. Without credentials, both access the registry unauthenticated and private registries answer with `401` or `403`.

Vector assembly credentials belong to the project, not to the installation. A `VectorTemplate` names its own Secrets in `spec.credentials.ocm.refs`. See [Configure signing and verification](/docs/develop-integrate/advanced-features/configure-signing-and-verification) and the [Credentials reference](/docs/reference/crd#credentials).

## Prerequisites

- A registry account with pull permission, its username, and its password or token.
- The registry host name, for example `registry.example.com`.
- `kubectl` access to `konfidence-system` and to the landscape namespace. [Manage stages](../manage-delivery/stages.md#get-the-landscape-namespace) shows how to read it.

Set the values used below:

```bash
export REGISTRY_HOST=registry.example.com
export REGISTRY_USER=konfidence
export REGISTRY_PASSWORD='<TOKEN>'
export LANDSCAPE_NAMESPACE=<LANDSCAPE_NAMESPACE>
```

## Give the control plane credentials

The vector deployment controllers read one Secret named `registry-credentials` in `konfidence-system`. Create it as a Docker registry Secret:

```bash
kubectl create secret docker-registry registry-credentials \
  --namespace konfidence-system \
  --docker-server="$REGISTRY_HOST" \
  --docker-username="$REGISTRY_USER" \
  --docker-password="$REGISTRY_PASSWORD"
```

The controllers load the Secret at start-up. Restart the operator so it picks the Secret up:

```bash
kubectl rollout restart deployment/konfidence --namespace konfidence-system
kubectl rollout status deployment/konfidence --namespace konfidence-system
```

The rollout completes. The next stage change that pulls a vector from this registry succeeds instead of failing with `401`.

## Give the deployer credentials

The Kubernetes deployer looks up credentials by registry host name. It searches the namespace of the resource it reconciles, the landscape namespace. Create a Docker registry Secret named exactly like the registry host:

```bash
kubectl create secret docker-registry "$REGISTRY_HOST" \
  --namespace "$LANDSCAPE_NAMESPACE" \
  --docker-server="$REGISTRY_HOST" \
  --docker-username="$REGISTRY_USER" \
  --docker-password="$REGISTRY_PASSWORD"
```

Repeat this for every landscape that deploys from the registry. The next deployment in the landscape pulls the artifact with these credentials.

## Map registries to Secrets with other names

A Secret name must be a DNS subdomain name. A registry with a port, such as `registry.example.com:5000`, cannot name the Secret. Map the host to a Secret name in the ConfigMap `flux-deployer-configuration` in `konfidence-system` instead:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: flux-deployer-configuration
  namespace: konfidence-system
data:
  authenticationSecretRefs: |
    registry.example.com:5000: registry-example
```

The Secret `registry-example` still lives in the landscape namespace and has the type `kubernetes.io/dockerconfigjson`. The deployer checks the ConfigMap first and falls back to the host name.

## Use an OCM configuration instead of a Docker configuration

The control plane Secret accepts an Open Component Model (OCM) configuration under the `.ocmconfig` key instead of `.dockerconfigjson`. Use it when the same Secret also carries signing or verification keys. [Configure signing and verification](/docs/develop-integrate/advanced-features/configure-signing-and-verification#configure-cli-credentials) shows the `credentials.config.ocm.software/v1` format.

The operator can load a second Secret with another name or namespace. Set both environment variables through the chart's `env` value:

```yaml
env:
  - name: KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAME
    value: extra-registry-credentials
  - name: KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAMESPACE
    value: konfidence-system
```

Setting only one of the two variables stops the operator at start-up with an error that names the missing one.

## Workload images stay your responsibility

The credentials on this page cover the artifacts and vectors that Konfidence pulls. The container images your workloads run are pulled by the kubelet through `imagePullSecrets` in your manifests or Helm values. Konfidence does not add those.

## What to do if it fails

- A stage rollout fails with `401` or `403` from the registry. The control plane Secret is missing, or the operator was not restarted after creating it.
- A deployment in a landscape fails to pull. No Secret named after the host exists in the landscape namespace. The ConfigMap has no entry for the host either.
- The operator does not start after setting `env`: both environment variables must be set together.

## Next steps

- [Manage landscapes](../manage-delivery/landscapes.md) creates the landscapes that need deployer credentials.
- [Runtime components](./runtime-components/overview.md) lists optional services for your landscape.
