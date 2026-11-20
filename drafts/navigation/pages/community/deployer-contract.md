---
title: "Deployer contract"
scope: "Extension development"
editLink: false
lastUpdated: false
---
# Deployer contract

A deployer implements one or more artifact types. It interprets their payloads and target parameters, performs the platform-specific work, and reports the result to Konfidence.

## Start with the contract

Read the [deployer specification](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md) in the Konfidence repository. It is the maintained source for responsibilities and resource interactions. Check the document's status and open sections when designing an integration.

The [Deployment model](../core/deployment-model.md) explains how artifacts, targets, and deployers relate. [Deployers](../deployers/index.md) covers the deployer available to operators.

## Test an implementation

The [local development guide](./local-development.md#test-a-deployer) describes the conformance setup. [ADR-0046](./decisions/adr-0046-deployer-specification-and-conformance.md) records the specification and test approach; [ADR-0044](./decisions/adr-0044-deployer-conformance-test-setup.md) records the test environment.

Kubernetes examples are documented under [Kubernetes landscape orchestrator](../deployers/index.md#kubernetes). Their Helm, Kustomize, and HTTP routing details belong to that implementation.
