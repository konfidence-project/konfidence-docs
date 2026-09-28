---
title: Create a project
description: Create a project, verify its namespace, and grant the first role binding so a team can use it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Create a project {#manage-projects}

Create a project to organize landscapes, vector templates, and promotion configurations in a dedicated namespace. You can assign a project to a team and grant its members access through project roles.

The creation steps use cluster-level Kubernetes permissions. After creation, role bindings control access through the Konfidence API; they do not grant Kubernetes permissions.

## Prerequisites

- Access to the Konfidence cluster through `kubectl` with permission to create `Project` resources. Projects are cluster-scoped.
- A project name that is a valid DNS label. Konfidence derives the namespace name from it.

## Create the project

Save the following manifest as `project.yaml`:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Project
metadata:
  name: ecommerce-platform
spec:
  displayName: E-Commerce Platform
```

Apply it:

```bash
kubectl apply -f project.yaml
```

The command prints `project.konfidence.cloud/ecommerce-platform created`.

## Verify the namespace

Konfidence creates the namespace `kden-p-ecommerce-platform` and reports it in the project's `Ready` condition:

```bash
kubectl get project ecommerce-platform \
  --output=jsonpath='{.status.conditions[?(@.type=="Ready")].status}{"\n"}'
```

The command prints `True`. Confirm the namespace exists:

```bash
kubectl get namespace kden-p-ecommerce-platform
```

## Grant access

A new project has no role bindings, so nobody can use it through the Konfidence API. Add them in `spec.roleBindings` as described in [Grant teams access to a project](./access-control.md).

For the full field list, see the [Project CRD reference](/docs/reference/crd#project).

## Next steps

- [Grant teams access to a project](./access-control.md) binds project roles to the groups that use it.
- [Grant CI pipelines access](./grant-ci-access.md) gives automation a project role through its workload identity.
- [Create a landscape](../manage-delivery/landscapes.md) prepares the first delivery environment inside the project using Kubernetes permissions.
