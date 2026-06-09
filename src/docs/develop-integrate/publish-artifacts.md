---
title: Publish Artifacts
description: Learn how to publish and version your application artifacts using Konfidence and the Open Component Model.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Publish Artifacts

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to publish a versioned artifact to an OCI registry so Konfidence can reference it in a vector.
  TW will create structured guide for this

  Dev input needed:
  - Which steps need to be explainded to have a wholesome guide?

  Ticket: DOCS — How to Publish Artifacts
-->

## Artifact manifest

* OCM component-constructor + Konfidence-specific manifest
* CLI: `kden artifact validate`

## Create artifact

* CLI: `kden artifact push`, `kden artifact alias`
* explain OCM base concepts and how we use them in Konfidence: components, semver, aliasing