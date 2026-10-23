---
id: ADR-0039
title: "Static content deployer"
description: "Store static bundles in S3 and activate them through a stage document or serving-layer routing."
status: draft
authors: [christophbleyer]
category: Architecture Pattern
impact: Medium
dependencies: []
pageClass: adr
outline: deep
---

# ADR-0039: Static content deployer

<AdrHeader />

## Context

The static content deployer uploads bundles to S3 for an administrator-provided CDN or proxy to serve. Activation selects a vector's bundles either through a per-stage document or by updating the serving layer's routing configuration. Backend services can also fetch bundle files directly from S3.

## Artifact type

An artifact of type `static.konfidence.cloud/v1alpha1` contains one or more tar archives, each representing a bundle. Resource labels declare each bundle's optional public route:

```yaml
meta:
  schemaVersion: v2
component:
  name: common.konfidence.cloud/example/shop
  version: 1.2.0
  provider: example
  resources:
    - name: konfidence-manifest
      type: cloud.konfidence.artifact.manifest
      version: 1.2.0
      relation: local
      access:
        type: localBlob
        mediaType: application/json

    - name: storefront
      type: static.konfidence.cloud/v1alpha1
      version: 1.2.0
      relation: local
      labels:
        - name: static.konfidence.cloud/v1alpha1
          value:
            route: /
      access:
        type: localBlob
        mediaType: application/x-tar

    - name: widget
      type: static.konfidence.cloud/v1alpha1
      version: 1.2.0
      relation: local
      labels:
        - name: static.konfidence.cloud/v1alpha1
          value:
            route: /widget
      access:
        type: localBlob
        mediaType: application/x-tar
```

The `konfidence-manifest` payload is:

```json
{
  "type": "static.konfidence.cloud/v1alpha1",
  "allowReuse": true
}
```

## Deployment target

The target references a Secret containing the S3 endpoint, bucket, region, and credentials. Its optional `storagePathPrefix` defaults to an empty string; landscapes sharing a bucket need distinct prefixes.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: static-prod
  namespace: kden-l-prod-fz8g86s6
spec:
  artifactType: static.konfidence.cloud/v1alpha1
  parameters:
    storagePathPrefix: prod-landscape/
    credentialRef:
      name: static-prod-s3-creds
```

## Serving integration (CDN)

The administrator provides the CDN setup and Job templates for activation and cleanup, including an image, credentials, and provider settings. Konfidence supplies the stage, vector identity, and vector data.

Edge code or routing rules select the vector before CDN cache lookup. The deployment target's configuration references the Job templates; the exact configuration format remains open.

## Lifecycle

### Deployment

The deployer extracts the bundles under `<storagePathPrefix>_k/<ArtifactDeployment name>/` and publishes one deployment result per bundle:

```json
[
  {
    "name": "storefront",
    "type": "static.konfidence.cloud/v1alpha1",
    "spec": {
      "assetBase": "/shop-1.2.0-k3h9d7bq2f/storefront/",
      "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/storefront/",
      "route": "/"
    }
  },
  {
    "name": "widget",
    "type": "static.konfidence.cloud/v1alpha1",
    "spec": {
      "assetBase": "/shop-1.2.0-k3h9d7bq2f/widget/",
      "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/widget/",
      "route": "/widget"
    }
  }
]
```

- `route` is the optional public mount path, selected by longest-prefix matching. Bundles without a route are accessible through `s3Url`.
- `assetBase` is the bundle's path relative to `<storagePathPrefix>_k/`, with the leading slash denoting that content root.
- `s3Url` is the absolute S3 URL prefix to which a consumer appends a file path, using its own credentials if the bucket is private.

For example, `/widget/logo.svg` resolves to `logo.svg` under the widget bundle's `assetBase`. Directory indexes, trailing-slash redirects, and SPA fallbacks belong to the serving configuration.

### Vector preparation

The static deployer reports `ArtifactDeployment.Ready` after uploading the bundles and publishing their results. It marks each `VectorAssignment` ready once the referenced static deployment is ready. Materializing the vector data satisfies `VectorData.Ready`, allowing migration and activation to proceed.

```text
VectorDeployment
  → ArtifactDeployment: upload bundles and report results
  → VectorAssignment: acknowledge the vector's use of the bundles
  → VectorData: prepare the vector data for serving
  → VectorMigration
  → VectorActivation
      → ActivationTaskExecution
          → TaskExecution
              → Kubernetes Job: switch the stage default
