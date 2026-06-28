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

<!-- TODO @marco: check this introduction again before initial release, to make sure it accurately reflects the current state of the project and its goals -->
<!-- DEV: Confirm whether feature toggles and ring deployments will be implemented in the first version or just planned for future releases, otherwise this should not be used as release benefit copy. -->

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

## Deploy your first app

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

## Next steps

* [create your own vector and deploy it to dev stage](/docs/getting-started/create-vector) 
* [create a delivery flow across multiple stages](/docs/getting-started/deliver-sample-app) 
