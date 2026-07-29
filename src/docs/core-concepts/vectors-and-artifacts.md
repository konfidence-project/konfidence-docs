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

An artifact describes one piece of your software, such as a microservice, a configuration file, or an asset.
Development teams usually build and publish artifacts in their continuous integration (CI) pipelines.

An artifact is an OCM component version that contains a reference to a build result, such as a Docker image, and its metadata.
The artifact can point to the deployable content or include binary resources directly.

To learn how to create OCM components, see the [OCM guide on creating component versions](https://ocm.software/docs/getting-started/create-component-versions/).

## Artifact aliases

Konfidence does not rely on the semantic version of each individual artifact when it decides what to deliver.
It delivers a vector, which represents the application as a whole.
That means the important version is the exact combination of artifacts inside the vector.

Artifact aliases are dynamic references that tell Konfidence which artifact flavor to include when it assembles a vector.
An alias can describe any dimension that matters to your delivery model, for example:

- Maturity, such as `experimental` or `stable`.
- Time, such as `latest` or `nightly`.
- Source branch, such as `main` or `develop`.
- Team-specific or product-specific tracks.

In most setups, one branch-based alias is enough.
For example, a service can publish each successful build from the main branch under the `main` alias.
The alias then acts as a floating pointer that lets `VectorTemplate` detect artifact changes without requiring you to update the template for every new build.

## Vectors

A vector is a complete, immutable snapshot of your application at a specific point in time.
It is an OCM component with a fixed collection of artifacts that belong together.

Because a vector is immutable, the exact combination of services you tested is the exact combination you deliver.
When an artifact reference changes, Konfidence creates a new vector instead of changing an existing one.

You can define vectors for different purposes, for example:

- A production vector with stable artifact aliases.
- A preview vector with experimental artifact aliases.
- A team-focused vector that contains only the services owned by one team.

## Build: publish artifacts

Konfidence does not prescribe how teams build their applications.
A CI pipeline can use the build system that fits the application, as long as the resulting artifact is available in an OCM-compliant repository.

For Konfidence to assemble vectors from those artifacts, each artifact needs an alias that Konfidence can resolve.
The alias does not replace semantic versioning for the artifact itself.
It gives the vector model a stable name for a moving target, such as "the current main-branch build of this service."

## Assemble: define the vector

A vector is the complete application version that Konfidence moves through the delivery flow.
It contains the selected artifact references and represents the desired application state at a specific point in time.

The `VectorTemplate` custom resource defines how Konfidence assembles that vector.
The most important fields are:

- `uploadTarget`, which defines where the assembled vector is stored.
- `components`, which defines which previously built artifacts are part of the vector.
- `credentials`, which references Secrets used to access the required registries.
- `base`, which can optionally reference an existing vector to build on.

The following example shows the relationship between those fields:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: example-vector
  namespace: default
spec:
  uploadTarget: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  components:
    - name: https://registry.kdenv.lab/sample-project//konfidence.project/sample-vector/service1:main
    - name: https://registry.example.com/sample-project//example.tools/dev/service2:stable
  credentials:
    ocm:
      refs:
        - name: registry-credentials
```

Both the `uploadTarget` and the entries under `components` use aliases so that Konfidence can resolve the referenced resources.
The component artifacts do not have to be stored in the same registry as the vector target.
If a component artifact is stored elsewhere, Konfidence copies it into the target registry defined by `uploadTarget`.

When `base` is set, the new vector includes the artifacts from the base vector and the additional artifacts listed under `components`.
This lets teams derive a new vector from an existing vector without redefining every artifact reference.

## Related pages

- [Delivery Flow](./delivery-flow.md) explains how vectors move from build outputs to controlled stage state.
- [Stages and Promotions](./stages-and-promotions.md) explains how stages select vectors and how promotions prepare vectors for later targets.
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md) explains the task-oriented flow for assembling vectors.
