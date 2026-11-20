---
title: "Configure registry access"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Configure registry access for Kubernetes

Give the Kubernetes landscape orchestrator access to private artifact contents in each landscape. Flux credentials are separate from the credentials Konfidence uses to pull vectors and from the credentials the kubelet uses to pull workload images.

## Prerequisites

- A registry account with pull permission, its username, and its password or token.
- A [ready landscape](../../core/landscapes.md#verify-the-landscape) and permission to create Secrets in its namespace.
- Permission to configure a ConfigMap in `konfidence-system` if the registry needs a different secret name.
- [Core registry access](../../core/connect-registries.md) configured for private vectors.

Set the values used below:

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

The credentials on this page cover the artifacts and vectors that Konfidence pulls. The container images your workloads run are pulled by the kubelet through `imagePullSecrets` in your manifests or Helm values. Konfidence does not add those.

## Troubleshooting

A deployment in a landscape fails to pull when no secret named after the host exists in the landscape namespace and the ConfigMap has no entry for the host. Check both before retrying.

## Next steps

[Configure a Kubernetes target](./configure-target.md) and the [landscape services](./landscape-services.md) your application needs.
