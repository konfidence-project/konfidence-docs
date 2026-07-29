---
title: Use deployment results
description: Learn how deployment results become vector data and how your application reads them at runtime.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Use deployment results

This guide explains how to use deployment results in running application code. Deployment results are values that deployers produce while deploying a vector, such as service endpoints, generated URLs, identities, and allocated resources.

You do not author deployment results in vector configuration. Konfidence computes them as a side effect of deploying the vector and merges them into the same vector data bundle that applications read at runtime.

## Prerequisites

- A deployer produces deployment results for an artifact in the vector.
- The vector is activated before your application reads the results.
- Your application can access vector data through the vector data service.

## Let deployers produce deployment results

Each producing deployer writes deployment results to the corresponding `ArtifactDeployment`.

Konfidence aggregates those deployment results into the `VectorData` custom resource through the `VectorDeployment` status. The landscape orchestrator reads the `VectorData` resource and passes the data to the landscape as a `ConfigMap`.

## Read deployment results at runtime

Deployment results are part of the vector configuration bundle. Request the whole bundle by passing the vector ID as the flag key (see [Access vector data in your application](./access-vector-data.md)), then read a result by name from the returned object, for example `deploymentResults.orders-db`.

The single-flag and bulk endpoints resolve feature flags only. Deployment results and authored config are available through the whole-bundle response.

## Use deployment results for service discovery

Use deployment results when one component in a vector needs an address, identity, URL, or allocated resource that another component receives during deployment.

You do not need to know these values before deployment. The platform fills them in at deploy time, and your application reads them back by name at runtime.

For `http-k8s-service` results, the deployer discovers the Kubernetes Service by its `appname` label. Make sure the Services you want to expose as deployment results carry that label.

::: warning
The deployment result schema is not final and may change in a future release.
:::

## Next steps

To read deployment results from application code, see [Access vector data in your application](./access-vector-data.md).
