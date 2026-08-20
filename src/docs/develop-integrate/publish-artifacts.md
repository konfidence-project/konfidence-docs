---
title: Publish Artifacts
description: Learn how to publish and version your application artifacts using Konfidence and the Open Component Model.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Publish Artifacts

## Artifact manifest

An artifact manifest is an [OCM](https://ocm.software/docs/getting-started/create-component-versions/) YAML file that
describes what your artifact contains and how it is accessed. It follows the standard OCM format and adds Konfidence-specific logic on top of it.

OCM declares one or more components, each with a `name`, `version`, `provider`, and `resources` values.
Typically `ociArtifact` references point to container images, Helm charts, or Kustomize bundles, already pushed to an `OCI registry`.
OCM resolves artifact references through standard OCI registries, which support both HTTP and HTTPS transports.
The registry URL in `imageReference` automatically determines the transport (e.g. `http://registry:5000` uses HTTP, `registry.example.com` uses HTTPS by default).

Konfidence requires that each deployable resource carries a `cloud.konfidence.artifact.manifest`
resource of input type `file/v1`, referencing a local manifest file that declares a `type` field (e.g.
`cloud.konfidence.flux.kustomize` or `cloud.konfidence.flux.helm`),
which tells the [Kubernetes Deployer](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) how to handle the resource.

Hence, there are two files per artifact:

1. The OCM component constructor

The standard format + the Konfidence constraints defined by the [schema](https://github.com/konfidence-project/konfidence/blob/main/internal/kden/validation/resources/konfidence-artifact-schema.json)
(e.g. one resource with type: `cloud.konfidence.artifact.manifest` per component, enforced by the `minContains: 1`, `maxContains: 1` conditions).
The artifact manifest must conform to the Konfidence CRD schema. The current supported API version is
`konfidence.cloud/v1alpha1`. All examples in this guide use this version. See the [ArtifactDeployment CRD schema](https://github.com/konfidence-project/konfidence/blob/main/api/v1alpha1/artifactdeployment_types.go) for the complete specification.
The resource must have an `input.type: file/v1` (or `File/v1`) and an `input.path` pointing to the manifest file on disk. Other resources in the same component (such as `helmChart` or `kustomize`) use `access.type: ociArtifact` to reference OCI artifacts.

### Example 1

```yaml
  components:
    - name: github.com/my-org/my-service
      version: v1.0.0
      provider:
        name: my-org
      resources:
        - name: my-service-manifest          # Required Konfidence-specific manifest
          type: cloud.konfidence.artifact.manifest
          input:
            type: file/v1
            path: ./manifest.json            # points to a manifest file as shown below in the Helm and Kustomize examples
        - name: my-service-chart             # Optional standard OCM resource
          type: helmChart
          version: v1.0.0
          relation: external
          access:
            type: ociArtifact
            imageReference: registry.example.com/my-org/my-service:v1.0.0
```
### Example 2

```yaml
components:
  - name: github.com/konfidence-project/sample-service-1
    version: 0.0.1
    provider:
      name: konfidence-project
    sources: []
    resources:
      - name: konfidence-manifest
        version: 0.0.1
        relation: local
        type: cloud.konfidence.artifact.manifest
        input:
          type: file/v1
          path: internal/validation/resources/sample-service-1-manifest.json
```

2. The manifest file

A JSON file with a `type` which allows for reuse. The `allowReuse` field indicates whether the artifact instance can be shared across multiple `VectorDeployments`.
When the value is set to `true`, Konfidence may deploy a single artifact instance to serve multiple vectors.
Otherwise, each `VectorDeployment` gets its own isolated artifact instance. Note that reuse requires the artifact to be independent of vector-specific runtime context.

### Example 1 (Helm)

```json
{
"type": "cloud.konfidence.flux.helm",
"allowReuse": true // for Shared instance
}
```

### Example 2 (Kustomize)


```json
{
"type": "cloud.konfidence.flux.kustomize",
"allowReuse": false // for Isolated instance
}
```

The `kden artifact validate --files <artifact-path-1.yml>,<artifact-path-2.yml>` CLI command which enforces OCM schema validity first,
and then Konfidence-specific constraints on manifest resources before push is attempted on a comma-separated list of artifact path files.

## Create artifact

The `kden artifact push --file <artifact-path.yml> --registry <ocm-registry>` CLI command is used to publish your component constructor to an OCI registry.
The command validates the manifest, resolves all ociArtifact resource references, computes their digests, and writes the OCM component descriptor to the registry.
A `component` is a versioned software unit (e.g. `github.com/my-org/my-service:v1.2.3`). An artifact is an OCM component version which is stored in an OCI registry with OCM metadata.
Components use `Semantic versioning` (semver) which is a versioning scheme: MAJOR.MINOR.PATCH (e.g. 1.2.3).

The `kden artifact sign <component-ref> --signer-spec <path> --signature-name <name> `CLI command is used to cryptographically sign a component version
after it's been pushed to the registry. Signing creates an OCM signature that binds the component descriptor to a signing key, enabling verification of artifact
authenticity and integrity.

The command requires:
- A component reference (e.g. registry.example.com//github.com/my-org/my-service:v1.2.3)
- A signer specification file (YAML with signing algorithm and encoding policy, default: RSA-PSS)
- A signature name (e.g. default) - multiple signatures can coexist on one component

The signature is stored in the OCM registry alongside the component descriptor. 
It is available for verification against a trusted public key. Signing is optional but recommended.

The `kden artifact alias <source-ref> <alias-name>` CLI command is used to create or update a mutable tag (e.g. `main`, `latest`, `edge`) that points to a specific
component version. `VectorTemplate` allows your vector to reference the alias and automatically pick up the latest build from that branch without requiring a manual template change.
Alias a mutable tag to the signed version. Aliases must be non-semver strings.

For a detailed explanation on signing and aliasing, reference the [signing and verification doc](./configure-signing-and-verification.md)

## Deployer-specific authoring rules

The [Deployer](../reference/glossary.md#deployer) consuming your artifact
imposes conventions on how it must be packaged. See:

- [Kubernetes Deployer](./deployers/kubernetes.md) - supported manifest types
  (`cloud.konfidence.flux.kustomize`, `cloud.konfidence.flux.helm`), OCM
  content requirements, and templating rules for kustomize bundles and Helm
  charts.

## Terminology

In order to understand how the publishing of artifacts works, you must be familiar with some of the Konfidence terminology:
- `Vector immutability` in [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md) - vectors are complete,
immutable snapshots. Once a vector is created with a specific set of artifacts, it never changes - new changes create new vectors instead
- `Artifact deployment reuse` in [Kubernetes Deployer](./deployers/kubernetes.md) - The same artifact can be deployed across multiple `VectorDeployments`
or have an isolated instance (depending on the value of `allowReuse` field). Each instance uses `nameSuffix` (Kustomize) or `releaseName` (Helm) to uniquely scope each instance.
- Additional Konfidence terminology in [Glossary](../reference/glossary.md) - for stages, environments, and landscapes