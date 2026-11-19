---
title: "Build"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Build

Build your services in CI and publish each one as a versioned artifact. These artifacts are the inputs Konfidence uses to assemble an application version.

## Before you begin

Your platform team provides a project and access to an artifact registry. For a prepared example, follow [Deliver an application](../start/deliver-an-application.md).

## Package and publish a service

1. Choose your [deployer](../deployers/index.md) and follow its packaging requirements. For Kubernetes, [prepare your application](../deployers/kubernetes/prepare-your-application.md), then [author a Helm artifact](../deployers/kubernetes/helm.md) or [author a Kustomize artifact](../deployers/kubernetes/kustomize.md).
2. Decide whether vectors can [reuse an artifact instance](./artifact-types.md). This affects how your service handles requests from different application versions.
3. [Publish artifacts](./publish-artifacts.md) to validate and push them to your registry.

The publishing workflow is shared. Artifact payloads and runtime requirements depend on the deployer.

## Result

Your registry contains versioned artifacts that Konfidence can resolve. Continue with [Assemble](./assemble.md) to combine them into an immutable vector.
