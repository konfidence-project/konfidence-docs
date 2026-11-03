---
id: ADR-0040
title: "Ownership and meaning of stage endpoints"
description: "Compares configured links, reported addresses, and managed stage endpoints."
status: draft
date_proposed: 2026-10-09
authors: [AnsgarH1]
category: Architecture Pattern
impact: High
dependencies: [ADR-0037]
pageClass: adr
outline: deep
---

# ADR-0040: Ownership and meaning of stage endpoints

<AdrHeader />

## Context

Users need dashboard links to a stage's exposed application services.

[ADR-0037](./adr-0037-ingress-routing-and-activation.md) gives administrators control of Gateways and hostname-to-stage mapping. Konfidence manages internal routes using a stage header and service path. These routes do not reveal the external hostname.

This ADR considers who defines endpoints and who manages them. Resources and controller behavior remain to be designed.

## Considered options

### Option 1: Administrator-configured links

An administrator configures routing, then records a stage URL such as `https://test.example.com/interviews`. Konfidence displays it. Editing the link does not change routing.

#### Implications

- Konfidence needs storage for stage links and API/UI support to display and optionally edit them.
- Link edits should not trigger delivery work. Adding links to `Stage.spec` would currently create a new StageVersion because its identity includes `metadata.generation`.
- KLO needs no changes. This preserves ADR-0037's routing ownership.
- Administrators maintain addresses in two places. Links can become stale when routes or services change and do not prove reachability.

This is the smallest option. It provides navigation, not exposure management.

### Option 2: Runtime-reported endpoints

The routing system reports addresses and available status to Konfidence. For example, an integration reads an administrator-managed edge route and reports its hostname and service path for the stage. The UI displays this information rather than storing another editable copy.

#### Implications

- KLO's `http-k8s-service` results contain Service names, namespaces, and ports for discovery through VectorData. They lack external addresses. Konfidence needs stage-level endpoint reporting because several stages can share an ArtifactDeployment.
- Today's KLO activation executor could report its generated hostnames. Under ADR-0037, however, internal routes cannot reveal the administrator's external hostname mapping.
- A reporter, in KLO or a separate integration, needs access to external routing configuration and a way to associate routes with stages.
- Reports must follow route and active-version changes and remove stale addresses. Route acceptance alone does not confirm working DNS, TLS, or external traffic.

This avoids duplicate address configuration but requires integrations with routing systems. Administrators still configure hostnames outside Konfidence.

### Option 3: Declarative stage endpoints

A stage operator declares the desired address and service, for example `https://test.example.com/interviews` for a component's `interviews` result. A routing implementation configures the endpoint and reports status. The declaration stays stable when the backing Kubernetes Service changes.

#### Implications

- Konfidence needs endpoint configuration and separate status in its API/UI. Service references must distinguish components and result names/types; result names alone are not unique across a vector.
- The implementation resolves backends through the active StageVersion and VectorDeployment results. Traffic must follow the active version, not a merely deployed target version.
- KLO currently routes discovered services when its HTTP activation task runs. This option needs rules for which services may be exposed, missing results, and route cleanup.
- Gateway and HTTPRoute settings stay runtime-specific. Whether they belong in DeploymentTarget or another resource remains open. The artifact deployer need not own routing.
- Managing hostname-to-stage mapping extends ADR-0037. The platform must delegate control of the relevant routes while retaining ownership of Gateways, DNS, and TLS. Endpoint edits should not require artifact redeployment.

This is the largest change: Konfidence becomes responsible for making routing match declared endpoints and reporting failures.

## Decision

- TODO

## Consequences

- TODO

## Open questions

- Where are endpoints stored, and how is the routing implementation selected?
- How do stage settings relate to services the application allows to be exposed? What if none are exposed?
- How are services identified, and which hostname/path combinations are supported?
- Which routes may Konfidence manage on administrator-owned infrastructure?
- What does endpoint status guarantee, and how are route changes coordinated with activation?
