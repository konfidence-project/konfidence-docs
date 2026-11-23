---
title: Install the Kubernetes deployer
description: Install the Kubernetes deployer and verify that it is running.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install the Kubernetes deployer {#kubernetes-deployer}

Install the Kubernetes [deployer](../../../reference/glossary.md#deployer) to deliver Helm and Kustomize artifacts to Kubernetes through Flux.
It supports the artifact types `helm.konfidence.cloud` and `kustomize.konfidence.cloud` and is the reference implementation of Konfidence's deployer interface.
See the [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md) for the control plane contract.
After installation, [configure a Kubernetes deployment target](./kubernetes/deployment-target.md) in each landscape that needs these artifact types.

## Prerequisites

- [Konfidence installed](../konfidence-installation.md) in the cluster, including the listed Flux prerequisites.
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
Every chart value is listed in the [Helm values reference](../../../reference/helm-values-orchestrator.md).
[Configure deployment targets for a landscape](../../manage-delivery/deployment-targets.md) configures destinations for these types.

## Next steps {#related}

- [Configure a Kubernetes deployment target](./kubernetes/deployment-target.md) and [registry access](./kubernetes/registry-access.md).
- [Choose landscape services](../runtime-components/overview.md) for your applications.
- [Gateway routing](../../plan/gateway-routing.md) explains the routing contract and the alternative gateway setup guides.
- [Types of artifacts](../../../develop-integrate/artifact-types/index.md) describes the supported packages.
- [Use deployment results](../../../develop-integrate/vector-data/deployment-results.md) makes Kubernetes Services discoverable by other components.
