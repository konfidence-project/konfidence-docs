---
title: Vectors and Artifacts
description: Learn how artifacts, aliases, and vectors define an application version in Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Vectors and Artifacts

Before you deploy software, you must define what should be delivered.
Konfidence uses the Open Component Model (OCM) to describe build outputs and combine them into immutable application versions.

## Artifacts

An [artifact](../reference/glossary.md#artifact) describes one piece of your software, such as a microservice, a configuration file, or an asset.
Development teams usually build and publish artifacts in their continuous integration (CI) pipelines.

An artifact is an OCM component version that contains a reference to a build result, such as a Docker image, and its metadata.
The artifact can point to the deployable content or include binary resources directly.

To learn how to create OCM components, see the [OCM guide on creating component versions](https://ocm.software/docs/getting-started/create-component-versions/).

## Artifact aliases

An artifact reference identifies an OCM component in a repository and selects a version of it.
A [`VectorTemplate`](../reference/glossary.md#vectortemplate) can reference a concrete version, such as `1.0.0`, or an artifact alias, such as `main`.

[Artifact aliases](../reference/glossary.md#artifact-alias) are mutable tags that point to an existing artifact version.
An alias can describe any dimension that matters to your delivery model, for example:

- Maturity, such as `experimental` or `stable`.
- Time, such as `latest` or `nightly`.
- Source branch, such as `main` or `develop`.
- Team-specific or product-specific tracks.

For example, your CI pipeline can update the `main` alias after publishing a new build.
The `VectorTemplate` can keep referencing that alias without a template change for every build.
During assembly, Konfidence resolves the alias and records the concrete artifact version in the vector.
Updating the alias later does not change an existing vector.

## Vectors

A [vector](../reference/glossary.md#vector) is a complete, immutable snapshot of your application at a specific point in time.
It is an OCM component with a fixed collection of artifacts that belong together.

Because a vector is immutable, the exact combination of services you tested is the exact combination you deliver.
When an artifact reference changes, Konfidence creates a new vector instead of changing an existing one.

You can define vectors for different purposes, for example:

- A production vector assembled from artifacts selected through `stable` aliases.
- A preview vector assembled from artifacts selected through `experimental` aliases.
- A team-focused vector that contains only the services owned by one team.

## Build: publish artifacts

Konfidence does not prescribe how teams build their applications.
It reads published artifacts as OCM component versions from an Open Container Initiative (OCI) registry.
OCM describes the component, its resources, and metadata; the OCI registry stores that content.

Publishing a container image alone does not create the OCM component version that a `VectorTemplate` references.
You define an OCM component constructor: a YAML file that describes the component's contents.
It references the Konfidence artifact manifest and your deployable content, such as a Helm chart or Kustomize bundle.
Your CI pipeline can then run `kden artifact push` to validate those inputs and publish the component version.
Follow [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md) for the required files and commands.

An alias is optional.
You or your CI pipeline create and update it with `kden artifact alias` after publishing the component version.
Use an alias when a template should follow new builds, or reference a concrete version to select a specific build.
See [Create an alias](../develop-integrate/artifact-types/publish-artifacts.md#optional-create-an-alias) for the command and reference format.

## Assemble: define the vector

A vector is the complete application version that Konfidence moves through the [delivery flow](../reference/glossary.md#delivery-flow).
It contains the selected artifact references and represents the desired application state at a specific point in time.

The `VectorTemplate` custom resource defines how Konfidence assembles that vector.
Start with these fields:

- `uploadTarget`, which defines where the assembled vector is stored.
- `components`, which lists artifact references in the form `<repository>//<component>:<version-or-alias>`.
- `credentials`, which optionally references Secrets used to access the required registries.

The following illustrative template selects one artifact through an alias and another by a concrete version:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: example-vector
  namespace: default
spec:
  uploadTarget: registry.example.com/my-project//example.com/vector/example-vector
  components:
    - name: registry.example.com/my-project//example.com/service1:main
    - name: registry.example.com/my-project//example.com/service2:1.0.0
  credentials:
    ocm:
      refs:
        - name: registry-credentials
```

The `uploadTarget` field contains only the component path without a version.
Konfidence generates a UTC timestamp version when it assembles a new vector.
The first entry in `components` follows the `main` alias for `service1`; the second selects version `1.0.0` of `service2`.
Both entries are artifact references. Only the first uses an alias.

The component artifacts do not have to be stored in the same registry as the vector target.
If a component artifact is stored elsewhere, Konfidence copies it into the target registry defined by `uploadTarget`.

### Derive a vector from a base (optional)

Use `base` when several vectors share a set of artifacts, such as common platform services.
The field references another `VectorTemplate` in the same namespace.
Konfidence uses that template's latest assembled vector as the starting set of artifacts.

Your `components` can add artifacts or replace a base artifact with the same component name.
Other base artifacts are kept, and the base vector remains unchanged.
For the manifest and assembly behavior, see [Derive a vector from a base](../develop-integrate/observe-improve/build-vectors.md#derive-a-vector-from-a-base-optional).

## Related pages

Use these pages to publish artifacts, assemble vectors, and understand where they are delivered:

- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md) shows how to create an OCM component version and an optional alias.
- [Delivery flow](./delivery-flow.md) explains how vectors move from build outputs to controlled [stage](../reference/glossary.md#stage) state.
- [Landscapes and stages](./landscapes-and-stages.md) explains where vectors are delivered and how stages express the desired application version.
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md) explains the task-oriented flow for assembling vectors.
