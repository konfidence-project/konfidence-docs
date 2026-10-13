---
id: ADR-0038
title: "Select deployers by artifact type instead of DeploymentClass"
description: "Remove DeploymentClass registration and select platform-wide deployers directly by vendor-owned artifact types."
status: approved
date_proposed: 2026-10-07
date_approved: 2026-10-08
authors: [karstenkoehler]
category: Architecture Pattern
impact: High
dependencies: [ADR-0027]
pageClass: adr
outline: deep
---

# ADR-0038: Select deployers by artifact type instead of DeploymentClass

<AdrHeader />

## Context

[ADR-0027](./adr-0027-landscape-deployment-target.md) introduced a cluster-scoped `DeploymentClass` between an artifact's type and a landscape's `DeploymentTarget`.
The current API uses `DeploymentClass.metadata.name` as the identifier and its `spec.controller` to assign reconciliation to a controller.

Each deployer defines the artifact types it understands under its vendor-owned domain and would register those same types in `DeploymentClass` resources pointing back to itself.
Artifact types **must** be deployer-specific: a generic type such as `helm` would imply that all Helm deployers follow a shared packaging and interpretation contract, but no party owns or defines such a contract.
Different deployers could therefore interpret the same generic type differently, causing ambiguous selection and incompatible deployments.
Binding each type to a vendor-owned deployer makes the provider responsible for defining and documenting its contract.

The `DeploymentClass` type-to-controller mapping adds no useful choice.
The artifact type already identifies the responsible deployer and packaging contract.
Instead, it makes every artifact and target reconcile loop look up a class and check its controller, even though the deployer already knows which types it handles.
We have no requirement to reassign a type dynamically to another controller.

## Decision

Remove the `DeploymentClass` CRD and its role in deployer selection.
Keep `DeploymentTarget` as a namespace-scoped resource in the landscape namespace, and preserve the `Project`, `Landscape`, and `Stage` relationships established by ADR-0027.
This ADR supersedes ADR-0027's `DeploymentClass` registration and controller selection design.
It does not supersede ADR-0027's landscape and project model.

Use a stable, vendor-owned artifact type such as `helm.konfidence.cloud`.
Artifacts declare that type in their manifest (currently `ArtifactDeployment.spec.manifest.type`), while targets configure a destination for the same type.
Deployers select resources by their configured type identifiers.
The exact syntax and behavior will be defined by the separate deployer specification.

A `DeploymentTarget` selects the same type through a proposed `spec.artifactType` field.
At most one target for a given artifact type is expected in a landscape namespace.
Two types may still use the same underlying destination or credential reference, as Helm and Kustomize do today.

## Consequences

- **Simpler reconciliation:** Deployers match their own types directly instead of installing and watching redundant classes or looking up class ownership for every artifact and target.
- **Weaker discovery and enforcement:** The API no longer enumerates installed deployer classes. Misconfigured controllers could race on status and runtime objects. This is mitigated by including the vendor domain into the artifact type. Cluster administrators are responsible to ensure compatibility when using multiple deployers. 
- **Deployer Health/Availability still open:** A deployer that crashes after writing `Ready=True` can leave status stale. This is true for all kubernetes controllers. 

The [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/deployer-specification/index.md) will define field validation, status ownership, and deletion behavior in detail.
This ADR records the architectural choice; its proposed fields and conditions do not describe the current CRDs.
