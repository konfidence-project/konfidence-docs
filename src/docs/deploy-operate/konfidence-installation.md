---
title: Install Konfidence
description: Install the Konfidence control plane into a Kubernetes cluster with Helm.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install Konfidence

Install the Konfidence control plane, the operator and the API server, from one Helm chart. After this page the control plane runs. You then install a deployer, expose the API, and connect registries.

For a local test cluster, use the [Quickstart](/docs/getting-started/quickstart) instead. It sets up a kind cluster with everything installed.

## Prerequisites

- A Kubernetes cluster and `kubectl` access to it. Check: `kubectl cluster-info` prints the control plane address.
- Helm with OCI registry support, version 3.8 or later. Check: `helm version` prints 3.8 or higher.
- The Gateway API CRDs, version 1.4.1. Check: `kubectl get crd gateways.gateway.networking.k8s.io` finds the CRD. Install:

  ```bash
  kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/standard-install.yaml
  ```

- Flux with its source controller. Check: `kubectl get deployment source-controller -n flux-system` shows one available replica. Install:

  ```bash
  kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml
  kubectl wait deployment/source-controller \
    --namespace flux-system \
    --for=condition=Available \
    --timeout=180s
  ```

## Install the control plane

Set the Konfidence version and target namespace:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_NAMESPACE=konfidence-system
```

Install the chart:

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

## Verify the installation

```bash
kubectl get deployments -n "$KONFIDENCE_NAMESPACE"
```

You see `konfidence` and `konfidence-api` with all replicas available.

## Next steps

* [Install the Kubernetes deployer](./deployer/kubernetes.md#install-the-deployer). Without a deployer, no stage can deploy.
* [Expose the API](./expose-api.md) publishes the API and the dashboard and enables login through your identity provider.
* [Connect artifact registries](./connect-registries.md) gives the control plane and the deployer access to private registries.
