
---
id: ADR-0013
title: "StageVersionUsage during vector rollout"
description: "StageVersionUsage CR design to prevent premature cleanup during vector rollouts"
status: accepted
date_approved: 2025-10-14
authors: []
category: Architecture Pattern
impact: Medium
dependencies: []
pageClass: adr
outline: deep
---

# ADR-0039: Static Content Deployer

<AdrHeader />

## Context

- The deployer uploads artifacts via the S3 API to any compatible object storage.
- Cache Invalidation is not necessary because vector specific conent is immutable and lifecycled with the vector (created, deleted).
- Artifacts 

## Artifact Type

- The deployer publishes a new artifact type called static.konfidence.cloud-v1alpha1