---
title: CRD
description: Custom Resource Definition specifications for Konfidence Kubernetes resources.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# CRD

Reference for Konfidence Custom Resource Definitions (CRDs) used in Kubernetes.

## Overview

Konfidence extends Kubernetes with custom resources that manage the deployment lifecycle. These CRDs are used by both Galaxy and Stars to orchestrate software delivery.

<!-- 
  Content type (Diátaxis): Reference — accurate, structured, complete. One section per CRD with apiVersion, kind, spec fields, and a minimal YAML example.
  TW will structure this as: one H3 per CRD, consistent field table (field | type | required | description), minimal YAML example per CRD.

  Dev input needed:
  
  - For each CRD: confirm the spec fields listed are accurate and complete (or provide the current schema)
  

  Ticket: DOCS — CRD Reference: Replace placeholder API group, add missing CRDs (VectorTemplate, StageConfig, VectorPromotion), validate existing spec fields
-->

## Core CRDs

### Vector

Represents an immutable collection of artifacts at a specific point in time.

```yaml
apiVersion: konfidence.example.com/v1
kind: Vector
metadata:
  name: app-v1.2.3
spec:
  artifacts:
    - name: frontend
      version: 1.2.3
    - name: backend
      version: 1.2.3
```

**Key fields:**
- `artifacts` - List of artifacts and versions
- `configuration` - Vector-specific configuration
- `tasks` - Lifecycle tasks for this vector

### Stage

Defines a logical checkpoint in the delivery pipeline.

```yaml
apiVersion: konfidence.example.com/v1
kind: Stage
metadata:
  name: production
spec:
  landscape: prod-landscape
  currentVector: app-v1.2.3
  approval: required
```

**Key fields:**
- `landscape` - Target landscape for deployments
- `currentVector` - Currently deployed vector
- `approval` - Approval requirements for promotions

### VectorDeployment

Represents the instantiation of a vector in a specific landscape.

```yaml
apiVersion: konfidence.example.com/v1
kind: VectorDeployment
metadata:
  name: app-prod-v1.2.3
spec:
  vector: app-v1.2.3
  landscape: prod-landscape
  stage: production
```

**Key fields:**
- `vector` - Vector being deployed
- `landscape` - Target landscape
- `status` - Deployment status

### StageVersion

Captures the immutable state of a stage at a specific moment.

```yaml
apiVersion: konfidence.example.com/v1
kind: StageVersion
metadata:
  name: prod-v15
spec:
  stage: production
  vector: app-v1.2.3
  timestamp: 2024-01-15T10:30:00Z
```

### VectorAssignment

Creates a logical binding between a VectorDeployment and ArtifactDeployments.

```yaml
apiVersion: konfidence.example.com/v1
kind: VectorAssignment
metadata:
  name: app-prod-assignments
spec:
  vectorDeployment: app-prod-v1.2.3
  artifacts:
    - name: frontend
      deployment: frontend-deploy-123
    - name: backend
      deployment: backend-deploy-123
```

### ArtifactDeployment

Contains deployment information for a specific artifact.

```yaml
apiVersion: konfidence.example.com/v1
kind: ArtifactDeployment
metadata:
  name: frontend-deploy-123
spec:
  artifact: frontend:1.2.3
  configuration:
    replicas: 3
    resources:
      limits:
        memory: 512Mi
```

## Lifecycle CRDs

### VectorMigration

Triggers the migration process in the vector lifecycle.

```yaml
apiVersion: konfidence.example.com/v1
kind: VectorMigration
metadata:
  name: app-mig-v1.2.3
spec:
  vectorDeployment: app-prod-v1.2.3
  tasks:
    - name: migrate-db
      type: database-migration
```

### VectorActivation

Triggers the activation process, designating traffic assignment.

```yaml
apiVersion: konfidence.example.com/v1
kind: VectorActivation
metadata:
  name: app-activate-v1.2.3
spec:
  vectorDeployment: app-prod-v1.2.3
  trafficWeight: 100
```

## Configuration patterns

### Common specifications

All Konfidence CRDs support:

- Standard Kubernetes metadata
- Labels and annotations
- Owner references and finalizers
- Status conditions and phase fields

### Status tracking

Each resource tracks:

- Current phase (Pending, Running, Succeeded, Failed)
- Conditions with last transition time
- Observed generation for change detection
- Resource metrics and statistics

## See also

- [Glossary](/docs/reference/glossary) - CRD terminology
- [CLI reference](/docs/reference/cli) - Managing CRDs via CLI

