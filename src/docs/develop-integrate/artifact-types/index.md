---
title: "Artifacts"
description: "What an artifact is, which types Konfidence deploys, and where to go to author one."
outline: deep
editLink: true
lastUpdated: true
---

# Artifacts

An artifact is one deployable microservice packaged as an Open Component Model (OCM) component. A vector references artifacts by version, and the deployer renders them into a landscape.

<!-- TODO(fkasper): skeleton. Fill from deploy-operate/deployer/overview.md sections "Supported manifest types", "Referencing the deployable artifact in OCM", and "A note on artifact reuse". -->

## An artifact carries one deployable and one manifest

<!-- TODO: the OCM component layout: exactly one Kustomize or Helm resource plus one `cloud.konfidence.artifact.manifest` resource. Optional task manifests. -->

## The manifest declares the type and the reuse policy

<!-- TODO: the manifest JSON with `type` and `allowReuse`. State the consequence of `allowReuse: true`: one running instance serves several vectors, so the service must resolve siblings per request. -->

```json
{
  "type": "<artifact-type>",
  "allowReuse": false
}
```

## Konfidence deploys these artifact types

The following table lists the supported types and where to learn how to author each one.

| Type | Deployable content | Authoring guide |
| --- | --- | --- |
| `<kustomize-type>` | A Kustomize bundle as an OCI artifact | [Author a Kustomize artifact](./kustomize.md) |
| `<helm-type>` | A Helm chart | [Author a Helm artifact](./helm.md) |

<!-- TODO(fkasper): confirm the type identifiers. The deployer page says `cloud.konfidence.flux.kustomize` and `cloud.konfidence.flux.helm`; the orchestrator source accepts `kustomize.konfidence.cloud` and `helm.konfidence.cloud`. -->

## Next steps

- [Author a Kustomize artifact](./kustomize.md)
- [Author a Helm artifact](./helm.md)
- [Publish artifacts](../publish-artifacts.md) to package and push an artifact to a registry.
