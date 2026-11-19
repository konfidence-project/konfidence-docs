---
title: "Deployers"
scope: "Deployers"
editLink: false
lastUpdated: false
sidebar: false
aside: left
outline: 2
pageClass: deployer-directory
description: "Find packaging and setup guides for Kubernetes, S3, and Cloud Foundry."
---
# Deployers {#manage-deployers}

Find the guides for your artifact format and the platform where it will run.

<div class="platform-list" id="available-deployers">
<section class="platform-row" aria-labelledby="kubernetes">
<div class="platform-label">

## Kubernetes {#kubernetes}

<p class="platform-status">Documented workflow</p>
</div>
<div class="platform-guides">

Deploy Helm charts and Kustomize bundles with the Kubernetes landscape orchestrator (KLO) and Flux.

- [Author a Helm artifact](./kubernetes/helm.md)
- [Author a Kustomize artifact](./kubernetes/kustomize.md)
- [Install the Kubernetes deployer](./kubernetes/install.md)
- [Configure a Kubernetes target](./kubernetes/configure-target.md)

</div>
</section>
<section class="platform-row" aria-labelledby="s3">
<div class="platform-label">

## S3 {#s3}

<p class="platform-status">In development</p>
</div>
<div class="platform-guides">

Explore the design for deploying static files to S3-compatible storage.

- [S3 artifact format](./s3/artifacts.md)
- [S3 target configuration](./s3/targets.md)
- [S3 deployment and activation](./s3/runtime.md)

</div>
</section>
<section class="platform-row" aria-labelledby="cloud-foundry">
<div class="platform-label">

## Cloud Foundry {#cloud-foundry}

<p class="platform-status">Proof of concept</p>
</div>
<div class="platform-guides">

See which parts of multi-target application (MTA) deployment the prototype demonstrates.

- [Cloud Foundry prototype capabilities](./cloud-foundry/index.md)

</div>
</section>
</div>

<p id="what-stays-the-same">A deployer defines how an artifact runs on its target platform. Konfidence manages the shared application version, stages, and promotions. See the <a href="/platforms/core/deployment-model">deployment model</a> for how the two fit together.</p>

::: details Check which artifact types your landscape can deploy

### Prerequisites for inspecting installed capabilities

- `kubectl` access to inspect the installed deployer and its configuration.
- For the landscape check below, a [landscape](../core/landscapes.md) and permission to read `DeploymentTarget` resources in its namespace.

### Check which types a landscape provides

List the targets in the landscape namespace:

```bash
kubectl get deploymenttargets --namespace=<landscape-namespace>
```

The `spec.artifactType` field identifies the artifact type and `Ready=True` indicates that its deployer accepts the target.
The landscape can deploy an artifact when it contains a ready target matching the artifact manifest type.

Use [Configure deployment targets for a landscape](../core/deployment-targets.md) to add a missing capability or investigate a target that is not ready.

:::

<span id="next-steps"></span>

To integrate another platform, see the [deployer contract](../community/deployer-contract.md).
