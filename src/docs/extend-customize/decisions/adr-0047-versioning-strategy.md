---
id: ADR-0047
title: "Documentation versioning strategy"
description: "Propose a versioning strategy for the Konfidence documentation."
status: draft
date_proposed: "2026-11-13"
authors: [skradde, AnsgarH1]
category: Architecture Pattern
impact: High
dependencies: [ADR-0025]
pageClass: adr
outline: deep
---

# ADR-0047: Documentation versioning strategy

<AdrHeader />

## Context

The documentation currently has no separate release versions.

Users need documentation that matches the Konfidence version they use. Development continues on `main` after a release. Without separate documentation versions, instructions can describe features that are not yet available or miss changes that have already shipped.

The documentation stays in its own repository. It covers Konfidence and the Kubernetes Landscape Orchestrator and must also accommodate future deployers.

## Decision

We propose separate documentation for published releases and ongoing development. Release documentation describes the behavior available in the corresponding release. Development documentation follows work on `main` and is clearly marked as unreleased.

Under this proposal, published documentation can receive corrections and missing explanations that apply to its release. Relevant corrections also need to reach other maintained versions, including development documentation.

## Open questions

The team needs to resolve the following questions:

### Release scope and readiness

- What defines the final release contents, and when do we confirm them? 

- Who checks that the documentation covers those contents and excludes later changes? 

- How do we handle missing documentation at release time?

### Version names

Projects use different labels for release and development documentation. Which names should we use, and which version should readers see by default?

One suggestion is to keep the name **main** with a **Development (unreleased)** label and show each stable release number with a **Stable** label. Which label should we use for published pre-release versions?

### Support window

How many documentation versions should we maintain, and which releases count as separate versions? 

Should documentation maintenance follow the software support window?

One option is to maintain the three most recent stable versions and hide older versions from the version selector. This is a suggestion for team discussion. Would older pages remain available through direct links?

### Component versions

Do deployers, currently just the Kubernetes Landscape Orchestrator, have—or are they expected to have—a release cycle independent of Konfidence? If so, how should their versions map to documentation versions?

## Consequences

Maintaining several documentation versions means checking which versions each change affects. Release preparation includes reviewing documentation across the repositories involved.

## Related ADRs

[ADR-0025: Release on demand via manual tags](./adr-0025-release-strategy.md) defines the software release process, separate component release cycles, and support for the latest and previous minor version.

The documentation versioning work is tracked in [story #343](https://github.com/konfidence-project/konfidence-project/issues/343).
