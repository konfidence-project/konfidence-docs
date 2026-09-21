---
title: Grant roles
description: Bind the admin, pm, and dev roles of a project to identity provider groups and to workload identities.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Grant roles

Bind project roles to the people and workloads that use a project. Konfidence enforces role-based access control at the project level through the `roleBindings` field of the `Project` resource. A binding applies to every resource in the project, including its landscapes.

::: warning Direct Kubernetes access bypasses authorization
The Konfidence API server enforces the role bindings, not Kubernetes RBAC. Anyone with `kubectl` access to a project or landscape namespace bypasses them. Give users access through the Konfidence API only. A team that needs direct Kubernetes access runs its own Konfidence installation.
:::

## Three roles cover administration, delivery, and observation

| Role | Permissions | Typical holders |
|------|-------------|-----------------|
| `admin` | Full control over project resources, including `roleBindings` and the project lifecycle | Platform team, DevOps engineers |
| `pm` | Manage the delivery process: promotion flows, stage configuration, promotion approvals | Product managers, release managers |
| `dev` | Read deployment status, logs, artifact and vector details | Developers, CI pipelines with read access |

## Prerequisites

- A [project](./projects.md).
- The `admin` role in that project, or `kubectl` access to edit `Project` resources.
- The group names your identity provider puts into the session, or the OIDC details of the workload.

## Bind a role to identity provider groups

A session subject matches an interactively signed-in user by group membership:

```yaml
spec:
  roleBindings:
    admin:
      - session:
          memberOf:
            - platform-admins
```

A user holds the role when they are a member of any listed group. Apply the change with `kubectl edit project <NAME>`.

## Bind a role to a workload identity

A `jwks` subject matches a workload, such as a CI pipeline, that presents an OIDC token signed by a trusted provider. The API server verifies the token against the provider's JSON Web Key Set (JWKS). [Grant CI pipelines access](./grant-ci-access.md) covers the binding and the token request for GitHub Actions, GitLab.com, and SPIRE.

## Combine subjects on one role

A role accepts several subjects. A caller holds the role when any subject matches:

```yaml
spec:
  roleBindings:
    dev:
      - session:
          memberOf:
            - my-product-developers
      - jwks:
          endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
          audience: https://konfidence.example.com/api
          claims:
            sub: repo:my-org/my-repo:*
```

## Verify a binding

Sign in as a member of the group and list the projects the API grants you:

```bash
kden login
kden project list
```

The project appears in the list. For a workload token, call the identity endpoint with the token instead:

```bash
curl --header "Authorization: Bearer $TOKEN" https://konfidence.example.com/api/v1/identity
```

The response lists the project under `projectRoles` with the granted role.

For the full field list, see the [Project CRD reference](/docs/reference/crd#project).

## Next steps

- [Grant CI pipelines access](./grant-ci-access.md) binds a role to a CI workflow.
- [Manage landscapes](./landscapes.md) creates landscapes governed by these roles.
