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

A vector is an immutable [Open Component Model (OCM)](https://ocm.software) component that captures the
exact set of artifact versions that make up your application at a given point
in time.

Vectors can be created in two ways:

- **Automatically** - by defining a `VectorTemplate` resource. Konfidence
  continuously reconciles the template and assembles a new vector whenever a delta
  is detected in the referenced artifacts.
- **Manually** - by pushing an OCM component directly to the upload target
  registry using the OCM CLI or your own tooling.

This guide covers the automated path. You define a `VectorTemplate` resource to
tell Konfidence how to assemble and store that vector.

For background on artifacts, aliases, and vectors, see
[Vectors and artifacts](../../core-concepts/vectors-and-artifacts.md).

## Prerequisites

Before you begin, make sure you meet these requirements:

- Your artifacts are published to an Open Container Initiative (OCI) registry. See
  [Publish artifacts](../artifact-types/publish-artifacts.md).
- You have `kubectl` configured with access to a
  [Konfidence project namespace](../../deploy-operate/projects.md).
- If your registry is private, its credentials are stored in Kubernetes Secrets
  in the same namespace.

## How assembly works

The Konfidence assembly controller reconciles every `VectorTemplate` at a
configurable interval. The default is one minute. It also reconciles a template
immediately when its specification changes or a referenced base vector is
updated.

During each reconciliation, the controller:

1. Resolves credentials from the referenced Secrets.
2. Fetches the current artifact version for each entry in `components`.
3. Merges the base vector artifacts (if `base` is set) with the component
   artifacts.
4. Compares the desired artifact set against the most recently assembled vector
   stored in `status.latestVector`.
5. If drift is detected, generates a new concrete version (UTC timestamp, for
   example, `2026.8.5-090000000Z`), copies all artifact components into the
   upload target repository, and writes the new vector descriptor there.
6. Updates `status.latestVector` with the full reference of the new vector.

If no drift is detected, `status.latestVector` is not updated and the condition
reason is set to `NoDriftDetected`.

## Create a VectorTemplate

### Create a minimal VectorTemplate

Save the following manifest as `vectortemplate.yaml`:

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

Replace the resource names, namespace, component references, upload target, and
Secret name with values for your environment.

Apply the resource:

```bash
kubectl apply -f vectortemplate.yaml
```

Watch the template until the first assembly completes:

```bash
kubectl get vectortemplate shopping-app -n my-project --watch
```

The template is ready when the `READY` column shows `True`:

```bash
kubectl get vectortemplate shopping-app -n my-project
```

```text
NAME           READY   REASON            UPLOAD-TARGET                                               LATEST-VECTOR                                                                      AGE
shopping-app   True    VectorCreated     registry.example.com/my-project//example.com/vector/...    registry.example.com/my-project//example.com/vector/shopping-app:2026.8.5-...    2m
```

### Field reference

**`uploadTarget`**: Required. The OCM component path where assembled vectors are
stored. Do not include a version. The controller generates the version during
each assembly.

```text
registry.example.com/my-project//example.com/vector/shopping-app
```

**`components`**: Required, with at least one entry. Lists the artifact component
references to include in the vector. Each entry uses
the format `<repository>//<component>:<version-or-alias>`. Alias tags such as
`main`, `stable`, or `latest` are accepted and resolved during each
reconciliation, so the vector tracks moving artifact versions automatically.

```yaml
components:
  - name: registry.example.com/my-project//example.com/web-bff:main
  - name: registry.example.com/my-project//example.com/product-service:stable
```

**`credentials`**: Optional. References Secrets in the same namespace that
contain OCM configuration or Docker credentials (`.ocmconfig` or
`.dockerconfigjson`). Registry credentials are required for private registries.
If all registries are public and you do not configure signing or verification,
omit this field. The same Secret references are used for artifact access,
signing, and verification.

```yaml
credentials:
  ocm:
    refs:
      - name: registry-credentials
      - name: signing-keys
```

**`reconcileInterval`**: Optional. Overrides the default one-minute reconcile
interval. Use this field to reduce the polling frequency for stable templates.

```yaml
reconcileInterval: 10m
```

## Derive a vector from a base (optional)

Use `base` to inherit artifacts from another `VectorTemplate` and override or
extend them with additional components. Use this field when you define a shared
platform layer, such as infrastructure and common services, once and add each
team's services in its own vector.

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

<details>
<summary>Merge rules</summary>

- Artifacts from `base` form the initial list.
- Each entry in `components` is matched by component name:
  - If a base artifact has the same name, the component version replaces it.
  - If no base artifact matches, the component is appended.
- Base artifacts without a matching component entry are kept unchanged.

</details>

When the base template assembles a new vector, dependent templates are
immediately re-enqueued without waiting for the next interval tick.

If the base template has not completed its first assembly yet, the dependent
template enters `Ready=False` with the reason `WaitingForBase` and waits for the
base to become available. The controller does not poll or apply backoff.

## Add vector configuration (optional)

`vectorConfig` embeds feature flags and authored configuration values directly
into the vector descriptor. Use this field to include environment-independent
configuration in the vector rather than managing it separately at deploy time.

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

The controller serializes this configuration as a local OCM resource
(`cloud-konfidence-vector-config:1.0.0`) inside the vector descriptor. Changes to
`vectorConfig` are treated as drift and trigger a new vector version.

For information on how configuration values reach your running application, see
[Add configuration to a vector](../vector-data/vector-configuration.md).

## Sign and verify (optional)

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

| Status | Reason | Meaning |
| --- | --- | --- |
| `True` | `VectorCreated` | Drift was detected; a new vector version was assembled and uploaded. |
| `True` | `NoDriftDetected` | No changes were detected; `status.latestVector` is still current. |
| `False` | `WaitingForBase` | The base template has not assembled its first vector yet. |
| `False` | `VectorCreationFailed` | Drift was detected, but the assembly failed. Possible causes include a component copy error, a signing failure, or a write error when publishing the vector descriptor. |
| `Unknown` | `DriftDetectionFailed` | Assembly could not determine the desired state. Possible causes include an unreachable registry, missing credentials, or a reference that cannot be parsed. |

## Full example

The following illustrative manifest combines all fields described on this page.
Use it only when you need the optional settings. Before you apply it, replace
the sample values and make sure that the referenced `platform-base`
`VectorTemplate`, registry credential Secret, and signing key Secret exist in
the same namespace.

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

Continue with the guides that support your delivery workflow:

- [Promote vectors](../../deploy-operate/promote-vectors.md) to move assembled vectors through
  your delivery stages.
- [Configure signing and verification](../advanced-features/configure-signing-and-verification.md)
  for production environments.
- [Add configuration to a vector](../vector-data/vector-configuration.md) to include
  feature flags and authored configuration in your vector.
- [Access vector data in your application](../vector-data/access-vector-data.md) to
  read configuration and feature flags at runtime.
