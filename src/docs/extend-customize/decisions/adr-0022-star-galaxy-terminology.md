---
id: ADR-0022
title: "Star and galaxy terminology for control planes"
status: accepted
authors: [nelehornbostel]
category: Project Management
impact: High
dependencies: []
pageClass: adr
outline: deep
---
# ADR-0022: Star and galaxy terminology for control planes

<AdrHeader />

## Context

We received feedback that **local control plane** (LCP) and **global control plane** (GCP) are technically accurate but very elaborate names. Especially for external communication it could make sense to use metaphorical naming (similar to Gardeners approach using terms like "Shoot" and "Seed" clusters) to simplify communication and improve conceptual clarity.

Konfidence already uses space-themed names, so new terms must stay consistent with them. The renaming only affects these two central building blocks.

The new names should fit naturally into the exiting space theme, be clear, consistent, and Kubernetes‑friendly, avoid misleading implications about hierarchy or behavior, avoid collisions with existing OSS concepts.

The maintainers collected, reviewed and shortlisted candidate names.

Two terminology pairs remained after shortlisting:

- LCP: Star / GCP: Galaxy
- LCP: Planet / GCP: Galaxy

This ADR documents the final decision, which was decided by the maintainers.

## Considered Solutions

### Option 1: Star/Galaxy

A star represents an active, energetic node. A galaxy is the large‑scale structure composed of many stars. This pair reflects a direct structural relationship.

**Pros:**
- A galaxy is made of stars. Stars are the fundamental building block of a galaxy's structure.
- Stars are active, energetic nodes.
- The metaphor is easy to visualize.
- Simple, memorable, globally recognizable words.

### Option 2: Planet/Galaxy

A planet is a self‑contained world. A galaxy is the larger cosmic structure containing many planetary systems.

**Pros:**
- Planets are intuitive “local worlds.”
- Simple, memorable, globally recognizable words.

**Cons:**
- Planets are passive bodies. They do not drive or coordinate activity.

## Decision

The names **star** and **galaxy** form a clear, intuitive, metaphorically coherent pair. They are a clean fit with OSS norms, have no collision with existing projects or concepts, and are technically accurate and not misleading. From a linguistic perspective, they are clear, simple, memorable, and globally understandable.

## Consequences

### Positive Consequences
- Consistent, intuitive terminology across code, documentation, and communication.
- Strong alignment with the established space theme.

### Negative Consequences
- Updates across code, documentation, and diagrams will be required.
- Potential initial confusion during the transition period.

### Neutral Consequences
- Architectural concepts remain unchanged. Only terminology is updated.

## Implementation Note

Code, docs and diagrams use star and galaxy as the naming convention.

## Open Question

The objection was raised that the prefixes `galaxy-` and `star-` are not necessarily needed and may only make the controller names unnecessarily longer. `vector-assembly-controller`, `vector-promotion-controller`, `stage-configuration-controller` are already self-explanatory, and the context would be clear through the directory structure. This would mean that the controllers would not need to be renamed, e.g. from `gcp-vector-assembly-controller` to `galaxy-vector-assembly-controller`.
