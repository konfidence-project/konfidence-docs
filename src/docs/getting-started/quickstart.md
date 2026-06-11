---
title: Quickstart
description: Get started with Konfidence in minutes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Before you begin

You need a Kubernetes cluster with Konfidence and the Konfidence CLI installed.

## Cluster Setup

For a quick test, you can start a local kind cluster with Konfidence installed:

```bash
curl -L https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/kind.sh | sh
```

This will:
- spin up a kind cluster
- install flux
- install the GatewayAPI CRDs
- install the Konfidence Galaxy+Star Helm Charts
- install a Deployer for Kubernetes target runtime


::: details Manual Setup
<!-- 
  Content type (Diátaxis): How-to guide — install Konfidence manually on an existing cluster (alternative to the kind script).
  TW will structure this as: Prerequisites → helm repo add → helm install Galaxy → helm install Star → verify.

  Dev input needed:
  - which resources does the user need to install Konfidence (locally)?

  Tickets: 
    * Example app: prepare sample artifacts & vector + cleanup example repo (do we want to stick with istio examples?)
    * DOCS — Quickstart for Konfidence

-->

Manual installation steps will be documented here. See [Galaxy installation](/docs/deploy-operate/galaxy-installation) and [Star installation](/docs/deploy-operate/star-installation) for full details.
:::

# Deploy your first App

Use konfidence-cli to push new stage with example app from ghcr to local docker OCI

```bash
$ kden push stage dev --from-oci ghcr.io/konfidence-ai/example-app:latest

✔  Stage dev pushed successfully
✔  StageVersion dev-fe41ed7c created successfully
...creating Artifacts
```
::: details What just happened?
- Konfidence created a **Stage** and a **StageVersion** for your `dev` deployment — see [Vector Deployments](/docs/core-concepts/vector-deployments).
- The push created **Artifacts** for each service in the example app — see [Vectors and Artifacts](/docs/core-concepts/vectors-and-artifacts).
- The Flux deployer detected the new Stage and deployed the artifacts to your cluster.
  :::

Access the UI of the example App

# Next Steps

* [create your own vector and deploy it to dev stage](/docs/getting-started/create-vector) 
* [create a delivery flow across multiple stages](/docs/getting-started/deliver-sample-app) 
