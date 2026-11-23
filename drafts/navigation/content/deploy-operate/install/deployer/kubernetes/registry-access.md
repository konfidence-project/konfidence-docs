---
title: Configure registry access
description: Give the Kubernetes deployer credentials for private artifact registries in each landscape.
outline: [2, 3]
---

# Configure registry access

Give the Kubernetes deployer credentials for the private registries that hold your artifacts. Configure a secret in each landscape that deploys from a private registry.

The Konfidence control plane uses separate credentials to pull vectors. Configure those through [Connect artifact registries](../../connect-registries.md).

## Prerequisites

- The [Kubernetes deployer](../kubernetes.md) is installed.
- A registry account with pull permission, its username, and its password or token.
- A [ready landscape](../../../manage-delivery/landscapes.md#verify-the-landscape) and permission to create secrets in its namespace.
- For a registry-to-secret mapping, permission to configure a ConfigMap in `konfidence-system`.

Set the registry values used below:

```bash
export REGISTRY_HOST=registry.example.com
export REGISTRY_USER=konfidence
export REGISTRY_PASSWORD='<TOKEN>'
```

## Give the deployer credentials

Set the namespace reported by your `Landscape` resource's status. Replace `<landscape-namespace>` with that value:

```bash
export LANDSCAPE_NAMESPACE='<landscape-namespace>'
```

The Kubernetes deployer looks up credentials by registry host name. It searches the namespace of the resource it reconciles, the landscape namespace. Create a Docker registry secret named exactly like the registry host:

```bash
kubectl create secret docker-registry "$REGISTRY_HOST" \
  --namespace "$LANDSCAPE_NAMESPACE" \
  --docker-server="$REGISTRY_HOST" \
  --docker-username="$REGISTRY_USER" \
  --docker-password="$REGISTRY_PASSWORD"
```

Repeat this for every landscape that deploys from the registry. The next deployment in the landscape pulls the artifact with these credentials.

## Map registries to secrets with different names

A secret name must be a DNS subdomain name. A registry with a port, such as `registry.example.com:5000`, cannot name the secret. Map the host to a secret name in the ConfigMap `flux-deployer-configuration` in `konfidence-system` instead:

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

The secret `registry-example` still lives in the landscape namespace and has the type `kubernetes.io/dockerconfigjson`. The deployer checks the ConfigMap first and falls back to the host name.

## Workload images stay your responsibility

The credentials on this page let the Kubernetes deployer pull artifact contents. The container images your workloads run are pulled by the kubelet through `imagePullSecrets` in your manifests or Helm values. Konfidence does not add those.

## Verify access

<!-- Writer review R4 (CONTENT-REVIEW.md): ask the feature owner for the resource condition or log message that confirms a private artifact pull. -->

Deploy an artifact from the private registry in this landscape. The deployer should pull the artifact with these credentials. If the pull fails, check that the secret is in the landscape namespace and that its name matches the registry host or the ConfigMap mapping.

## Next steps

- [Configure deployment targets for a landscape](../../../manage-delivery/deployment-targets.md) connects the landscape to the deployer.
- [Create a stage](../../../manage-delivery/stages.md) selects a vector to deploy.
