---
title: Provide configuration to a vector
description: Learn how to use vector-scoped configuration to manage settings that are specific to individual vectors.
---

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to pass configuration values that are scoped to a specific vector
-->

# Provide configuration to a vector




Categories 1 (feature toggles) and 2 (arbitrary authored config) are shipped together in one vector-config.json file 
  → published as one OCM artifact of type cloud.konfidence.vector.config 
  → referenced by the VectorTemplate and baked into the vector at assembly time  

Author workflow for categories 1 + 2 (recommended pipeline)
*   Source of truth: keep vector-config.json in a Git repository (its own repo, or alongside your app code).
*   CI on main: on every push to main, the pipeline runs kden push vector-config ./vector-config.json --component github.com///vector-config --version — same UX as kden push artifact.
*   Versioning: bump version per release (semver, commit-sha, date, your call). Konfidence imposes nothing beyond the top-level schemaVersion field inside the file.
*   VectorTemplate references it by alias: configuration.source: /.../vector-config:stable. Galaxy resolves the alias at assembly time, validates the artifact, and bakes a pinned reference into the resulting vector — so the vector-id always uniquely determines the exact config.
*   Alias drift = new vector. Push a new version under the same alias, the next assembly produces a new vector version → "config is versioned with the vector" holds automatically, and rollback = redeploying the old vector.


## Feature toggles

*   Top-level features block — flat keys, any JSON value type (bool, number, string, array, object):  
    "features": {  
    "new-checkout": true,  
    "max-users": 150,  
    "experimental-payment-providers": \["stripe", "adyen"\]  
    }
*   No targeting / variants / rules. The vector is the targeting unit — flipping a toggle = new vector version. Auditable, atomic with code, reproducible.
*   Read with stock OpenFeature: client.getBooleanValue("new-checkout", false, evaluationContext) where evaluationContext.targetingKey = X-Vector-ID.

## Authored config

*   Top-level authored block — free-form JSON, Konfidence imposes no schema beyond schemaVersion. It's your contract with your own app:  
    "authored": {  
    "ui": { "theme": "dark", "locale": "en-US" },  
    "limits": { "requestTimeoutMs": 5000 }  
    }
*   Singleton, optional, immutable per vector version. One vector-config.json per vector or none.
*   Read with the same OFREP API (OpenFeature handles structured-object values), or grab the whole authored sub-tree by querying the vector-id-as-key shortcut.
