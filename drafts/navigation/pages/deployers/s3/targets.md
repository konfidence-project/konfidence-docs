---
title: "S3 target configuration"
scope: "S3 · In development"
editLink: false
lastUpdated: false
---
# S3 target configuration

Choose the bucket and endpoint for static content. S3 support is in development. The accepted design uses the same artifact format across S3-compatible providers and configures their credentials on the target.

## Shared target, deployer-owned settings

The shared `DeploymentTarget` selects `s3.konfidence.cloud`. Its `parameters` reference a deployer-owned `S3DeploymentConfig` by API group, kind, and name. The configuration and referenced Secrets live in the target's landscape namespace.

| Setting | Purpose |
| --- | --- |
| Bucket | Destination for deployed static files. |
| Region | Signing region; validation requires it when SDK configuration does not supply one. |
| Endpoint and path style | Connection settings for S3-compatible services. |
| Storage path prefix | Separates landscapes that share one bucket. |
| Credentials | Access to source content and destination storage. |

See the [shared custom resource reference](../../reference/crd.md#deploymenttarget) for `DeploymentTarget` fields. The S3 design reference below defines the additional `S3DeploymentConfig` fields.

## Storage and serving are separate

A writable bucket supplies storage. Your CDN, proxy, or reverse proxy provides the public serving path. An activation Job connects stage changes to that serving setup. Uploading files alone does not establish a public endpoint.

## Reference and next step

[Configure the S3 target](../../community/decisions/adr-0042-static-cdn-deployer.md#configure-the-s3-target) contains the design's exact fields, credential precedence, and examples. Review [Deployment and activation](./runtime.md) before selecting a serving integration.
