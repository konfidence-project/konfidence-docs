---
title: Publish Artifacts
description: Learn how to publish and version your application artifacts using Konfidence and the Open Component Model.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Publish Artifacts

This guide walks you through publishing a deployable artifact using Konfidence and the Open Component Model (OCM).
The document shows how to create an OCM component constructor with a Konfidence manifest file, how to validate your artifact configuration and publish your artifact to an OCI registry.
You can also add a mutable alias for easy version tracking of artifacts.

## Prerequisites

- **kden CLI** - Install the Konfidence CLI tool (see [installation docs](../getting-started/quickstart.md))
- **OCI registry access** - An OCI-compliant registry (e.g., Docker Hub, Artifactory)
  - Registry URL and credentials for authentication
  - Push permissions for your repository path
- **Deployable content** - Need to be prepared and pushed to your registry:
  - For Helm: A Helm chart pushed as an OCI artifact
  - For Kustomize: A Kustomize bundle pushed as an OCI artifact
- **OCM knowledge** - Basic understanding of OCM component versions (see [OCM documentation](https://ocm.software/docs/getting-started/create-component-versions/))

## Artifact manifest

An artifact manifest is an [OCM](https://ocm.software/docs/getting-started/create-component-versions/) YAML file that
describes what your artifact contains and how it is accessed. It follows the standard OCM format and adds Konfidence-specific logic on top of it.

OCM declares one or more components, each with a `name`, `version`, `provider`, and `resources` values.
Typically `ociArtifact` references point to container images, Helm charts, or Kustomize bundles, already pushed to an `OCI registry`.
OCM resolves artifact references through standard OCI registries, which support both HTTP and HTTPS transports.
The registry URL in `imageReference` automatically determines the transport (e.g. `http://registry:5000` uses HTTP, `registry.example.com` uses HTTPS by default).

Konfidence requires that each deployable resource carries a `cloud.konfidence.artifact.manifest`
resource of input type `file/v1`, referencing a local manifest file that declares a `type` field (e.g. `cloud.konfidence.flux.kustomize` or `cloud.konfidence.flux.helm`),
which tells the [Kubernetes Deployer](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) how to handle the resource.

## Create the OCM Component Constructor

The OCM component constructor is a YAML file that describes your artifact and references the deployable content in your registry:

### Example

```yaml
components:
  - name: github.com/my-org/my-service
    version: 1.0.0
    provider:
      name: my-org
    resources:
      - name: my-service-manifest          # Required Konfidence-specific manifest
        type: cloud.konfidence.artifact.manifest
        version: 1.0.0
        relation: local
        input:
          type: file/v1
          path: ./manifest.json            # points to a manifest file as shown below in the Helm and Kustomize examples
      - name: my-service-chart             # Optional standard OCM resource
        type: helmChart
        version: 1.0.0
        relation: external
        access:
          type: ociArtifact
          imageReference: registry.example.com/my-org/my-service:1.0.0
```

Field definitions:
- name/version - Uniquely identifies the artifact
- First resource (`cloud.konfidence.artifact.manifest`) - Required by Konfidence to define how the artifact is deployed
- Second resource (`helmChart` or `kustomize`) - The actual deployable content from your registry
- `input.path `- Connects to the manifest file created in Step 2

Resources other than the manifest resource (e.g. `helmChart` or `kustomize`) referencing OCI artifacts must comply to the following criteria:
- Access type must be `ociArtifact`
- Image reference must be a fully qualified OCI image path (e.g. `registry.example.com/my-org/my-service:1.0.0`)

## Create the Konfidence Manifest File

A JSON file that tells Konfidence how to deploy this artifact and whether it can be reused across multiple deployments.
Create a file named `manifest.json` in the same directory as your component constructor:

### Example (Helm)

```json
{
"type": "cloud.konfidence.flux.helm",
"allowReuse": true
}
```

The `allowReuse` field indicates whether the artifact instance can be shared across multiple `VectorDeployments`.
When the value is set to `true`, Konfidence may deploy a single artifact instance to serve multiple vectors.
Otherwise, each `VectorDeployment` gets its own isolated artifact instance. Note that reuse requires the artifact to be independent of vector-specific runtime context.

For Kustomize deployments, use `type: cloud.konfidence.flux.kustomize` instead.

## Validate Your Configuration

Before publishing, validate that your component constructor conforms to OCM and Konfidence requirements:

```bash
  kden artifact validate --files ./component-constructor.yaml
```

This CLI command which enforces OCM schema validity first, and then Konfidence-specific constraints on manifest resources before push is attempted on a comma-separated list of artifact path files.

Expected output on success:
- Exit code: 0
- Console output: No output printed (silent - validation passed)
- Command completes without errors

## Publish Your Artifact

Publishing uploads your component descriptor to the OCI registry where it can be used in vectors:

```bash
  kden artifact push --file ./component-constructor.yaml  --registry registry.example.com
```

This CLI command  validates the manifest, resolves all ociArtifact resource references, computes their digests, and writes the OCM component descriptor to the registry.
A `component` is a versioned software unit (e.g. `github.com/my-org/my-service:1.2.3`). An artifact is an OCM component version which is stored in an OCI registry with OCM metadata.
Components use `Semantic versioning` (semver) which is a versioning scheme: MAJOR.MINOR.PATCH (e.g. 1.2.3).

Expected output on success:
- Exit code: 0
- Component available at registry path: `registry.example.com//github.com/my-org/my-service:1.0.0`
- Can be immediately used in `VectorTemplate`

## Sign Your Artifact (Optional)

Cryptographically signing your artifact verifies that it hasn't been tampered with. This step is optional but recommended for production scenarios:

```bash
kden artifact sign  registry.example.com//github.com/my-org/my-service:1.0.0  --signer-spec ./signer-spec.yaml  --signature-name default
```

This CLI command  creates an OCM signature that binds the component descriptor to a signing key, enabling verification of artifact's authenticity and integrity.

The command requires:
- A component reference (e.g. registry.example.com//github.com/my-org/my-service:1.2.3)
- A signer specification file (YAML with signing algorithm and encoding policy, default: RSA-PSS)
- A signature name (e.g. default) - multiple signatures can coexist on one component

The signature is stored in the OCM registry alongside the component descriptor. 
It is available for verification against a trusted public key. Signing is optional but recommended.

Expected output on success:
- Exit code: 0
- Signature printed to console in JSON format
- Signature persisted in registry
- Component has signature metadata

## Alias Your Artifact (Optional)

Aliases let your vectors reference a mutable tag instead of a specific version:

```bash
kden artifact alias  registry.example.com//github.com/my-org/my-service:1.0.0  main
```

This CLI command is used to create or update a mutable tag (e.g. `main`, `latest`, `edge`).
`VectorTemplate` allows your vector to reference the alias and automatically pick up the latest build from that branch without requiring a manual template change.
Alias a mutable tag to the signed version. Aliases must be non-semver strings.

Expected output on success:
- Exit code: 0
- Alias `main` created in registry
- `registry.example.com//github.com/my-org/my-service:main` now resolves to `1.0.0`
- Can be used immediately in `VectorTemplate`

For a detailed explanation on signing and aliasing, reference the [signing and verification doc](./configure-signing-and-verification.md)

## Deployer-specific authoring rules

The [Deployer](../reference/glossary.md#deployer) consuming your artifact
imposes conventions on how it must be packaged. See:

- [Kubernetes Deployer](./deployers/kubernetes.md) - supported manifest types
  (`cloud.konfidence.flux.kustomize`, `cloud.konfidence.flux.helm`), OCM
  content requirements, and templating rules for kustomize bundles and Helm
  charts.

## OCM Schema Constraints

1. Exactly one `cloud.konfidence.artifact.manifest` resource per component:
  - Enforced by JSON schema: `minContains: 1` and `maxContains: 1`
  - This means you MUST have one and only one manifest resource
  - Validation fails if you have zero or more than one manifest resource

2. Input type: `file/v1` or `File/v1`:
  - Enum constraint in schema: only these two values allowed
  - Other input types like `ociArtifact` are NOT valid for manifest resources

3. Input path: Must point to a valid manifest file on disk:
  - Path is relative to `component-constructor.yaml` location
  - File must contain valid JSON with `type` field
  - Valid JSON paths: `./manifest.json`, `./config/manifest.json`

See the [Konfidence artifact schema definition](https://github.com/konfidence-project/konfidence/blob/main/internal/kden/validation/resources/konfidence-artifact-schema.json)
and [schema implementation](https://github.com/konfidence-project/konfidence/blob/main/internal/kden/validation/schema/definition.go) for complete details.


### Deployment Handler Types

The manifest file's `type` field specifies how Konfidence deploys the artifact:

- `cloud.konfidence.flux.helm` - Deploy using Helm charts
- `cloud.konfidence.flux.kustomize` - Deploy using Kustomize bundles

### Other Resources in the Component

Resources other than the manifest resource (e.g., `helmChart` or `kustomize`) reference OCI artifacts:

- **Access type:** Must be `ociArtifact`
- **Image reference:** Fully qualified OCI image path
  - Example: `registry.example.com/my-org/my-service:1.0.0`
  - Must already exist in the registry before publishing
- **API Version:**
  - Current supported version: `konfidence.cloud/v1alpha1`
  - All examples in this guide use this version

## Terminology

In order to understand how the publishing of artifacts works, you must be familiar with some of the Konfidence terminology:
- `Vector immutability` in [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md) - vectors are complete,
immutable snapshots. Once a vector is created with a specific set of artifacts, it never changes - new changes create new vectors instead
- `Artifact deployment reuse` in [Kubernetes Deployer](./deployers/kubernetes.md) - The same artifact can be deployed across multiple `VectorDeployments`
or have an isolated instance (depending on the value of `allowReuse` field). Each instance uses `nameSuffix` (Kustomize) or `releaseName` (Helm) to uniquely scope each instance.
- Additional Konfidence terminology in [Glossary](../reference/glossary.md) - for stages, environments, and landscapes
  
## Next Steps

- For details on signing and verification, see [Configure signing and verification](./configure-signing-and-verification.md)
- To understand deployer-specific conventions, see [Kubernetes Deployer](./deployers/kubernetes.md)
- For more information on Konfidence concepts, see the [Glossary](../reference/glossary.md)