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
- The producing artifact has been deployed; results are available from that point (including during the migration phase), not only after the vector is activated.
- Your application can access vector data through the vector data service.

## Let deployers produce deployment results

Each producing deployer writes deployment results to the corresponding `ArtifactDeployment`.

Konfidence aggregates those deployment results into the `VectorData` custom resource through the `VectorDeployment` status. The landscape orchestrator reads the `VectorData` resource and passes the data to the landscape as a `ConfigMap`.

## Expose a Kubernetes Service

To let other components in the vector discover a Service, add the `konfidence.cloud/deployment-result` annotation to it. The annotation value is the stable name consumers use to look it up:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: candidates
  annotations:
    konfidence.cloud/deployment-result: candidates
```

Only Kubernetes Services can be exposed this way today. For how the deployer turns the annotation into a deployment result, see [Kubernetes Deployer — Exposing a Service as a deployment result](../deployers/kubernetes.md#exposing-a-service-as-a-deployment-result).

A deployment result is identified by the pair `(name, type)`, which must be unique within a component. Giving two Services in the same component the same annotation value is rejected at deploy time.

## Read deployment results at runtime

Deployment results are part of the vector configuration bundle. Request the whole bundle by passing the vector ID as the flag key (see [Access vector data in your application](./access-vector-data.md)).

In the returned object, `deploymentResults` is keyed by **component name** (its last path segment), and each value is an **array** of the results that component published. Each result has a stable `name` (the annotation value), a `type`, and a `spec`. Select the result you need by its `name` — do not rely on array position.

For an `http-k8s-service` result, `spec` carries the Service's `Namespace`, `K8sName`, and `ServicePorts`. Build the in-cluster address from those fields and a port taken from `ServicePorts`; do not hard-code the port:

```json
{
  "deploymentResults": {
    "candidates": [
      {
        "name": "candidates",
        "type": "http-k8s-service",
        "spec": {
          "Namespace": "vector-42",
          "K8sName": "candidates-7f3a",
          "ServicePorts": [{ "name": "http", "port": 80 }]
        }
      }
    ]
  }
}
```

Here a consumer looks up the result named `candidates` and resolves it to `candidates-7f3a.vector-42.svc.cluster.local:80`.

The single-flag and bulk endpoints resolve feature flags only. Deployment results and authored config are available through the whole-bundle response.

## Use deployment results for service discovery

Use deployment results when one component in a vector needs an address, identity, URL, or allocated resource that another component receives during deployment.

You do not need to know these values before deployment. The platform fills them in at deploy time, and your application reads them back by name at runtime.

::: warning
The deployment result schema is not final and may change in a future release.
:::

## Next steps

To read deployment results from application code, see [Access vector data in your application](./access-vector-data.md).
