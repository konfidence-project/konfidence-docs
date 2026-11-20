---
title: "Kubernetes architecture"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Kubernetes architecture

The documented Kubernetes setup runs Konfidence, the Kubernetes landscape orchestrator, and workloads in one cluster. The diagram shows delivery management handing desired stage state to runtime orchestration.

<DrawioDiagram src="/assets/diagrams/konfidence-architecture.drawio" />

## The current release runs everything in one cluster

Konfidence and the Kubernetes landscape orchestrator run in one Kubernetes cluster:

- The Konfidence Helm chart installs Konfidence's two components: the operator and the API server.
- The `kubernetes-landscape-orchestrator` Helm chart installs the deployer for the Kubernetes target runtime.
- Each project and each landscape owns a namespace in that cluster.

It is planned for the Kubernetes deployer to be able to deploy to remote Kubernetes clusters via [Target parameters](./target-parameters.md#target-parameters).
This feature is work in progress and does not yet create every resource on the remote cluster.
Omit the `spec.parameters` so that the deployer applies the resources to the control plane cluster directly.

## Runtime services and dependencies

KLO deploys Helm and Kustomize artifacts through Flux. The [vector data service](./vector-data-service.md) runs in each landscape namespace. [Gateway routing](./gateway-routing.md) controls stage ingress.

Availability of Flux, Gateway API infrastructure, and application services is configured separately from [Konfidence's operator and API replicas](../../core/high-availability.md).

## Next steps

Follow the [documented installation prerequisites](../../core/install.md#prerequisites), then [install KLO](./install.md).
