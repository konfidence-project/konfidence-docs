---
title: "Architecture decisions"
scope: "Engineering decisions"
editLink: false
lastUpdated: false
description: Architecture decision records (ADRs) that explain why the maintainers designed Konfidence the way it is.
outline: deep
---
# Architecture decisions

Architecture decision records (ADRs) explain why the maintainers designed Konfidence the way it is.
Read them before you change a component, so you know which trade-offs it already makes.
Each record covers one decision: its context, the options the maintainers compared, and the consequences.

## Every record has a status

| Status | Meaning |
| --- | --- |
| <Badge type="info" text="draft" /> | The author is still writing the record. |
| <Badge type="info" text="proposed" /> | The record is ready for review by the maintainers. |
| <Badge type="tip" text="accepted" /> | The maintainers approved the decision. The code follows it. |
| <Badge type="danger" text="rejected" /> | The maintainers considered the decision and did not adopt it. |
| <Badge type="warning" text="deprecated" /> | A later decision replaced this one. The record stays to explain how the current design came about. |

ADR numbers never change and never get reused.
Gaps in the list are records that are superseded, internal to the project, or still lack a decision.

## Decision log

| ADR | Decision | Status |
| --- | --- | --- |
| ADR-0002 | [High-level architecture](./adr-0002-high-level-architecture.md) | accepted |
| ADR-0005 | [Gateway API integration](./adr-0005-gateway-api-integration.md) | accepted |
| ADR-0006 | [OCM integration](./adr-0006-ocm-integration.md) | accepted |
| ADR-0007 | [Multi-landscape support and namespace separation](./adr-0007-multi-landscape-support.md) | accepted |
| ADR-0008 | [Task engine](./adr-0008-task-engine.md) | accepted |
| ADR-0009 | [StageVersion custom resources](./adr-0009-stage-version-crs.md) | accepted |
| ADR-0012 | [Activation controller](./adr-0012-activation-controller.md) | accepted |
| ADR-0013 | [StageVersionUsage during vector rollout](./adr-0013-stage-version-usage.md) | accepted |
| ADR-0019 | [OCM in vector assembly](./adr-0019-ocm-vector-assembly.md) | accepted |
| ADR-0022 | [Star and galaxy terminology for control planes](./adr-0022-star-galaxy-terminology.md) | accepted |
| ADR-0023 | [Monorepo with separate binaries](./adr-0023-repo-structure.md) | accepted |
| ADR-0024 | [Vector-scoped data distribution](./adr-0024-vector-scoped-data-distribution.md) | draft |
| ADR-0025 | [Release on demand via manual tags](./adr-0025-release-strategy.md) | accepted |
| ADR-0026 | [Merge galaxy and star into a single cluster](./adr-0026-galaxy-star-single-cluster.md) | accepted |
| ADR-0027 | [Landscape and deployment target concept](./adr-0027-landscape-deployment-target.md) | accepted |
| ADR-0028 | [Project CRD and multi-tenancy authorization](./adr-0028-project-crd-multi-tenancy.md) | accepted |
| ADR-0029 | [API gateway conventions and design](./adr-0029-api-gateway.md) | accepted |
| ADR-0030 | [API authentication flows](./adr-0030-api-auth-flows.md) | accepted |
| ADR-0031 | [API principles](./adr-0031-api-principles.md) | accepted |
| ADR-0032 | [Vector promotions](./adr-0032-vector-promotions.md) | accepted |
| ADR-0033 | [Dependabot for code dependency updates](./adr-0033-dependabot.md) | accepted |
| ADR-0034 | [ArtifactDeployment and Flux resource naming](./adr-0034-artifact-deployment-naming.md) | accepted |
| ADR-0035 | [Dashboard technology stack](./adr-0035-dashboard-technology-stack.md) | accepted |
| ADR-0036 | [Dashboard UI component and CSS library](./adr-0036-dashboard-ui-library.md) | accepted |
| ADR-0037 | [Ingress routing and activation](./adr-0037-ingress-routing-and-activation.md) | accepted |
| ADR-0038 | [Select deployers by artifact type instead of DeploymentClass](./adr-0038-artifact-type-deployer-selection.md) | accepted |
| ADR-0039 | [Promotion gates](./adr-0039-promotion-gates.md) | accepted |
| ADR-0040 | [Promotion rejection and force execution](./adr-0040-promotion-rejection-and-force-execution.md) | proposed |
| ADR-0041 | [Documentation maintenance and quality checks](./adr-0041-documentation-maintenance.md) | draft |
| ADR-0042 | [Static content deployer, from artifacts to live traffic](./adr-0042-static-cdn-deployer.md) | accepted |
| ADR-0043 | [Provision a cluster-internal konfidence-router through GEP-5093](./adr-0043-provision-konfidence-router.md) | proposed |
| ADR-0044 | [Execute conformance tests for a deployer implementation](./adr-0044-deployer-conformance-test-setup.md) | accepted |
| ADR-0045 | [OCM Content Layer: Exposing storage-level OCM data through the Konfidence API](./adr-0045-ocm-content-layer.md) | proposed |
| ADR-0046 | [Deployer specification and conformance](./adr-0046-deployer-specification-and-conformance.md) | accepted |


## Propose a new decision

Follow the [Architecture decision records](../contributing.md#architecture-decision-records) section in the contribution guidelines.
