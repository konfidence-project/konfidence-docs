---
id: ADR-0039
title: "Static content deployer"
description: "Upload static content to object storage and activate it by advancing a per-stage pointer."
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

This deployer takes a static-content artifact and writes it to S3, then advances a per-stage pointer that tells which version is live. It conforms to the deployer specification.

The scope is deliberately narrow. The deployer owns the write path: what lands in the bucket, under which keys, and how a stage switch becomes a single pointer write. It does not run a CDN and makes no assumptions about one. The storage layout is the contract, and the deployment results it publishes carry enough for two kinds of reader to consume that layout: a CDN or proxy that routes public requests to a bundle, and a backend service that fetches a bundle's files straight from S3. How either reader is wired up is out of scope here. The ADR documents the layout and the fields, and shows how a CDN Edge Worker could use them, but a serving layer is not part of what this deployer builds.

## Artifact Type

The deployer introduces a new artifact type called `static.konfidence.cloud/v1alpha1`.

### Format

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
            entrypoint: index.html
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
            entrypoint: widget.html
      access:
        type: localBlob
        mediaType: application/x-tar
```

The `konfidence-manifest` resource — mandatory, exactly one per artifact, and named `konfidence-manifest` per the deployer specification — holds a JSON blob declaring the full, versioned artifact type:

```json
{
  "type": "static.konfidence.cloud/v1alpha1",
  "allowReuse": true
}
```

## Deployment Target

The administrator declares *where* files go via one `DeploymentTarget` in the landscape namespace. The S3 connection (endpoint, bucket, region, keys) lives in a referenced Secret; `parameters` only adds a `storagePathPrefix` which defines the file system root under which the deployer stores the data.

The `storagePathPrefix` is optional and defaults to the S3 root key but is needed when an S3 bucket is shared by multiple landscapes.

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
status:
  controller: konfidence.cloud/static-content-deployer:v0.1.0
  conditions:
    - type: Ready
      status: "True"
      reason: Accepted
```

## Lifecycle

### Deployment

