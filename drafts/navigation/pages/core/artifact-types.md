---
title: "Types of artifacts"
scope: "Konfidence core"
editLink: false
lastUpdated: false
description: "Choose an artifact type and understand when vectors can share a deployed artifact."
outline: deep
---
# Types of artifacts

Choose how to package your service for Konfidence and whether several vectors can share one deployed instance.
For the relationship between artifacts and application versions, see [Vectors and artifacts](./artifacts-and-vectors.md).

## Choose an artifact type

An artifact's manifest declares the packaging and deployment contract through `type`. The responsible deployer defines the payload format. Choose the [deployer](../deployers/index.md) for your target platform, then use its packaging documentation.

- [Kubernetes artifact types](../deployers/kubernetes/artifact-types.md#choose-an-artifact-type) covers Helm and Kustomize.
- [S3 artifact design](../deployers/s3/artifacts.md) describes the static content deployer under development.

Before deploying, the landscape needs one ready [deployment target](./deployment-targets.md) for every artifact type in the vector.

## Choose whether vectors share one instance of your artifact

The manifest field `allowReuse` controls whether vectors in the same landscape share a deployed instance of an artifact.
Set it explicitly in `manifest.json` when authoring your artifact.

### How reuse works

Suppose vectors A and B both reference `my-service` version `1.0.0` in the same landscape.
The setting determines whether Konfidence creates separate instances or shares one:

| Setting | Result |
| --- | --- |
| `allowReuse: false` | Two instances: one for vector A and one for vector B. |
| `allowReuse: true` | One instance shared by vectors A and B. |

Here, an instance means a deployed copy of the artifact.
Sharing is limited to the same artifact version in the same landscape.
A different artifact version or a different landscape uses a separate instance.

Reuse avoids duplicate deployments when several vectors use an unchanged service, which saves runtime resources.

### Check the runtime requirements

Sharing an instance also shares its runtime state. The application must keep the context of different vectors separate. For Kubernetes services, follow [Share an artifact instance](../deployers/kubernetes/artifact-reuse.md) before enabling reuse. Other deployers define their own runtime requirements.

## Next steps

Prepare your artifact with its [deployer's packaging guides](../deployers/index.md), then [publish it](./publish-artifacts.md).
