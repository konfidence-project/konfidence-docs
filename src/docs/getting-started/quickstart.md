---
title: Quickstart
description: Install Konfidence locally, deploy the example application, and open the dashboard.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Quickstart

Konfidence is a software delivery framework for microservice-based software-as-a-service applications. It delivers the same immutable, versioned application vector across environments instead of rebuilding it for each one.

This quickstart gets a local Konfidence running, deploys the example application to a development stage, and opens the dashboard. For a guided walkthrough that explains each step and promotes the app to production, follow [Deliver an application](/docs/getting-started/deliver-an-application).

## Prerequisites

- [kind](https://kind.sigs.k8s.io/), [kubectl](https://kubernetes.io/docs/tasks/tools/), and [Helm](https://helm.sh/) v3.13+ installed.
- A Docker-compatible container runtime.

## Install Konfidence

Create a local cluster with Konfidence, Flux, and the Kubernetes landscape orchestrator installed:

```bash
curl -L https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/quickstart.sh | sh
```

This creates a `konfidence-quickstart` kind cluster and installs Flux, the Konfidence controller and API (which serves the dashboard), the landscape orchestrator, and the vector-data-service.

::: details Already have a cluster?
Install into the current kubeconfig context instead. Install Flux, then the Helm charts:

```bash
kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml
kubectl wait deployment --all -n flux-system --for=condition=Available --timeout=180s

helm upgrade --install konfidence oci://ghcr.io/konfidence-project/charts/konfidence \
  --namespace konfidence-system --create-namespace \
  --set api.oidc.enabled=false \
  --set api.session.storageType=in-memory \
  --set api.session.cookie.secure=false \
  --set webhook.enabled=false --wait

helm upgrade --install kubernetes-landscape-orchestrator oci://ghcr.io/konfidence-project/charts/kubernetes-landscape-orchestrator \
  --namespace konfidence-system --create-namespace --wait

helm upgrade --install vector-data-service oci://ghcr.io/konfidence-project/charts/vector-data-service \
  --namespace konfidence-system --create-namespace --wait
```
:::

## Deploy the example application

The [example application](https://github.com/konfidence-project/example-app) publishes its artifacts to a public registry. Apply the prepared resources in order — each set waits for the namespaces the previous one creates.

Create the project:

```bash
kubectl apply -k https://github.com/konfidence-project/example-app/hack/quickstart/project?ref=main
kubectl wait --for=jsonpath='{.status.conditions[?(@.type=="NamespaceReady")].status}'=True \
  project/example-app --timeout=60s
```

Create the `dev` and `prod` landscapes:

```bash
kubectl apply -k https://github.com/konfidence-project/example-app/hack/quickstart/landscapes?ref=main
kubectl -n kden-p-example-app wait --for=jsonpath='{.status.conditions[?(@.type=="NamespaceReady")].status}'=True \
  landscape/dev landscape/prod --timeout=60s
```

Create the stages, deployment targets, database, and promotion config:

```bash
kubectl apply -k https://github.com/konfidence-project/example-app/hack/quickstart/environment?ref=main
```

Install the vector-data-service into each landscape namespace:

```bash
for ns in kden-l-dev kden-l-prod; do
  helm upgrade --install vector-data-service oci://ghcr.io/konfidence-project/charts/vector-data-service \
    --version 0.0.0-4f194adf3c2e211514d41c59d1a446275bb093e3 \
    --namespace "$ns" --wait
done
```

::: warning
The per-landscape vector-data-service install is temporary until the platform provisions it automatically for each landscape.
:::

The example application is now deploying to the `dev-eu12` stage. Watch it become ready:

```bash
kubectl -n kden-l-dev get stage dev-eu12 -w
```

## Open the dashboard

Forward the dashboard port:

```bash
kubectl -n konfidence-system port-forward svc/konfidence-api 8090:8090
```

Open `http://localhost:8090` and sign in as the local administrator. Select the **Example App** project to see the application running in `dev-eu12` and a promotion to `prod-eu12` waiting for approval.

## Remove the cluster

```bash
kind delete cluster --name konfidence-quickstart
```

This deletes the `konfidence-quickstart` cluster and all workloads and data stored in it.

## Next steps

- [Deliver an application](/docs/getting-started/deliver-an-application) — a guided walkthrough that explains each resource and approves the promotion to production.
- [Core concepts](/docs/core-concepts/) — understand vectors, stages, and promotions.
