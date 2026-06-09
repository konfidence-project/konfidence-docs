---
title: Galaxy installation
description: Install and configure the Galaxy control plane for your Konfidence deployment.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Galaxy installation

<!-- 
  Content type (Diátaxis): How-to guide — operator installs  Galaxy on a Kubernetes cluster.
  TW will create structured guide for this 
- DEV:
  - Minimum Kubernetes version required?
  - Any CRDs that must be pre-installed (e.g., Gateway API CRDs, Flux)?
  - what are the concrete steps that the user has to do to complete the installation?
  Ticket: DOCS — Galaxy Installation: Provide complete Helm commands, prerequisites, and OCI secret configuration
-->

## Prerequisites



- k8s cluster

## Helm

<!-- DEV:
  - Helm repository URL (`helm repo add` command)
  - Chart name and recommended release name
  - Minimum required `--set` values or a starter `values.yaml`
  - Namespace to install into
-->

* `helm install galaxy`

## OCI connectivity

<!-- DEV:
  - What type of Kubernetes secret is needed (e.g., `docker-registry` secret)?
  - Provide an example `kubectl create secret` command
  - How is the secret referenced in the Galaxy Helm values?
-->

* add secrets for OCI registry access