---
title: "Install the Kubernetes deployer"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
description: Install and verify the Kubernetes deployer, then use its target parameters, artifact formats, and deployment results.
outline: [2, 3]
---
# Install the Kubernetes deployer {#kubernetes-deployer}

Install the Kubernetes [deployer](../../reference/glossary.md#deployer) to deliver Helm and Kustomize artifacts to Kubernetes through Flux.
It supports the artifact types `helm.konfidence.cloud` and `kustomize.konfidence.cloud` and is the reference implementation of Konfidence's deployer interface.
See the [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md) for the control plane contract.

After installation, configure [Kubernetes target parameters](./target-parameters.md). For packaging and runtime details, see [Kubernetes artifact types](./artifact-types.md) and [Kubernetes Service results](./service-results.md).

## Prerequisites

- [Konfidence installed](../../core/install.md) in the cluster, including the listed Flux prerequisites.
- Helm and `kubectl` access with permission to install the chart and its resources.

## Install the deployer

The deployer ships as the Helm chart `kubernetes-landscape-orchestrator`. Install it into the Konfidence namespace:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_NAMESPACE=konfidence-system

helm upgrade --install kubernetes-landscape-orchestrator oci://ghcr.io/konfidence-project/charts/kubernetes-landscape-orchestrator \
  --version "$KONFIDENCE_VERSION" \
  --namespace "$KONFIDENCE_NAMESPACE" \
  --create-namespace \
  --set image.repository=ghcr.io/konfidence-project/kubernetes-landscape-orchestrator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --wait
```

## Verify the installation

Verify that the deployer is running:

```bash
kubectl get deployment kubernetes-landscape-orchestrator -n "$KONFIDENCE_NAMESPACE"
```

The deployment should show one available replica.
The supported types are `helm.konfidence.cloud` and `kustomize.konfidence.cloud`.
Every chart value is listed in the [Helm values reference](./helm-values.md).
[Configure deployment targets for a landscape](../../core/deployment-targets.md) configures destinations for these types.

## Next steps {#related}

Configure destinations for the supported types:

- [Create a landscape](../../core/landscapes.md) if you do not have one yet.
- [Configure deployment targets for a landscape](../../core/deployment-targets.md) using the [Kubernetes target parameters](./target-parameters.md).
- [Connect artifact registries](./registry-access.md#give-the-deployer-credentials) supplies deployer credentials in each landscape that needs them.
- Read [Gateway routing](./gateway-routing.md) for the routing contract.
- Route external traffic to stages with [Envoy Gateway](./envoy-gateway.md), [Istio](./istio.md), or [Traefik](./traefik.md).

For artifact authoring and the deployment model, see:

- [Publish artifacts](../../core/publish-artifacts.md)
- [Deployment model](../../core/deployment-model.md)
- [Deployers](../index.md)
