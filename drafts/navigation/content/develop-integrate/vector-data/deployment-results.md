---
title: Use deployment results
description: Learn how deployment results become vector data and how your application reads them at runtime.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Use deployment results

Use deployment results to discover Kubernetes Services from running application code. Add an annotation to the Service in your artifact, then read its deployed address from the [vector data service](../../reference/glossary.md#vector-data-service).

The shared [vector data model](./overview.md#deployment-results) explains how Konfidence aggregates results from deployers.

## Prerequisites

- A Helm or Kustomize artifact deployed by the Kubernetes deployer.
- The producing artifact has been deployed; results are available from that point (including during the migration phase), not only after the vector is activated.
- Your application can access vector data through the [vector data service](../../reference/glossary.md#vector-data-service).

## Expose a Kubernetes Service

To let other components in the vector discover a Service, add the `konfidence.cloud/deployment-result` annotation to it. The annotation value is the stable name consumers use to look it up:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: candidates
  annotations:
    konfidence.cloud/deployment-result: candidates
spec:
  ports:
    - name: http
      port: 80
```

Only Kubernetes Services can be exposed this way today. For how the deployer turns the annotation into a deployment result, see [How deployment results work](#how-deployment-results-work).

A deployment result is identified by the pair `(name, type)`, which must be unique within a component. Giving two Services in the same component the same annotation value is rejected at deploy time.

This annotation does not opt the Service into stage ingress. To select a port for external requests, see [Expose a Service through stage ingress](../advanced-features/expose-service.md).

## How deployment results work

### Why the annotation is required

The deployer applies a per-vector `nameSuffix` (Kustomize) or `releaseName` (Helm). The Service's deployed name is therefore unknown ahead of time, and a caller cannot hard-code it. The annotation makes the Service discoverable and supplies the **stable name** (its value) that consumers look up. Services without the annotation do not produce deployment results.

### How the deployer processes the annotation

After the [artifact](../../reference/glossary.md#artifact) is deployed, the deployer lists the Services it created. For each Service carrying the annotation, it records a deployment result on the `ArtifactDeployment` containing:

- The annotation value as the result name.
- The Service's namespace and its actual (suffixed) name.
- The Service's ports verbatim (multi-port Services are supported as-is).

Konfidence aggregates these into the vector's [`VectorData`](../../reference/glossary.md#vector-data), keyed by artifact component. Every component in the vector can then resolve the Service by its stable name at runtime.

### Scope

Only Kubernetes `Service` objects can be exposed this way today (deployment-result type `http-k8s-service`). Other resource kinds are not yet supported.

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

The single-flag and bulk endpoints resolve [feature flags](../../reference/glossary.md#feature-flag) only. Deployment results and authored config are available through the whole-bundle response.

## Use deployment results for service discovery

Use deployment results when one component in a vector needs an address, identity, URL, or allocated resource that another component receives during deployment.

You do not need to know these values before deployment. The platform fills them in at deploy time, and your application reads them back by name at runtime.

::: warning
The deployment result schema is not final and may change in a future release.
:::

## Next steps

To read deployment results from application code, see [Access vector data in your application](./access-vector-data.md).