When a new ArtifactDeployment is created the deployer downloads the static contents from the OCI registry and uploads the data to the configured S3 bucket under a key named after the ArtifactDeployment`s name.

The deployment results look like this — one entry per servable bundle, each unique by `(name, type)` and pointing at a subpath of the ArtifactDeployment's content folder:

```json
[
  {
    "name": "storefront",
    "type": "static.konfidence.cloud/v1alpha1",
    "spec": {
      "assetBase": "/shop-1.2.0-k3h9d7bq2f/storefront/",
      "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/storefront/",
      "route": "/",
      "entrypoint": "index.html"
    }
  },
  {
    "name": "widget",
    "type": "static.konfidence.cloud/v1alpha1",
    "spec": {
      "assetBase": "/shop-1.2.0-k3h9d7bq2f/widget/",
      "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/widget/",
      "route": "/widget",
      "entrypoint": "widget.html"
    }
  }
]
```

Each result's `spec` tells the serving layer (a CDN or equivalent) how to route requests to stored content:

- **`route`** _(optional)_ — the public route the bundle is mounted at in a CDN or other serving layer. The server maps an incoming request path to the result whose `route` is the longest matching prefix (so `/widget` wins over `/` for `/widget/...`). When unset, the bundle has no route and is not reachable through the CDN — only via its `s3Url`.
- **`assetBase`** — the storage location the matched route resolves to, relative to the content root. A CDN rewrites the request path under this base to find the file.
- **`s3Url`** — the fully qualified S3 URL of the same bundle (`storagePathPrefix` and `_k/` included), e.g. `https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/…`. `s3Url` is the absolute location a consumer can fetch directly — e.g. a server-side renderer or image processing service.
- **`entrypoint`** _(optional)_ — the file served when the request matches the route exactly (hits the mount point itself), e.g. a request to `/widget` serves `widget.html` from that bundle's `assetBase`. When unset, an exact route match resolves to the stored file at `assetBase` (e.g. `assetBase/index.html` by web-server convention) and 404s if none exists.

Resolution could be file-first for anything below the mount point: once longest-prefix match picks a route, the CDN rewrites the remaining request path under that route's `assetBase` and, **if a real file exists there, serves it directly** — so `/widget/logo.svg` resolves to `assetBase/logo.svg`. The `entrypoint` applies only to the exact route match (`/widget`), not to sub-paths that hit real files.

### Undeployment

Deletion of an ArtifactDeployment is handled by a finalizer: the deployer will remove the folder from the S3 storage. Future implementations may add the option to keep the data for a grace period in case older data should be served for longer.

### Activation

On Activation the deployer writes to a file named after the stage where the vector is activated called `stages/<stage>/_active`. The `_active` file contains the VectorData.

```json
{
  "features": { ... },
  "authored": { ... },
  "deploymentResults": {
    "common.konfidence.cloud/example/shop": [
      {
        "name": "storefront",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/shop-1.2.0-k3h9d7bq2f/storefront/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/storefront/",
          "route": "/",
          "entrypoint": "index.html"
        }
      },
      {
        "name": "widget",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/shop-1.2.0-k3h9d7bq2f/widget/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/shop-1.2.0-k3h9d7bq2f/widget/",
          "route": "/widget",
          "entrypoint": "widget.html"
        }
      }
    ],
    "common.konfidence.cloud/example/admin": [
      {
        "name": "admin",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/admin-0.9.1-m8p2w5xz4c/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/admin-0.9.1-m8p2w5xz4c/",
          "route": "/admin",
          "entrypoint": "index.html"
        }
      }
    ],
    "common.konfidence.cloud/example/checkout": [
      {
        "name": "checkout",
        "type": "static.konfidence.cloud/v1alpha1",
        "spec": {
          "assetBase": "/checkout-0.9.1-q7r4n1vt8d/",
          "s3Url": "https://static-assets.s3.eu-central-1.amazonaws.com/prod-landscape/_k/checkout-0.9.1-q7r4n1vt8d/",
          "route": "/checkout",
          "entrypoint": "index.html"
        }
      }
    ]
  }
}
```

::: info Published subset
The deployer publishes only part of the VectorData. It keeps the `deploymentResults` whose `type` is `static.konfidence.cloud/v1alpha1` and drops the rest, so runtime wiring that e.g. belongs to an internal cluster — a K8s service setup, say — never lands in a document the browser can read.
:::

We expect the CDN to map public DNS names to stages, one hostname per stage (`shop.example.com` to `production`, `staging.shop.example.com` to `staging`). That mapping is the edge worker's input: it resolves the incoming `Host` header to a stage, then reads that stage's keys. Nothing in the stored layout encodes the hostname, so the worker needs the host-to-stage table configured out of band.

The `_active` key moves on every activation, so a UI cannot hardcode it. A CDN edge worker closes that gap: for the resolved stage, map a stable route such as `/k_vector` to `stages/<stage>/_active` and serve its contents. The UI then reads its feature flags and serving config from one fixed URL, and a stage switch becomes visible the moment the pointer write lands, with no client change and nothing to redeploy.

## Bucket layout

Everything the deployer writes lives under `storagePathPrefix` (here `prod-landscape/`), so one bucket can host many landscapes. Two kinds of entries sit side by side:

- **Content folders** — one per ArtifactDeployment, named after it. A single ArtifactDeployment may ship several servable bundles, so it emits one deployment result per bundle, each `assetBase` pointing at a subpath of its content folder. Written on Deployment, removed by the finalizer on Undeployment.
- **Stage pointers** — one `stages/<stage>/_active` file per stage, holding the VectorData of the currently activated vector. Overwritten on each Activation.

```text
prod-landscape/                         # storagePathPrefix
├── _k/                                 # content folders, keyed by ArtifactDeployment name
│   ├── shop-1.2.0-k3h9d7bq2f/          # one ArtifactDeployment, two results
│   │   ├── storefront/                 # assetBase for result "storefront"
│   │   │   ├── index.html
│   │   │   └── assets/
│   │   │       └── ...
│   │   └── widget/                     # assetBase for result "widget"
│   │       ├── widget.html
│   │       └── assets/
│   │           └── ...
│   ├── admin-0.9.1-m8p2w5xz4c/         # assetBase for result "admin"
│   │   ├── index.html
│   │   └── assets/
│   │       └── ...
│   └── checkout-0.9.1-q7r4n1vt8d/      # assetBase for result "checkout"
│       ├── index.html
│       └── assets/
│           └── ...
└── stages/
    ├── production/                     # one stage
    │   └── _active                     # VectorData of the activated vector
    └── staging/                        # another stage
        └── _active
```
