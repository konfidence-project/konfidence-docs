---
title: Access Control (RBAC)
description: Configure role-based access control for Projects using session and workload identities.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Access Control (RBAC)

## Overview

Konfidence provides **role-based access control (RBAC)** for Projects via the `roleBindings` field. Access control is defined at the Project level and applies to all resources within that Project, including Landscapes.

::: warning Direct Kubernetes Access Bypasses Authorization
Because authorization rules are enforced by the Konfidence API server (not Kubernetes RBAC), granting direct `kubectl` access to project or landscape namespaces **bypasses the authorization layer entirely**.

Users must access project resources through the Konfidence API server. Teams requiring direct Kubernetes access should run their own Konfidence installation rather than share the managed control plane.
:::

## Built-in Roles

Projects support three built-in roles with different permission levels:

| Role | Permissions | Typical Users |
|------|-------------|---------------|
| `admin` | Full control over project resources, including `roleBindings` and project lifecycle | Platform team, DevOps engineers |
| `pm` | Manage delivery process: promotion flows, stage configuration, approve promotions. | Product managers, release managers |
| `dev` | Read-only / observability: deployment status, logs, artifact and vector details. | Developers, CI/CD pipelines (read access) |

## Identity Sources

Roles can be granted to two types of identities:

### Session Subjects (Interactive Users)

Session subjects match **interactive users** authenticated via an identity provider by group membership.

**Example:**

```yaml
roleBindings:
  admin:
    - session:
        memberOf:
          - platform-admins
```

Session subjects match users by **group membership** using OR logic. A user holds a role if they are a member of **any** of the specified groups.

### JWKS Subjects (Workload Identities)

JWKS subjects match **workload identities** presenting OIDC tokens signed by a trusted provider. This mechanism supports any OIDC-compliant identity provider, including GitHub Actions, GitLab CI, SPIRE, Azure AD, Keycloak, AWS IAM, and custom identity solutions, as long as trust is established via the OIDC discovery endpoint.

**Example:**

```yaml
roleBindings:
  dev:
    - jwks:
        endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
        audience: https://github.com/konfidence-project
        claims:
          sub: repo:my-org/my-repo:*
          ref: refs/heads/main
```

This grants the `dev` role to GitHub Actions workflows that:
- Are from repository `my-org/my-repo` (any workflow file)
- AND run on the `main` branch
- AND present a token with audience `https://konfidence.example.com/api`

### Multiple Subjects

Each role can have **multiple subjects** with OR semantics:

```yaml
roleBindings:
  dev:
    - session:
        memberOf:
          - my-product-developers
    - jwks:
        endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
        audience: https://github.com/konfidence-project
        claims:
          sub: repo:my-org/my-repo:*
```

A caller holds the `dev` role if:
- They are a member of `my-product-developers` **OR**
- They present a valid GitHub Actions token from `my-org/my-repo`

For complete CRD specification details, see the [Project CRD Reference](/docs/reference/crd#project).

## Next Steps

- [Managing Projects](/docs/deploy-operate/projects): Create projects with role bindings
- [Managing Landscapes](/docs/deploy-operate/landscapes): Control landscape access via project roles
