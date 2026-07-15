---
title: Add configuration to a vector
description: Learn how to use vector-scoped configuration to manage settings that are specific to individual vectors.
---

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to pass configuration values that are scoped to a specific vector
-->

# Add configuration to a vector

This guide explains how to add vector-scoped configuration to a vector. Use this configuration for feature flags and authored configuration values that must be versioned with the vector.

Konfidence bakes the configuration into the vector at assembly time, so the vector ID uniquely determines its configuration. Provide it inline in the `VectorTemplate`.

## Prerequisites

- You have a `VectorTemplate` for the vector that should receive the configuration.

## Add the configuration

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

If the `VectorTemplate` is new or changed, assembly creates a new vector and adds the configuration as a local resource to the vector.

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

Use a standard [OpenFeature Remote Evaluation Protocol (OFREP) provider](https://openfeature.dev/ecosystem) or a custom OFREP-compatible provider to resolve flag values from the configuration service.

Read a flag with a standard OpenFeature client:

```js
client.getBooleanValue("new-checkout", false, evaluationContext)
```

Set `evaluationContext.targetingKey` to the vector ID from the `X-Vector-ID` HTTP header.

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
