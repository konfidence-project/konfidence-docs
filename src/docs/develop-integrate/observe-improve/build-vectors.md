---
title: Build vectors
description: Define a VectorTemplate to assemble an immutable vector from published artifacts.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Build vectors

<!--
  Content type (Diátaxis): How-to guide - an application developer defines a
  VectorTemplate so that Konfidence continuously assembles vectors from
  published artifacts.
-->

A vector is an immutable OCM component that captures the exact set of artifact
versions your application consists of at a given point in time. You define a
`VectorTemplate` resource to tell Konfidence how to assemble and store that
vector.

For background on artifacts, aliases, and vectors, see
[Vectors and artifacts](../../core-concepts/vectors-and-artifacts.md).

## Prerequisites

- Your artifacts are published to an OCI registry. See
  [Publish artifacts](../artifact-types/publish-artifacts.md).
- You have a Konfidence project namespace.
- Your registry credentials are stored in Kubernetes Secrets in the same
  namespace.

## How assembly works

The Konfidence assembly controller reconciles every `VectorTemplate` on a
configurable interval (default: one minute) and immediately whenever the spec
changes or a referenced base vector is updated.

On each reconcile the controller:

1. Resolves credentials from the referenced Secrets.
2. Fetches the current artifact version for each entry in `components`.
3. Merges the base vector artifacts (if `base` is set) with the component
   artifacts.
4. Compares the desired artifact set against the most recently assembled vector
   stored in `status.latestVector`.
5. If drift is detected, generates a new concrete version (UTC timestamp, e.g.
   `2026.8.5-090000000Z`), copies all artifact components into the upload target
   repository, and writes the new vector descriptor there.
6. Updates `status.latestVector` with the full reference of the new vector.

If no drift is detected, `status.latestVector` is not updated and the condition
reason is set to `NoDriftDetected`.

## Create a VectorTemplate

### Minimal example

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: shopping-app
  namespace: my-project
spec:
  uploadTarget: registry.example.com/my-project//example.com/vector/shopping-app
  components:
    - name: registry.example.com/my-project//example.com/web-bff:main
    - name: registry.example.com/my-project//example.com/product-service:main
  credentials:
    ocm:
      refs:
        - name: registry-credentials
```

Apply the resource:

```bash
kubectl apply -f vectortemplate.yaml
```

After the first successful assembly, `status.latestVector` is set:

```bash
kubectl get vectortemplate shopping-app -n my-project
```

```
NAME           READY   REASON            UPLOAD-TARGET                                               LATEST-VECTOR                                                                      AGE
shopping-app   True    VectorCreated     registry.example.com/my-project//example.com/vector/...    registry.example.com/my-project//example.com/vector/shopping-app:2026.8.5-...    2m
```

### Field reference

**`uploadTarget`** - required  
The OCM component path where assembled vectors are stored. Must not include a
version - the controller generates the version on each assembly.

```
registry.example.com/my-project//example.com/vector/shopping-app
```

**`components`** - required (min 1 entry)  
List of artifact component references to include in the vector. Each entry uses
the format `<repository>//<component>:<version-or-alias>`. Alias tags such as
`main`, `stable`, or `latest` are accepted and resolved on each reconcile so
the vector tracks moving artifact versions automatically.

```yaml
components:
  - name: registry.example.com/my-project//example.com/web-bff:main
  - name: registry.example.com/my-project//example.com/product-service:stable
```

**`credentials`** - optional  
References Secrets in the same namespace that carry OCM or OCI registry
credentials (`.ocmconfig` or `.dockerconfigjson`). The same credential refs
are used for registry access, signing, and verification.

```yaml
credentials:
  ocm:
    refs:
      - name: registry-credentials
      - name: signing-keys
```

**`reconcileInterval`** - optional  
Override the default one-minute reconcile interval. Use this to reduce
polling frequency for stable templates.

```yaml
reconcileInterval: 10m
```

## Derive a vector from a base

Use `base` to inherit artifacts from another `VectorTemplate` and override or
extend them with additional components. This is useful when a shared platform
layer (infrastructure, common services) is defined once and individual team
vectors layer their own services on top.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: shopping-app
  namespace: my-project
