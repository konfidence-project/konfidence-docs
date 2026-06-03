---
title: Vectors and Artifacts
description: Learn about the key building blocks of Konfidence - Artifacts and Vectors - and how they work together to define your application.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Vectors and Artifacts

Before you deploy software, you must define it. Konfidence uses strict versioning and builds heavily on the Open Component Model (OCM) to package and describe these definitions.

## Artifact

An artifact describes a single piece of your software, such as a microservice, a configuration file, or an asset. Developers usually maintain their own artifacts and build and push them during the publish or release stages of their CI/CD pipelines.

* **Definition:** An OCM component version that contains a reference to a build result (like a Docker image) and its metadata.
* **Role:** It tells Konfidence exactly what to deploy. An artifact serves as a pointer but can also contain the actual binary resources directly.  
*(To learn how to create these components, see the [OCM guide on creating component versions](https://ocm.software/docs/getting-started/create-component-versions/).)*

## Vector

A vector is a complete, immutable snapshot of your entire application at a specific point in time. While developers create artifacts, the global control plane usually composes the vectors.

* **Definition:** An OCM component with a fixed collection of artifacts that belong together, representing exactly one version of the application.
* **Role:** It guarantees consistency. Because it is immutable, it ensures that the exact combination of services you tested is the exact combination you deploy. You can define multiple vectors for different purposes. For example:
    * One vector for production (with only stable features).
    * One vector for previews (with experimental features).
    * One vector focused only on a specific team's services.

