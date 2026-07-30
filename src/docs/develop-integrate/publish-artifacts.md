---
title: Publish Artifacts
description: Learn how to publish and version your application artifacts using Konfidence and the Open Component Model.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Publish Artifacts

## Artifact manifest

* OCM component-constructor + Konfidence-specific manifest
* CLI: `kden artifact validate`

## Create artifact

* CLI: `kden artifact push`, `kden artifact alias`
* explain OCM base concepts and how we use them in Konfidence: components, semver, aliasing

## Deployer-specific authoring rules

The [Deployer](../reference/glossary.md#deployer) consuming your artifact
imposes conventions on how it must be packaged. See:

- [Kubernetes Deployer](./deployers/kubernetes.md) — supported manifest types
  (`cloud.konfidence.flux.kustomize`, `cloud.konfidence.flux.helm`), OCM
  content requirements, and templating rules for kustomize bundles and Helm
  charts.