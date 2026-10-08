---
id: ADR-0039
title: "Deployer specification and conformance"
description: "Make the written deployer specification the source of truth for controller behavior, supported by Go bindings and conformance tests."
status: draft
date_proposed: 2026-10-07
authors: [karstenkoehler]
category: Architecture Pattern
impact: High
dependencies: [ADR-0038]
pageClass: adr
outline: deep
---

# ADR-0039: Deployer specification and conformance

<AdrHeader />

## Context

Konfidence needs a stable contract for deployers targeting different runtimes.
Today, parts of that contract are implicit in the Konfidence CRDs and the Kubernetes Landscape Orchestrator (KLO).
This makes it difficult to tell which behavior every deployer MUST provide, which capabilities are OPTIONAL, and whether an implementation is compatible with a Konfidence release.

## Decision

### Written contract alongside the core API

The **written deployer specification** is the normative source of truth for the required and optional behavior of a deployer controller.
It defines the control-plane resources deployers act on, how they interpret and process them, what status and results they report, and the guarantees they during the deployment lifecycle.
Normative requirements use BCP 14 (RFC 2119 and RFC 8174) terminology and will have stable identifiers so they can be referenced by tests.
The specification will define how optional capabilities are declared and how unsupported behavior is reported.

The canonical text lives in the [`konfidence` repository's `deployer-specification/` directory](https://github.com/konfidence-project/konfidence/tree/main/deployer-specification), alongside the API types it specifies.
The public `konfidence-docs` site links to or publishes that source.

### Go bindings

Go bindings will make it easier for Go deployers to conform to the written specification.
Using that library is optional: a deployer can conform without being written in Go or importing it.
The bindings are not normative and must follow the published contract.

Whether they are a helper library or a framework that also owns controller lifecycle remains to be decided.

### Conformance tests

A conformance suite tests a real deployer implementation against the normative requirements from the specification, including the mandatory subset and the optional capabilities it declares.
Tests run in the deployer's own repository/CI against specified Konfidence and deployer specification versions.
The suite is published as an asset of a Konfidence core release, so implementations can select a reproducible test version.
The conformance tests supply required control-plane resources directly and substitute core behavior as needed.

### Versioning

The deployer specification is versioned independently, allowing several specification versions to coexist.
Each release of Konfidence core has to specify which deployer specification versions it supports. 
The Go bindings are versioned with Konfidence core and may support more than one specification version.

## Consequences

- Changes to deployer behavior require a review of the written contract, Go library and conformance assertions.
- Extension developers can implement and verify deployers without relying on KLO internals or a Go-specific interface.
- KLO needs to be checked against the contract and changed where its existing behavior does not conform. Its implementation uses the Go library where useful.

The implementation work is tracked by [konfidence#351](https://github.com/konfidence-project/konfidence/issues/351) and [konfidence#358](https://github.com/konfidence-project/konfidence/issues/358).
