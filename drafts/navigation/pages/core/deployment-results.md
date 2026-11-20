---
title: "Deployment results"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Deployment results

Understand [deployment results](../reference/glossary.md#deployment-result) and their relationship to vector data. Deployment results are values that [deployers](../reference/glossary.md#deployer) produce while deploying a [vector](../reference/glossary.md#vector), such as service endpoints, generated URLs, identities, and allocated resources.

You do not author deployment results in [vector configuration](../reference/glossary.md#vector-configuration). Konfidence computes them as a side effect of deploying the vector and merges them into the same [vector data](../reference/glossary.md#vector-data) bundle that applications read at runtime.

## From a deployer to vector data

Each producing deployer writes results to the corresponding `ArtifactDeployment`. Konfidence aggregates them through `VectorDeployment` status into the `VectorData` custom resource. The result values describe what deployment produced; you do not author them in vector configuration.

A result is identified by `(name, type)`, unique within its component. Its `spec` is defined by the producing deployer. Results become available after deployment, including during migration, before the vector is activated.

## Read results for your runtime

- [Kubernetes Service results](../deployers/kubernetes/deployment-results.md) explains annotations, `http-k8s-service` values, and discovery through the vector data service.
- [S3 deployment and activation design](../deployers/s3/runtime.md) describes storage locations and how the serving integration uses them. This deployer is in development.

The result transport and application access mechanism depend on the runtime. Kubernetes ConfigMaps, OFREP, and `X-Vector-ID` are described in the Kubernetes guides.

::: warning
The deployment result schema is not final and may change in a future release.
:::

## Related information

[Vector data](./vector-data.md) combines authored configuration with deployment results.
