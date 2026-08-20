---
title: Managing Projects
description: Create and configure Projects to organize teams and control access with role-based permissions.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Managing Projects

## Overview

Projects provide organizational boundaries and access control for Konfidence deployments. Each project automatically creates a dedicated namespace that contains Landscape resources as well as other project-scoped resources like VectorTemplate and VectorPromotionConfig.

## Creating a Project

Projects are **cluster-scoped** resources. Create one per application or organizational unit:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Project
metadata:
  name: ecommerce-platform
spec:
  displayName: E-Commerce Platform
```

This creates:
- A Project resource named `ecommerce-platform`
- A project namespace: `kden-p-ecommerce-platform`

After creating the Project, check its status to ensure the namespace was successfully created.
Look for a `Ready` condition with status `True`.

```bash
kubectl get project ecommerce-platform -o jsonpath='{.status.conditions[?(@.type=="Ready")]}'
```

For full CRD specification details, see the [Project CRD Reference](/docs/reference/crd#project).

## Role-Based Access Control

Projects define access control via `roleBindings`. Roles can be granted to both interactive users (via session subjects) and workload identities like CI/CD pipelines (via JWKS subjects). 

### Example with Session and JWKS Subjects

```yaml
spec:
  roleBindings:
    admin:
      # Interactive users from identity provider groups
      - session:
          memberOf:
            - platform-admins
      # CI/CD pipeline from main branch
      - jwks:
          endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
          audience: https://github.com/konfidence-project
          claims:
            sub: repo:my-org/ecommerce-platform:ref:refs/heads/main
    dev:
      # Developers from identity provider groups
      - session:
          memberOf:
            - ecommerce-developers
      # Feature branch CI/CD pipelines
      - jwks:
          endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
          audience: https://github.com/konfidence-project
          claims:
            sub: repo:my-org/ecommerce-platform:*
```

This configuration grants the `admin` role to platform administrators and the main branch CI/CD pipeline, while the `dev` role goes to developers and feature branch pipelines.

See [Access Control](/docs/deploy-operate/access-control) for complete details about roles, permissions, and identity sources.

## Next Steps

- [Managing Landscapes](/docs/deploy-operate/landscapes): Create deployment environments within your project
- [Access Control](/docs/deploy-operate/access-control): Configure detailed RBAC policies
