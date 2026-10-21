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

This guide explains how to publish a deployable [artifact](../../reference/glossary.md#artifact) as an Open Component Model (OCM) component version to an Open Container Initiative (OCI) registry.
After you publish it, you can reference the component version or an alias in a [`VectorTemplate`](../../reference/glossary.md#vectortemplate).

For background about artifacts, aliases, and [vectors](../../reference/glossary.md#vector), see [Vectors and artifacts](../../core-concepts/vectors-and-artifacts.md).

## Prerequisites

Before you begin, make sure you meet these requirements:

- The `kden` CLI is installed.
- You have the registry URL, [configured credentials](#configure-registry-credentials), and permission to push to the target OCI registry.
- Your deployable content is already available in an OCI registry. For example:
  - A Helm chart published as an OCI artifact.
  - A Kustomize bundle published as an OCI artifact.
- Your deployable content follows the requirements in [Author a Helm artifact](./helm.md) or [Author a Kustomize artifact](./kustomize.md).

## Create the Konfidence manifest file

Create a file named `manifest.json`.
It tells Konfidence how to deploy the artifact and whether an artifact instance can be reused across deployments.

For a Helm chart, add:

```json
{
  "type": "helm.konfidence.cloud",
  "allowReuse": true
}
```

For a Kustomize bundle, use `kustomize.konfidence.cloud` as the `type` value.

Set `allowReuse` based on how the artifact should be deployed:

- Set it to `true` only when one running artifact instance can safely serve multiple [`VectorDeployment`](../../reference/glossary.md#vectordeployment) resources at the same time.
- Set it to `false` when each `VectorDeployment` needs its own artifact instance.

Reuse does not require an artifact to be independent of vector-specific runtime context. A reusable service can read `X-Vector-ID` and use data for the current vector. It must handle the context separately for each request, forward the header on outbound calls, and isolate vector-specific state and cached data by vector ID. Set `allowReuse` to `false` if the service keeps one vector's configuration or state as a process-wide value.
For more information, see [Choose whether vectors share one instance of your artifact](./index.md#choose-whether-vectors-share-one-instance-of-your-artifact).

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
          imageReference: registry.example.com/my-org/charts/my-service:1.0.0
```

The component constructor contains two resources:

- `my-service-manifest` connects the component to `manifest.json` through `input.path`. Each component must contain exactly one resource of type `cloud.konfidence.artifact.manifest`.
- `my-service-chart` references the deployable content that already exists in the OCI registry. Its access type must be `ociArtifact`, and `imageReference` must contain the full OCI path.

The `version` field must follow [semantic versioning](https://semver.org/) (for example `1.0.0`). Each published version is immutable: `kden artifact push` does not overwrite a component version that already exists in the registry. To keep a stable tag that points to the newest version, such as the latest build from a branch, [create an alias](#optional-create-an-alias) after publishing. An alias is a mutable, non-semantic-version tag that points to a specific component version.

## Validate the artifact files

Validate the component constructor before you publish it:

```bash
kden artifact validate --files ./component-constructor.yaml
```

The command checks the constructor against the OCM schema, then applies
Konfidence-specific requirements:

- Each component must contain exactly one resource of type `cloud.konfidence.artifact.manifest`.
- The resource's `input.type` must be `file/v1` or `File/v1`.
- The file at `input.path` must exist and contain a non-empty `type` field.

If validation succeeds, the command completes without output.
Fix any reported errors before you continue.

## Configure registry credentials

`kden artifact push` uses the OCM credential chain to authenticate with the target
registry. Configure your credentials in `~/.ocmconfig` before running `kden artifact push`:

```yaml
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software/v1
    consumers:
      - identities:
          - type: OCIRegistry
            hostname: registry.example.com
        credentials:
          - type: Credentials/v1
            properties:
              username: my-username
              password: <token-or-password>
```

If you also need to configure signing keys alongside registry credentials, see
[Configure signing and verification](../advanced-features/configure-signing-and-verification.md).

## Publish the artifact

Use `kden artifact push` to publish the component version to the OCI registry. Specify the component constructor with `--file` and the target registry with `--registry`:

```bash
kden artifact push \
  --file ./component-constructor.yaml \
  --registry registry.example.com
```

Before making any request to the registry, the command performs the same validation as
`kden artifact validate`. It then resolves the referenced OCI resources, calculates
their digests, and writes the OCM component descriptor to the registry.

If validation fails, the command stops immediately and makes no request to the registry.

If the command completes without an error, the component version is available as:

```text
<registry>//<component-name>:<version>
```

For example:

```text
registry.example.com//github.com/my-org/my-service:1.0.0
```

You can use this component version in a `VectorTemplate`.

`kden artifact push` never overwrites a published version. If the component version already exists in the registry, the push fails.
Bump the `version` field in the constructor and push again to publish a new version.

The command produces no output on success. An exit code of `0` confirms that the push succeeded. Any error stops the command and prints the problem to the output.

To see detailed progress or diagnose a failure, raise the log level to `debug`:

```bash
kden artifact push \
  --file ./component-constructor.yaml \
  --registry registry.example.com \
  --log-level debug
```

Two flags control logging:

- `--log-level` accepts `info` (default), `debug`, and `error`.
- `--log-format` accepts `pretty` (default), `json`, and `text`.

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
For signer configuration and verification steps, see [Configure signing and verification](../advanced-features/configure-signing-and-verification.md).

## Optional: Create an alias

Create an alias when you want a `VectorTemplate` to track a moving artifact version, such as the latest build from the main branch:

```bash
kden artifact alias \
  registry.example.com//github.com/my-org/my-service:1.0.0 \
  main
```

If the command completes without an error, it has created or updated the `main` alias.

The alias must follow these rules:
- It must not be in semantic version format.
- It must be a valid OCI tag: starts with a letter or digit, contains only letters,
  digits, `.`, `_`, or `-`, and is at most 128 characters long.
- The source component version must already exist in the registry.

You can then use this reference in a `VectorTemplate`:

```text
registry.example.com//github.com/my-org/my-service:main
```

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Push fails with `required flag(s) "file", "registry" not set` | `--file` or `--registry` was omitted | Pass both flags. See [Publish the artifact](#publish-the-artifact) |
| Push fails with `already exists in target repository` | A component with the same name and version was already pushed | Increment the `version` field in the constructor and push again |
| Push or validation fails with `failed to unmarshall constructor` | The constructor file is not valid YAML | Fix the YAML syntax in `component-constructor.yaml` |
| Validation fails with `failed to read file` | The file at `input.path` was not found | Run the command from the same directory as the constructor, or use an absolute path in `input.path` |
| Push fails with a 401 or 403 error | Credentials are missing or do not have write access | Check the `hostname` and credentials in your `.ocmconfig` |
| Push fails with `failed to parse repository` | The `--registry` value is malformed, for example it contains uppercase letters | Use a valid, lowercase `--registry` value |

Add `--log-level=debug` to any failing command for more detailed output.

## Next steps

Use the following guides to build vectors and review related artifact requirements:

- [Build vectors](../observe-improve/build-vectors.md) from your published artifacts.
- Read [Vectors and artifacts](../../core-concepts/vectors-and-artifacts.md) to understand how component versions and aliases become part of a vector.
- Check [Author a Helm artifact](./helm.md) or [Author a Kustomize artifact](./kustomize.md) for packaging requirements.
- [Configure signing and verification](../advanced-features/configure-signing-and-verification.md) if your environment requires signed artifacts.
