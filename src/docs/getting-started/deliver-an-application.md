---
title: Deliver an application
description: Deploy the example application to development and promote it to production with an approval in the dashboard.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Deliver an application

This guided walkthrough deploys the example application to a development stage and promotes it to production with a manual approval in the dashboard. Along the way it explains each Konfidence resource you create.

You will:

- install Konfidence locally,
- create a project, two landscapes, and their stages,
- see the application running in development, and
- approve its promotion to production.

For the conceptual background, see [Core concepts](/docs/core-concepts/).

## Prerequisites

- [kind](https://kind.sigs.k8s.io/), [kubectl](https://kubernetes.io/docs/tasks/tools/), and [Helm](https://helm.sh/) v3.13+ installed.
- A Docker-compatible container runtime.

Install a local Konfidence:

```bash
curl -L https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/quickstart.sh | sh
```

This creates a `konfidence-quickstart` kind cluster with Flux, the Konfidence controller and API, and the landscape orchestrator. See the [Quickstart](/docs/getting-started/quickstart) for details.

## Create the project

A [project](/docs/core-concepts/deployment-model) groups everything that belongs to one application and owns a namespace for its resources.

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/project/project.yaml
kubectl wait --for=jsonpath='{.status.conditions[?(@.type=="NamespaceReady")].status}'=True \
  project/example-app --timeout=60s
```

The project controller creates the `kden-p-example-app` namespace, which holds the landscapes and promotion config you create next.

## Create the landscapes

A landscape represents a target environment. You create two: `dev` and `prod`. Each owns a managed namespace where its stages and workloads run.

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/landscapes/landscapes.yaml
kubectl -n kden-p-example-app wait --for=jsonpath='{.status.conditions[?(@.type=="NamespaceReady")].status}'=True \
  landscape/dev landscape/prod --timeout=60s
```

This creates the `kden-l-dev` and `kden-l-prod` managed namespaces.

::: tip
Resources are applied in order because each targets namespaces the previous controller creates: the project namespace before the landscapes, and the landscape namespaces before the stages.
:::

## Deploy the database

The example application requires a PostgreSQL database. Apply a self-contained Postgres and a credentials secret for each landscape:

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/environment/database.yaml
```

## Configure the deployment targets

A deployment target tells a landscape where to deploy. These target the local cluster, so no external credentials are needed:

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/environment/deploymenttargets.yaml
```

## Install the vector-data-service

Each landscape needs a vector-data-service so the running application can read its configuration:

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

## Create the stages

A [stage](/docs/core-concepts/landscapes-and-stages) is a deployment slot in a landscape. Apply both stages:

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/environment/stages.yaml
```

The `dev-eu12` stage pins a published application [vector](/docs/core-concepts/vectors-and-artifacts) — this deploys the app to development. The `prod-eu12` stage starts empty; the promotion fills it in.

## Configure the promotion

A promotion config moves a vector from one stage to another. Apply the `dev-to-prod` config:

```bash
kubectl apply -f https://raw.githubusercontent.com/konfidence-project/example-app/main/hack/quickstart/environment/promotion.yaml
```

Because its source is a stage, the promotion requires a manual approval before it deploys to production.

## See the application in development

Konfidence now deploys the vector to `dev-eu12`. Wait for the stage to become ready:

```bash
kubectl -n kden-l-dev get stage dev-eu12 -w
```

Open the dashboard:

```bash
kubectl -n konfidence-system port-forward svc/konfidence-api 8090:8090
```

Go to `http://localhost:8090`, sign in as the local administrator, and select the **Example App** project. The application is running in `dev-eu12`, and a promotion to `prod-eu12` is waiting for approval.

You can confirm the same from the CLI:

```bash
kubectl -n kden-p-example-app get vectorpromotion
```

The `dev-to-prod-1` promotion is in the `Waiting` state.

## Approve the promotion to production

In the dashboard, open the waiting `dev-to-prod` promotion and approve it.

Konfidence promotes the same vector into `prod-eu12` and deploys it. Watch the production stage pick up the vector:

```bash
kubectl -n kden-l-prod get stage prod-eu12 -w
```

The same verified application version now runs in production — promoted, not rebuilt.

## What you've learned

You have:

- installed Konfidence locally,
- created a project with `dev` and `prod` landscapes,
- deployed the example application to development, and
- promoted it to production with an approval.

## Next steps

- [Create your own app](/docs/getting-started/create-vector) — build and deliver your own vector.
- [Delivery flow](/docs/core-concepts/delivery-flow) — how promotions move a vector across stages.
