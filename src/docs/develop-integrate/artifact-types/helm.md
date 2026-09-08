---
title: "Author a Helm artifact"
description: "Package a Helm chart so the deployer renders it into a landscape."
outline: deep
editLink: true
lastUpdated: true
---

# Author a Helm artifact

After this guide, your Helm chart deploys as one artifact of a vector. Use it when your service already ships as a chart.

<!-- TODO(fkasper): skeleton. Fill from deploy-operate/deployer/overview.md section "Helm authoring". -->

## Prerequisites

Before you begin, make sure you have:

- A chart that renders with `helm template`.
- An OCI registry you can push to.
- The `kden` CLI. See [Publish artifacts](../publish-artifacts.md).

## Package the chart as an OCI artifact

<!-- TODO: steps from "Packaging". -->

1. Package the chart.
2. Push it to the registry.

## Leave the fields the deployer sets untouched

<!-- TODO: from "Fields set by the deployer on the Flux HelmRelease". List each field and who owns it. -->

## Use the release name in your templates

<!-- TODO: from "Chart template requirement". Show the template expression the chart must use so resource names follow the per-vector release name. -->

## Reference the chart from the artifact component

<!-- TODO: the OCM resource entry for the chart plus the manifest resource. Link to Publish artifacts for the full constructor file. -->

## Verify the result

<!-- TODO: command or observation that shows the rendered release in the landscape. -->

## Next steps

- [Publish artifacts](../publish-artifacts.md)
- [Add deployment results to an artifact](../vector-data/deployment-results.md) to expose a Service to sibling services.
