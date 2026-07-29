---
title: Installing Konfidence
description: Install Konfidence and the Kubernetes landscape orchestrator on your cluster.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Installing Konfidence

Konfidence is installed from a single Helm chart. Together with it, you install the Kubernetes landscape orchestrator, which deploys your workloads into the cluster.

For a local test cluster, use the [Quickstart](/docs/getting-started/quickstart) instead — it sets up a kind cluster with everything installed.

## Prerequisites

* a Kubernetes cluster and `kubectl` access to it
* Helm with OCI registry support (3.8 or later)

## Install

Set the Konfidence version and target namespace:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_NAMESPACE=konfidence-system
```

Install the Gateway API CRDs:

```bash
kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/standard-install.yaml
```

Install Flux and wait for the source controller to become available:

```bash
kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml

kubectl wait deployment/source-controller \
  --namespace flux-system \
  --for=condition=Available \
  --timeout=180s
```

Install Konfidence:

```bash
helm upgrade --install konfidence oci://ghcr.io/konfidence-project/charts/konfidence \
  --version "$KONFIDENCE_VERSION" \
  --namespace "$KONFIDENCE_NAMESPACE" \
  --create-namespace \
  --set image.repository=ghcr.io/konfidence-project/konfidence-operator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --wait
```

Install the Kubernetes landscape orchestrator:

```bash
helm upgrade --install kubernetes-landscape-orchestrator oci://ghcr.io/konfidence-project/charts/kubernetes-landscape-orchestrator \
  --version "$KONFIDENCE_VERSION" \
  --namespace "$KONFIDENCE_NAMESPACE" \
  --create-namespace \
  --set image.repository=ghcr.io/konfidence-project/kubernetes-landscape-orchestrator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --wait
```

## Verify the installation

```bash
kubectl get deployments -n konfidence-system
```

You should see `konfidence` and `kubernetes-landscape-orchestrator` available.

## Next steps

* [Runtime components](./runtime-components/overview.md) - Optional components for your landscape, such as the vector data service
* [Quickstart](/docs/getting-started/quickstart) - Deliver a first application
