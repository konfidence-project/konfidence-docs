---
title: Manage projects
description: Create a project, verify its namespace, and grant the first role binding so a team can use it.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Manage projects

Create a project to give a team its own space in Konfidence. A project owns a namespace that holds its landscapes, vector templates, and promotion configurations. Everything in the project is accessed through the project's role bindings.

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

A new project has no role bindings, so nobody can use it through the Konfidence API. Add them in `spec.roleBindings` as described in [Grant roles](./access-control.md).

For the full field list, see the [Project CRD reference](/docs/reference/crd#project).

## Next steps

- [Grant roles](./access-control.md) binds `pm` and `dev` roles to the teams that work in the project.
- [Manage landscapes](../manage-delivery/landscapes.md) creates the first landscape inside the project.
