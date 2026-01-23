---
title: Introduction
description: Learn about Konfidence, a comprehensive software delivery framework for microservice-based software-as-a-service (SaaS) applications.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# What is Konfidence?

Konfidence is a comprehensive software delivery framework for microservice-based software-as-a-service applications.

It helps teams deliver complex applications consistently across multiple environments.
Konfidence introduces clear delivery semantics and a structured release model that scales with growing systems, teams, and release frequency.

Konfidence targets organizations that operate multi-service landscapes and need confidence in what they release, where it runs, and how it reaches production.

## Why use Konfidence?

As systems grow, software delivery becomes harder to manage. Teams deploy many services across multiple environments. Features evolve in parallel. Releases happen more often.

In this setup, inconsistencies between environments become common. Applications behave differently in testing and production. Teams lose track of what has been validated and what is actually running.

These issues slow down delivery and increase risk. They make releases harder to reason about and harder to trust.

### Enforcing consistency across the delivery lifecycle

Konfidence addresses this problem by enforcing consistency across the entire delivery lifecycle. It ensures that teams promote only verified application versions and release them in a controlled and transparent way.

As a result, teams can improve delivery performance indicators such as deployment frequency and change failure rates, commonly measured through DORA metrics.

## How does Konfidence work?

Konfidence centers around immutable, versioned application packages which we call **vectors**.

A vector represents exactly one version of an application at a certain point in time. It is a complete, versioned set of artifacts that together define what gets delivered. A vector is immutable. Any change results in the creation of a new vector.

### Qualifying vectors

Teams can qualify vectors by attaching metadata such as test results or security scan results. Konfidence uses the Open Component Model (OCM) descriptor format for this metadata. Teams make traceable and auditable delivery decisions without modifying the vector itself.

Rather than embedding deployable content, a vector contains references to the required artifacts and their configurations. This makes deployments reproducible, auditable, and isolated from previous versions.

### Promoting verified application versions

Teams promote the same vector across environments instead of rebuilding or reconfiguring applications for each deployment. This guarantees that what runs in production matches exactly what was validated earlier.

By separating build and release concerns, Konfidence establishes a predictable and repeatable delivery model.

## Who is Konfidence for?

Konfidence supports everyone involved in the software delivery lifecycle:
- [Users](src/docs/user-guide), who define and validate application vectors.
- [Operators](src/docs/operator-guide) who manage deployments and environment promotion.
- [Contributors](src/docs/contributor-guide) who extend the framework or integrate it with existing tooling. 

## What are the benefits of Konfidence?

Konfidence enables teams to:

- Assemble artifacts into immutable application vectors to define exactly what gets delivered  
- Promote the same verified application version consistently across environments  
- Perform controlled rollouts using feature toggles and ring deployments  
- Track and audit application versions throughout the delivery lifecycle  
- Avoid unnecessary redeployments and reduce operational overhead  
- Reduce infrastructure costs by reusing services across stages within the same landscape  

These principles support frequent releases while maintaining control and reliability.

## What's next?

If you're new to Konfidence, begin with the [Core Concepts](src/docs/core-concepts) section to understand how application vectors, environments, and delivery semantics fit together. From there, choose the guide that matches your role: User, Operator, or Contributor.