spec:
  uploadTarget: registry.example.com/my-project//example.com/vector/shopping-app
  base:
    kind: VectorTemplate
    name: platform-base
  components:
    - name: registry.example.com/my-project//example.com/web-bff:main
    - name: registry.example.com/my-project//example.com/product-service:main
  credentials:
    ocm:
      refs:
        - name: registry-credentials
```

The merge rules are:

- Artifacts from `base` form the initial list.
- Each entry in `components` is matched by component name:
  - If a base artifact has the same name, the component version replaces it.
  - If no base artifact matches, the component is appended.
- Base artifacts without a matching component entry are kept unchanged.

When the base template assembles a new vector, dependent templates are
immediately re-enqueued without waiting for the next interval tick.

If the base template has not completed its first assembly yet, the dependent
template enters `Ready=False / WaitingForBase` and waits for the base to
become available - no polling or backoff is applied.

## Add vector configuration

`vectorConfig` embeds feature flags and authored configuration values directly
into the vector descriptor. Use this to bake environment-independent
configuration into the vector rather than managing it separately at deploy time.

```yaml
spec:
  vectorConfig:
    features:
      express-checkout:
        enabled: true
    authored:
      storefrontReplicas: 3
      currency: EUR
```

The controller serializes this as a local OCM resource (`cloud-konfidence-vector-config:1.0.0`) inside the vector descriptor. Changes to `vectorConfig` are treated as drift and trigger a new vector version.

For information on how configuration values reach your running application, see
[Add configuration to a vector](../vector-data/vector-configuration.md).

## Sign and verify

Vectors and artifacts can optionally be signed and verified during assembly using
the `signVector`, `verifyVector`, and `verifyArtifacts` fields. Changes to these
settings are treated as drift and trigger a new vector version.

For key configuration, credential setup, and the full procedure, see
[Configure signing and verification](../advanced-features/configure-signing-and-verification.md).

## Monitor assembly status

Check the `Ready` condition to understand the current assembly state:

```bash
kubectl describe vectortemplate shopping-app -n my-project
```

| Condition    | Reason                 | Meaning                                                                                                                              |
|--------------|------------------------|--------------------------------------------------------------------------------------------------------------------------------------|
| `True`       | `VectorCreated`        | Drift detected; a new vector version was assembled and uploaded.                                                                     |
| `True`       | `NoDriftDetected`      | No changes detected; `status.latestVector` is still current.                                                                         |
| `False`      | `WaitingForBase`       | The base template has not assembled its first vector yet.                                                                            |
| `False`      | `VectorCreationFailed` | Drift was detected but the upload to the registry failed.                                                                            |
| `Unknown`    | `DriftDetectionFailed` | Assembly could not determine the desired state - for example, registry unreachable, credentials missing, or a reference parse error. |

## Full example

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: shopping-app
  namespace: my-project
spec:
  reconcileInterval: 10m
  uploadTarget: registry.example.com/my-project//example.com/vector/shopping-app
  base:
    kind: VectorTemplate
    name: platform-base
  components:
    - name: registry.example.com/my-project//example.com/web-bff:main
    - name: registry.example.com/my-project//example.com/product-service:main
  credentials:
    ocm:
      refs:
        - name: registry-credentials
        - name: signing-keys
  verifyArtifacts:
    signatures:
      - name: konfidence
  verifyVector:
    signatures:
      - name: konfidence
  signVector:
    signatures:
      - name: konfidence
        algorithm: RSASSA-PSS
        hashAlgorithm: SHA-256
  vectorConfig:
    features:
      express-checkout:
        enabled: true
    authored:
      storefrontReplicas: 3
      currency: EUR
```

## Next steps

- [Define promotions](/docs/deploy-operate/define-promotions) to move assembled vectors through
  your delivery stages.
- [Configure signing and verification](../advanced-features/configure-signing-and-verification.md)
  for production environments.
- [Add configuration to a vector](../vector-data/vector-configuration.md) to bake
  feature flags and authored config into your vector.
- [Access vector data in your application](../vector-data/access-vector-data.md) to
  read configuration and feature flags at runtime.
