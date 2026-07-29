---
title: Quickstart
description: Get started with Konfidence in minutes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Quickstart

Konfidence is a software delivery framework for microservice-based software-as-a-service applications. It helps teams deliver complex applications consistently across multiple environments by using immutable, versioned application vectors and a structured release model.

Before you install Konfidence, it helps to know what this setup is for: teams promote the same verified application version across environments instead of rebuilding or reconfiguring it for each deployment. This makes releases easier to reason about as systems, teams, and release frequency grow.

## Cluster setup

You need a Kubernetes cluster with Konfidence and the Konfidence CLI installed.

For a quick test, you can start a local kind cluster with Konfidence installed:

```bash
curl -L https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/kind.sh | sh
```

This will:
- spin up a kind cluster
- install flux
- install the GatewayAPI CRDs
- install the Konfidence Helm chart
- install a Deployer for Kubernetes target runtime

::: details Manual Setup
If you already have a Kubernetes cluster, select it in your current kubeconfig context and install Konfidence manually with the following commands.

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

Verify the installation with:

```bash
kubectl get deployments -n konfidence-system
```

You should see `konfidence` and `kubernetes-landscape-orchestrator`.

See [Installing Konfidence](/docs/deploy-operate/konfidence-installation) for full details.
:::

## Next steps

* [create your own vector and deploy it to dev stage](/docs/getting-started/create-vector) 
* [create a delivery flow across multiple stages](/docs/getting-started/deliver-sample-app)
