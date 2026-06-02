---
title: Quickstart Ansgar
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


::: details Manual Setup
* can we do it as easy-to-use kind setup? -> Kargo provides install scripts for Docker Desktop, kind, etc
* helm install konfidence-galaxy (+ configuration?)
* helm install konfidence-star (+ configuration?)

very simplistic setup:
* control planes installed on a single cluster
* deploy workloads to same cluster

production-grade setup will involve multiple clusters
:::

## Verification:

Konfidence UI available with port forward
```bash
kubectl port-forward svc/konfidence-ui -n konfidence-system     
```
(imagine screenshot here)
![](https://placehold.co/600x400)

Kden doctor shows the cluster is ready

```bash
$ kden doctor

   ╭────────────────────────────────────────────────────────╮
   │  Konfidence  – Health Check                            │
   │  Version 1.9.2-beta • Build 2026-05-19-0432            │
   ╰────────────────────────────────────────────────────────╯

Scanning Galaxy… 100 %

 1. Galaxy Connectivity
    ✔  API endpoint reachable        https://api.staging.east-1.k8s.local:443
    ✔  TLS handshake verified        ECDSA P-256 / TLS 1.3
    ✔  Authentication token valid    expires in 11 h 43 m

 2. Star Connectivity
    ✔  1 Star found                  konfidence-deploy-bot@kube-system
    ⚠  0 Stages found            
...    
```
# Deploy your first App

Use konfidence-cli to push new stage with example app from ghcr to local docker OCI

```bash
$ kden push stage dev --from-oci ghcr.io/konfidence-ai/example-app:latest

✔  Stage dev pushed successfully
✔  StageVersion dev-fe41ed7c created successfully
...creating Artifacts
```
::: details
- this will create stage + stageversion: link to concept
- konfidence creates Artifacts: link to concept
- Flux deployer picks up the new stage and deploys the app
:::

Access the UI of the example App
# Next Steps

* publish changes to an artifact to deploy a new vector to dev stage
* add the ratings microservice to the app and experiment with database migrations
* install the star control plane on a second cluster and deploy the production stage there
