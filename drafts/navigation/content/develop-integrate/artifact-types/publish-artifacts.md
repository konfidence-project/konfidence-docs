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

For background about artifacts, aliases, and [vectors](../../reference/glossary.md#vector), see [Artifacts and vectors](../../core-concepts/vectors-and-artifacts.md).

## Prerequisites

- The `kden` CLI is installed.
- You have the registry URL, [configured credentials](#configure-registry-credentials), and permission to push to the target OCI registry.
- The artifact's deployable content and OCM component constructor are prepared according to the requirements of its artifact type.

## Prepare the artifact files

The artifact needs a `manifest.json` file and an OCM component constructor. The manifest declares the artifact type and whether the artifact can be reused across vector deployments. The constructor connects that manifest to the deployable content.

Use the authoring guide for your format to prepare these files. The Kubernetes deployer provides guides for [Author a Helm artifact](./helm.md) and [Author a Kustomize artifact](./kustomize.md). Both produce the files used in the publishing steps below.

Set `allowReuse` according to [Choose whether vectors share one instance of your artifact](../../core-concepts/vectors-and-artifacts.md#choose-whether-vectors-share-one-instance-of-your-artifact). Runtime integration requirements belong to the selected deployer's guides.

The component version must follow semantic versioning, for example `1.0.0`. A published version is immutable. Use an [artifact alias](#optional-create-an-alias) when a moving name should select a newer version.

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
