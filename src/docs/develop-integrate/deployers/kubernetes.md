---
title: Kubernetes Deployer
description: Reference for the built-in Kubernetes Deployer — supported manifest types and authoring conventions for artifacts consumed by it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Kubernetes Deployer

The **Kubernetes Deployer** is the reference implementation of Konfidence's
Deployer interface.

<!-- TODO: link to the Deployer interface specification once available; see
[Deployer Specification](../../reference/deployer-specification.md). -->

This page documents the manifest types this deployer supports and the
authoring rules an artifact author must follow so that artifacts consumed by
this deployer render correctly.

## Supported manifest types

The value of `.spec.manifest.type` on an `ArtifactDeployment` selects the
sub-controller that reconciles it. This deployer handles the following types:

| `manifest.type`                    | OCM resource type | Flux resources created                                    |
| :--------------------------------- | :---------------- | :-------------------------------------------------------- |
| `cloud.konfidence.flux.kustomize`  | `kustomize`       | `OCIRepository` (source) + `Kustomization` (kustomize.toolkit.fluxcd.io) |
| `cloud.konfidence.flux.helm`       | `helmChart`       | `HelmRepository` (source) + `HelmRelease` (helm.toolkit.fluxcd.io)       |

An `ArtifactDeployment` whose `manifest.type` does not match either value is
ignored by this deployer.

Each `ArtifactDeployment` must carry **at most one** OCM resource of the
matching type. Deployments with more than one matching resource are rejected
with `[Ready=False] MultipleKustomizeResources` (kustomize path) or
`[Ready=False] MultipleHelmChartResources` (helm path). Deployments with zero
matching resources produce no Flux resources.

## Referencing the deployable artifact in OCM

Reference the pushed OCI artifact from the component constructor as an
external OCM resource. The `type:` must match the manifest type (`kustomize`
or `helmChart`).

**Kustomize bundle:**

```yaml
resources:
  - name: manifests
    type: kustomize
    version: v1.0.0
    relation: external
    access:
      type: ociArtifact
      imageReference: registry.example.com/path/to/bundle:v1.0.0
```

**Helm chart:**

```yaml
resources:
  - name: chart
    type: helmChart
    version: v1.0.0
    relation: external
    access:
      type: ociArtifact
      imageReference: registry.example.com/path/to/chart:1.0.0
```

## A note on artifact reuse

Konfidence may create multiple parallel instances of the same artifact — one
per version, or one per `VectorDeployment` when the artifact manifest sets
`allowReuse: false`. Each instance is scoped by kustomize `nameSuffix` or Helm
`releaseName` so its resources can coexist on the cluster.

When authoring, keep in mind that anything you include in the bundle or chart
will be duplicated per instance. Resources for which duplicate application
does not make sense (`CustomResourceDefinition` is the canonical example) must
be shipped through a separate delivery path.

## Kustomize authoring (`cloud.konfidence.flux.kustomize`)

### Packaging

The OCI artifact referenced by `imageReference` must be a Flux-compatible OCI
artifact containing a `kustomization.yaml` at its root, alongside any manifest
files it lists under `resources:`. Typically produced with:

```bash
flux push artifact oci://registry.example.com/path:tag \
  --path=./manifests --source=<git-repo> --revision=<rev>
```

### Fields set by the deployer on the Flux `Kustomization`

The deployer sets the following fields on every `Kustomization` it creates:

| Field                | Value                                                                |
| :------------------- | :------------------------------------------------------------------- |
| `metadata.name`      | The `ArtifactDeployment` name                                        |
| `spec.sourceRef`     | Points to the sibling `OCIRepository` (same name)                    |
| `spec.targetNamespace` | The landscape namespace                                            |
| `spec.nameSuffix`    | `-<sanitized-artifact-version>-<hash>` — derived from the AD's `konfidence.cloud/artifact-version` and `-hash` annotations |
| `spec.commonMetadata.labels` | Includes `konfidence.cloud/artifact-deployment=<AD-name>`    |

### Fields that must not be set in the bundle's `kustomization.yaml`

The following fields, if present in the artifact author's own
`kustomization.yaml`, are **overwritten** by the deployer before
`kustomize build` runs and their values are silently discarded:

- `nameSuffix`
- `namespace`

### Resulting resource names

The final `metadata.name` of every resource produced by `kustomize build`
follows the pattern:

```
<name-declared-in-your-manifest><nameSuffix>
```

For a manifest named `hello` in an artifact with version `v1.0.0` and hash
`abc12345`, the applied resource is named `hello-v1-0-0-abc12345`.

## Helm authoring (`cloud.konfidence.flux.helm`)

### Packaging

The OCI artifact referenced by `imageReference` must be a Helm OCI chart,
typically produced with:

```bash
helm package <chart-dir>
helm push <chart>-<version>.tgz oci://registry.example.com/path
```

### Fields set by the deployer on the Flux `HelmRelease`

The deployer sets the following fields on every `HelmRelease` it creates:

| Field                          | Value                                                             |
| :----------------------------- | :---------------------------------------------------------------- |
| `metadata.name`                | The `ArtifactDeployment` name                                     |
| `spec.releaseName`             | The `ArtifactDeployment` name                                     |
| `spec.chart.spec.sourceRef`    | Points to the sibling `HelmRepository` (same name)                |
| `spec.targetNamespace`         | The landscape namespace                                           |
| `spec.storageNamespace`        | The landscape namespace                                           |
| `spec.commonMetadata.labels`   | Includes `konfidence.cloud/artifact-deployment=<AD-name>`         |

The Helm release name is therefore identical to the `ArtifactDeployment`
name — deterministic per (component, version, `allowReuse`, VectorDeployment).

### Chart template requirement

Every resource in the chart must derive its `metadata.name` from
<code v-pre>{{ .Release.Name }}</code>.

**Supported:**

<div v-pre>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}
```

</div>

**Not supported:**

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: my-service           # hard-coded — will collide across versions or VDs
```

A chart with hard-coded resource names produces name collisions when the same
chart is deployed at two versions on the same landscape, or when two
`VectorDeployment` instances (with `allowReuse: false`) reference the same
component.

## Exposing a Service as a deployment result

By default the Services in your bundle or chart are internal. To let other
components in the same vector discover and call a Service, annotate it:

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

**Why the annotation is required.** The deployer applies a per-vector
`nameSuffix` (kustomize) or `releaseName` (Helm), so the Service's deployed name
is not known ahead of time and a caller cannot hard-code it. The annotation both
opts the Service in and supplies the **stable name** (its value) that consumers
look up. Services without the annotation are never exposed.

**How the deployer processes it.** After the artifact is deployed, the deployer
lists the Services it created and, for each one carrying the annotation, records
a deployment result on the `ArtifactDeployment` containing:

- the annotation value as the result name,
- the Service's namespace and its actual (suffixed) name,
- the Service's ports verbatim (multi-port Services are supported as-is).

Konfidence aggregates these into the vector's `VectorData`, keyed by artifact
component, so every component in the vector can resolve the Service by its stable
name at runtime — see [Use deployment results](../vector-data/deployment-results.md).

**Scope.** Only Kubernetes `Service` objects can be exposed this way today
(deployment-result type `http-k8s-service`). Other resource kinds are not yet
supported.

## Related

- [Publish Artifacts](../publish-artifacts.md)
- [Glossary — Deployer](../../reference/glossary.md#deployer)