```

### Undeployment

The `ArtifactDeployment` finalizer deletes all objects under that deployment's prefix. Retained vectors remain referenced through `StageVersionUsage`, including during the serving integration's cleanup period after activation. A cleanup task removes their serving configuration before those usages are released. Shared artifact files remain until no vector needs them.

### Activation

Activation uses the selected vector's `features`, `authored` data, and deployment results of type `static.konfidence.cloud/v1alpha1`.

#### Activation task integration

The static deployer's `ActivationTaskRegistration` supplies the activation Job configuration. For each `ActivationTaskExecution`, its controller reads the stage and vector data through the linked `VectorActivation` and creates a `TaskExecution` of type `k8s-job`.

The Job prepares the serving configuration, switches the stage default, and waits for the integration's completion condition. The controller reports its result through `ActivationTaskExecution`. Once all activation tasks succeed, Konfidence updates the active `StageVersionUsage`.

Implementation requires connecting `ActivationTaskExecution` to `TaskExecution` and making KLO's `k8s-job` executor available to the static deployer.

#### Option 1: Read a stage document

Activation replaces `<storagePathPrefix>stages/<stage>/_active` with the selected vector's data. An edge handler reads this document to resolve requests. Its refresh policy determines when it observes activation.

```json
{
  "features": {},
  "authored": {},
  "deploymentResults": {
    "common.konfidence.cloud/example/shop": [
      {
        "name": "storefront",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/shop-1.2.0-k3h9d7bq2f/storefront/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/storefront/",
          "route": "/"
        }
      },
      {
        "name": "widget",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/shop-1.2.0-k3h9d7bq2f/widget/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/widget/",
          "route": "/widget"
        }
      }
    ]
  }
}
```

#### Option 2: Switch CDN routes

The CDN's routing configuration determines which vector a stage serves. The activation Job updates it to select the new vector's bundles and vector-data endpoint. An edge handler or native routing rules apply that selection.

Rollback runs activation again to select a retained vector.

#### Activation consistency

Activation switches the bundles and vector-data endpoint together. The change becomes visible as the stage document refreshes or CDN configuration propagates.

### Vector affinity

Either option can support explicit vector selection through `x-konfidence-routing-key`.

| Request | Selection within the stage |
| --- | --- |
| No routing key | The active vector |
| Key identifies a retained vector | That vector |
| Unknown or retired key | An error |

Option 1 maps retained routing keys to their vector data. Option 2 keeps routes for retained vectors alongside the stage default.

Browser affinity could use cookies. Backend routing must also honor the selected vector for end-to-end affinity.

### Serving and caching

The serving layer maps the request to a stage and selects a vector before looking up cached content. The selected vector determines the bundle route and the data returned by `/k_vector`. CDN cache entries use version-specific object paths or an equivalent cache key.

Mutable public URLs need browser revalidation; versioned URLs can use long-lived caching.

## Bucket layout

Bundle storage is shared by both options. The `stages/` objects below belong to option 1; option 2 keeps the default selection in the serving layer's routing configuration.

```text
prod-landscape/                         # storagePathPrefix
├── _k/
│   └── shop-1.2.0-k3h9d7bq2f/          # ArtifactDeployment name
│       ├── storefront/
│       │   ├── index.html
│       │   └── assets/
│       │       └── ...
│       └── widget/
│           ├── widget.html
│           └── assets/
│               └── ...
└── stages/
    ├── production/
    │   └── _active
    └── staging/
        └── _active
```

## Examples

Both examples activate `vector-b` for `production`.

### Activation resources

The task type `static-serving` and its `jobTemplate` field are illustrative:

```yaml
kind: ActivationTaskRegistration
metadata:
  name: static-serving
  # ...
spec:
  type: static-serving
  spec:
    jobTemplate: # Kubernetes JobSpec
      template:
        spec:
          containers:
            - name: activate
              image: registry.example.com/platform/activate-static-document:1
              # ... provider settings and credentials
          # ...
```

For an `ActivationTaskExecution` linked to `VectorActivation/production-42`, the controller creates a task with the activation identity, stage, vector identity, and vector data as inputs:

```yaml
kind: TaskExecution
metadata:
  name: static-serving-42
  # ...
spec:
  name: static-serving-42
  type: k8s-job
  spec: # Kubernetes JobSpec
    template:
      spec:
        containers:
          - name: activate
            image: registry.example.com/platform/activate-static-document:1
            # ... inputs for production, vector-b, and its vector data
        # ... other Job settings from the template
```

### Cloudflare Worker reading vector data

The administrator installs a Worker for `shop.example.com` that resolves paths from vector data in S3. The image `activate-static-document:1` replaces the stage's `_active` document.

```text
Preparation: publish immutable vector data
Activation:  replace production/_active
Request:     Worker selects vector → resolves object → cache lookup
```

For `/widget/logo.svg`, the Worker looks up the widget bundle's version-specific S3 URL in the cache and fetches from S3 on a miss.

### CloudFront routing tables

The administrator installs a viewer-request CloudFront Function backed by a KeyValueStore. The image `activate-static-cloudfront:1` prepares the vector's routing entry and updates the stage default.

```text
Preparation: publish vector data and prepare routing entries
Activation:  update production/default in KeyValueStore
Request:     Function selects vector → rewrites URI → cache lookup
```

Example routing entries, with JSON values shown expanded:

```yaml
production/default: vector-b
production/vector-b:
  routes:
    /: /prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/storefront/
    /widget: /prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/widget/
  vectorData: /prod-landscape/stages/production/vectors/vector-b.json
```

The Job writes these entries together using `UpdateKeys`. With one preconfigured S3 origin and cache behavior, the Function rewrites `/widget/logo.svg` to the bundle's object path and `/k_vector` to its vector-data path. The rewritten paths determine the cache keys.

## Discussion points

- Should the first implementation support both activation options, or start with one?
- Where should vector-data preparation live for static-only and mixed-runtime landscapes, and how should the reusable Job executor be packaged?
- What browser and backend affinity should a later iteration provide?

## Relevant sources

- [ADR-0012: Activation controller](./adr-0012-activation-controller.md)
- [Activation task registration API](https://github.com/konfidence-project/konfidence/blob/main/api/v1alpha1/activationtaskregistration_types.go)
- [Activation task execution creation](https://github.com/konfidence-project/konfidence/blob/main/internal/vectoractivation/internal/activation/execution.go)
- [CloudFront request processing and edge triggers](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-cloudfront-trigger-events.html)
- [CloudFront KeyValueStore updates](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/kvs-with-functions-kvp.html)
- [CloudFront Function request rewrites](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/functions-event-structure.html#functions-event-structure-request)
- [Cloudflare Workers caching](https://developers.cloudflare.com/workers/reference/how-the-cache-works/)
