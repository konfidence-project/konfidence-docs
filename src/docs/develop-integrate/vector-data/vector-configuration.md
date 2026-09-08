---
title: Add configuration to a vector
description: Learn how to use vector-scoped configuration to manage settings that are specific to individual vectors.
---

# Add configuration to a vector

Add vector-scoped configuration to a vector. Use it for feature flags and authored configuration values that Konfidence versions together with the vector.

Konfidence bakes the configuration into the vector, so the vector ID uniquely determines its configuration. Two paths lead there: Konfidence assembles the vector from a `VectorTemplate`, or you build the vector yourself with the `kden` CLI.

## Prerequisites

- You know which path builds your vectors. See [Build vectors](../observe-improve/build-vectors.md).
- For the template path: a `VectorTemplate` for the vector that receives the configuration.
- For the manual path: the vector's component constructor file and the `kden` CLI.

## Choose how the configuration enters the vector

Both paths produce the same result: an OCM resource named `cloud-konfidence-vector-config` on the vector. Pick the path that matches how you build vectors.

| You build vectors with | Path | Where the configuration lives |
| --- | --- | --- |
| A `VectorTemplate` and Konfidence assembly | [Add the configuration to a VectorTemplate](#add-the-configuration-to-a-vectortemplate) | `spec.vectorConfig` of the template |
| `kden vector push` from a constructor file | [Add the configuration to a manually built vector](#add-the-configuration-to-a-manually-built-vector) | A JSON file referenced as a resource in the constructor file |

## Add the configuration to a VectorTemplate

Add `spec.vectorConfig` to the `VectorTemplate` custom resource:

```yaml
spec:
  vectorConfig:
    features:
      enableBeta: true
      maxUsers: 150
      ratio: 4.6
      title: "TestLabel"
    authored:
      log-level: info
      database:
        host: "mysql-service"
        port: 3306
```

If the `VectorTemplate` is new or changed, assembly creates a new vector. The configuration becomes a local resource of that vector.

## Add the configuration to a manually built vector

Ship the configuration as one JSON file and reference it from the vector's component constructor.

1. Write the configuration file next to the constructor file, for example `vector-config.json`:

   ```json
   {
     "schemaVersion": "v1",
     "features": {
       "enableBeta": true,
       "maxUsers": 150
     },
     "authored": {
       "log-level": "info"
     }
   }
   ```

   `schemaVersion` must be `v1`. Both `features` and `authored` are optional.

2. Add the file as a local resource named `cloud-konfidence-vector-config` to the vector component:

   ```yaml
   components:
     - name: github.com/example/shop/vector
       version: v1.0.0
       provider:
         name: example
       componentReferences:
         - componentName: github.com/example/shop/checkout
           name: checkout
           version: v1.0.0
       resources:
         - name: cloud-konfidence-vector-config
           type: json
           version: 1.0.0
           relation: local
           input:
             type: file/v1
             path: ./vector-config.json
             mediaType: application/json
   ```

   Konfidence matches the resource by its name, not by its type. A vector carries at most one resource with this name. A second one fails the deployment.

3. Validate and push the vector:

   ```bash
   kden vector validate --files ./component.yaml
   kden vector push --file ./component.yaml --registry <registry>/<subpath>
   ```

   The command pushes the vector component version with the configuration resource. See [kden vector push](../../reference/cli.md#kden-vector-push) for all flags.

## Feature flags

Use the top-level `features` block for feature flags. The keys are flat, and values can use any JSON value type, such as Boolean, number, string, array, or object.

```json
{
  "features": {
    "new-checkout": true,
    "max-users": 150,
    "experimental-payment-providers": ["stripe", "adyen"]
  }
}
```

Konfidence does not add targeting, variants, or rules inside feature flags. The vector is the targeting unit. Changing a flag creates a new vector version, which keeps the change auditable, atomic with code, and reproducible.

To read flags from your application, see [Read feature flags in your application](../advanced-features/feature-flags.md).

## Authored config

Use the top-level `authored` block for free-form JSON. Konfidence does not impose a schema on it. This block is a contract between you and your application.

```json
{
  "authored": {
    "ui": {
      "theme": "dark",
      "locale": "en-US"
    },
    "limits": {
      "requestTimeoutMs": 5000
    }
  }
}
```

Authored config is optional, singleton, and immutable per vector version. Provide one `authored` block per vector, or none.

Authored config is available through the whole-bundle response only. Query the vector ID as the flag key and read the `authored` subtree from the returned vector configuration object. The single-flag and bulk endpoints resolve feature flags only.

## Next steps

After you add configuration to a vector, [access vector data in your application](./access-vector-data.md).
