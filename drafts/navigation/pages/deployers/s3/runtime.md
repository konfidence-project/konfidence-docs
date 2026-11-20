---
title: "S3 deployment and activation"
scope: "S3 · In development"
editLink: false
lastUpdated: false
---
# S3 deployment and activation

The accepted design separates storing an application version from making that version available through a serving endpoint. Implementation and end-to-end validation are still in progress.

## Deploy the files

The S3 deployer uploads extracted resources to deployment-specific paths and reports their locations as deployment results. Konfidence aggregates results into vector data. The static deployer's vector-data controller checks for conflicts between public routes.

Other components can use the reported S3 locations to read static files directly. Public serving additionally needs the administrator's CDN, proxy, or reverse proxy.

## Activate the version

A user-owned `ActivationTaskRegistration` supplies a Kubernetes Job definition. The static deployer's activation controller creates and monitors the Job. The Job applies the serving configuration and checks completion.

The design describes two starter approaches:

- Write one atomic stage-selection document in S3 for a serving handler to read.
- Update edge routing and vector data through a CDN API.

These are serving choices within the S3 deployer. They are not additional deployers. The administrator provides DNS, HTTPS, credentials, and the serving infrastructure.

## Understand the runtime boundary

Kubernetes application guides describe Service annotations, OFREP, and `X-Vector-ID` propagation. Those instructions are not a general static-content runtime contract. The S3 design places client-facing vector data and file selection in the serving integration.

Vector stickiness across browser sessions, static content, and backend calls remains future work in the design. Do not assume it is available.

## Deployment responsibilities {#what-it-adds-to-konfidence}

| Responsibility | Owner |
| --- | --- |
| Application version, stages, promotions, and shared deployment state | Konfidence core |
| Extract artifact archives, upload files, and report storage locations | S3 deployer |
| Storage, DNS, HTTPS, credentials, and public path assignments | Administrator |
| Apply the serving configuration for an activated vector | User-configured activation Job |

The design allows a vector to combine static content with other artifact types. Installation, mixed-deployer validation, and conformance work are still in progress.

## Reference

Read [ADR-0042](../../community/decisions/adr-0042-static-cdn-deployer.md) for activation inputs, completion checks, caching, cleanup, and remaining design limits.
