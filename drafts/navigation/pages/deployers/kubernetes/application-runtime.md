---
title: "Application runtime"
scope: "Kubernetes · KLO"
editLink: false
lastUpdated: false
---
# Application runtime

Use vector identity to keep requests, configuration, and service discovery associated with the application version handling the work. These guides describe the Kubernetes runtime provided by the Kubernetes landscape orchestrator and vector data service.

## Preserve the vector context

Start with [Prepare your application](./prepare-your-application.md). It explains how the ingress gateway passes the vector ID to a service and how services preserve it on outbound HTTP calls. [Access vector data in your application](./access-vector-data.md) also covers workloads that use other protocols.

## Read configuration and feature flags

Define settings with [Add configuration to a vector](../../core/vector-configuration.md). Then use [Access vector data in your application](./access-vector-data.md) or [Read feature flags in your application](./feature-flags.md) to retrieve the values for the current vector.

## Find sibling services

[Use deployment results](./deployment-results.md) to discover a service's actual deployed name and ports. [Service results on Kubernetes](./service-results.md) explains the annotations and the result contract.

## Receive external requests

[Expose a Service through stage ingress](./expose-service.md) selects the service port that the stage route should reach. Your platform team first configures [Gateway routing](./gateway-routing.md).

Signing belongs to the shared delivery workflow. See [Configure signing and verification](../../core/signing.md) before publishing or assembling versions that require signatures.
