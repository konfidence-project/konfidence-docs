---
title: "Reference"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Reference

Look up the commands, resource fields, and configuration used by Konfidence core.

| Reference | What you will find |
| --- | --- |
| [Glossary](./glossary.md) | Product terms and resource relationships. |
| [kden CLI](./cli.md) | Commands and options. To set up the client, [install the CLI](../start/install-cli.md). |
| [API](./api.md) | REST endpoints and schemas. |
| [Custom resources](./crd.md) | The Kubernetes resources used by Konfidence core. |
| [Konfidence Helm values](./helm-values-konfidence.md) | Configuration for the Konfidence installation. |

The shared custom resources include projects, stages, vectors, deployment targets, and the contract that deployers use. They stay here even when a deployer targets a platform other than Kubernetes. Konfidence itself stores its state in Kubernetes.

For Kubernetes, look up [KLO Helm values](../deployers/kubernetes/helm-values.md), [artifact types](../deployers/kubernetes/artifact-types.md), [target parameters](../deployers/kubernetes/target-parameters.md), or [Service results](../deployers/kubernetes/service-results.md). Other platform-specific references are listed under [Deployers](../deployers/index.md).
