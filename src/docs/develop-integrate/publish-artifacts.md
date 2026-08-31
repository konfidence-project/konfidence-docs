---
title: Publish artifacts
description: Publish an application artifact to an OCI registry so that Konfidence can include it in a vector.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Publish artifacts

<!--
  Content type (Diátaxis): How-to guide — an application developer publishes
  a deployable artifact so that Konfidence can include it in a vector.
-->

This guide explains how to publish a deployable artifact as an Open Component Model (OCM) component version to an OCI registry.
After you publish it, you can reference the component version or an alias in a `VectorTemplate`.

For background about artifacts, aliases, and vectors, see [Vectors and artifacts](../core-concepts/vectors-and-artifacts.md).

## Prerequisites

- The `kden` CLI is installed.
- You have the registry URL, configured credentials, and permission to push to the target OCI registry.
- Your deployable content is already available in an OCI registry. For example:
  - A Helm chart published as an OCI artifact.
  - A Kustomize bundle published as an OCI artifact.
- Your deployable content follows the [Kubernetes Deployer authoring rules](./deployers/kubernetes.md).

## Create the Konfidence manifest file

Create a file named `manifest.json`.
It tells Konfidence how to deploy the artifact and whether an artifact instance can be reused across deployments.

For a Helm chart, add:

```json
{
  "type": "cloud.konfidence.flux.helm",
  "allowReuse": true
}
```

For a Kustomize bundle, use `cloud.konfidence.flux.kustomize` as the `type` value.

Set `allowReuse` based on how the artifact should be deployed:

- Set it to `true` when the same artifact instance can be shared across multiple `VectorDeployment` resources.
- Set it to `false` when each `VectorDeployment` needs its own artifact instance.

Only reuse artifacts that do not depend on vector-specific runtime context.
For more information, see [A note on artifact reuse](./deployers/kubernetes.md#a-note-on-artifact-reuse).

## Create the OCM component constructor

Create `component-constructor.yaml` in the same directory as `manifest.json`:

```yaml
components:
  - name: github.com/my-org/my-service
    version: 1.0.0
    provider:
      name: my-org
    resources:
      - name: my-service-manifest
        type: cloud.konfidence.artifact.manifest
        version: 1.0.0
        relation: local
        input:
          type: file/v1
          path: ./manifest.json
      - name: my-service-chart
        type: helmChart
        version: 1.0.0
        relation: external
        access:
          type: ociArtifact
          imageReference: registry.example.com/my-org/my-service:1.0.0
```

The component constructor contains two resources:

- `my-service-manifest` connects the component to `manifest.json` through `input.path`. Each component must contain exactly one resource of type `cloud.konfidence.artifact.manifest`.
- `my-service-chart` references the deployable content that already exists in the OCI registry. Its access type must be `ociArtifact`, and `imageReference` must contain the full OCI path.

## Validate the artifact files

Validate the component constructor before you publish it:

```bash
kden artifact validate --files ./component-constructor.yaml
```

The command checks the OCM schema and the Konfidence-specific artifact requirements.
If validation succeeds, the command completes without output.
Fix any reported errors before you continue.

## Publish the artifact

Publish the component version to the OCI registry:

```bash
kden artifact push \
  --file ./component-constructor.yaml \
  --registry registry.example.com
```

The command validates the files, resolves the referenced OCI resources, calculates their digests, and writes the OCM component descriptor to the registry.
If the command completes without an error, the component version is available as:

```text
registry.example.com//github.com/my-org/my-service:1.0.0
```

You can use this component version in a `VectorTemplate`.

## Optional: Sign the artifact

Signing is optional and recommended for production environments.
Sign the component version before you create an alias:

```bash
kden artifact sign \
  registry.example.com//github.com/my-org/my-service:1.0.0 \
  --signer-spec ./signer-spec.yaml \
  --signature-name default
```

The command prints the signature as JSON and stores it with the component descriptor in the registry.
For signer configuration and verification steps, see [Configure signing and verification](./configure-signing-and-verification.md).

## Optional: Create an alias

Create an alias when you want a `VectorTemplate` to track a moving artifact version, such as the latest build from the main branch:

```bash
kden artifact alias \
  registry.example.com//github.com/my-org/my-service:1.0.0 \
  main
```

If the command completes without an error, it has created or updated the `main` alias.
The alias must not use semantic version format.
You can then use this reference in a `VectorTemplate`:

```text
registry.example.com//github.com/my-org/my-service:main
```

## Next steps

- [Build vectors](./observe-improve/build-vectors.md) from your published artifacts.
- Read [Vectors and artifacts](../core-concepts/vectors-and-artifacts.md) to understand how component versions and aliases become part of a vector.
- Check the [Kubernetes Deployer authoring rules](./deployers/kubernetes.md) for Helm and Kustomize packaging requirements.
- [Configure signing and verification](./configure-signing-and-verification.md) if your environment requires signed artifacts.
