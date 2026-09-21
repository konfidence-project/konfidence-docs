---
title: Install Konfidence
description: Install the Konfidence control plane and the Kubernetes landscape orchestrator into a Kubernetes cluster with Helm.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install Konfidence

Install the Konfidence control plane from one Helm chart. Together with it, install the Kubernetes landscape orchestrator, which deploys your workloads into the cluster. After this page the control plane runs, and you continue with exposing the API and connecting registries.

For a local test cluster, use the [Quickstart](/docs/getting-started/quickstart) instead. It sets up a kind cluster with everything installed.

## Prerequisites

* A Kubernetes cluster and `kubectl` access to it. Check: `kubectl cluster-info` prints the control plane address.
* Helm with OCI registry support, version 3.8 or later. Check: `helm version` prints a version of 3.8 or higher.

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
  --set api.oidc.enabled=false \
  --set webhook.enabled=false \
  --wait
```

The two `enabled=false` flags keep the first install self-contained. With the chart defaults, the API server refuses to start without an OIDC issuer URL. The admission webhook needs a TLS Secret named `konfidence-webhook-server-cert`. [Expose the API](./expose-api.md) turns OIDC on. The [chart values](https://github.com/konfidence-project/konfidence/blob/main/charts/konfidence/values.yaml) describe the certificate Secret under `webhook`.

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
kubectl get deployments -n "$KONFIDENCE_NAMESPACE"
```

You see `konfidence`, `konfidence-api`, and `kubernetes-landscape-orchestrator` with all replicas available.

## Next steps

* [Expose the API](./expose-api.md) publishes the API and the dashboard and enables login through your identity provider.
* [Connect artifact registries](./connect-registries.md) gives the control plane and the deployer access to private registries.
* [Runtime components](./runtime-components/overview.md) lists optional components for your landscape, such as the vector data service.
