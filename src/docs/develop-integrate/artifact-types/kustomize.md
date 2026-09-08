---
title: "Author a Kustomize artifact"
description: "Package a Kustomize bundle so the deployer renders it into a landscape."
outline: deep
editLink: true
lastUpdated: true
---

# Author a Kustomize artifact

After this guide, your Kustomize bundle deploys as one artifact of a vector. Use it when your service ships plain Kubernetes manifests with a `kustomization.yaml`.

<!-- TODO(fkasper): skeleton. Fill from deploy-operate/deployer/overview.md section "Kustomize authoring". -->

## Prerequisites

Before you begin, make sure you have:

- A directory with a `kustomization.yaml` that renders with `kubectl kustomize`.
- An OCI registry you can push to.
- The `kden` CLI. See [Publish artifacts](../publish-artifacts.md).

## Package the bundle as an OCI artifact

<!-- TODO: steps from "Packaging". -->

1. Build the OCI artifact from the bundle directory.
2. Push it to the registry.

## Leave the fields the deployer sets untouched

<!-- TODO: from "Fields set by the deployer on the Flux Kustomization" and "Fields that must not be set in the bundle's kustomization.yaml". List each field and who owns it. -->

## Name resources for the suffix the deployer adds

<!-- TODO: from "Resulting resource names". Explain the `nameSuffix` rule and its effect on Service names and DNS. -->

## Reference the bundle from the artifact component

<!-- TODO: the OCM resource entry for the Kustomize bundle plus the manifest resource. Link to Publish artifacts for the full constructor file. -->

## Verify the result

<!-- TODO: command or observation that shows the rendered resources in the landscape. -->

## Next steps

- [Publish artifacts](../publish-artifacts.md)
- [Add deployment results to an artifact](../vector-data/deployment-results.md) to expose a Service to sibling services.
