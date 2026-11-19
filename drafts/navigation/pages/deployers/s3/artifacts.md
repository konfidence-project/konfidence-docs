---
title: "S3 artifact format"
scope: "S3 · In development"
editLink: false
lastUpdated: false
---
# S3 artifact format

Understand the artifact contract in the accepted S3 deployer design before preparing static content. The deployer and its complete publishing workflow are still in development.

## Package static files

The artifact manifest declares `s3.konfidence.cloud`. Static content resources contain tar archives, optionally compressed with gzip. One artifact can contain multiple static resources.

OCM directory and file inputs can package the content alongside the component descriptor. Each resource can declare an optional public route through its labels. The archive's root maps to that resource's directory in the destination bucket.

## Keep packaging separate from publishing

The S3 contract determines the resource payload and labels. Konfidence's artifact model supplies the versioned OCM component and its manifest. After artifacts have been published, [vector assembly](../../core/build-vectors.md) records their concrete versions as it does for other artifact types.

The current [publishing guide](../../core/publish-artifacts.md) documents the established OCI workflow. Static resources use the S3 artifact contract described below. A validated S3 publishing tutorial is not yet available.

## Reference and next step

See [Static resources with optional routes](../../community/decisions/adr-0042-static-cdn-deployer.md#static-resources-with-optional-routes) for the exact proposed resource types, labels, and constructors. Then review [S3 target configuration](./targets.md).
