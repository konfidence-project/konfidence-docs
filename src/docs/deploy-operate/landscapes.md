---
title: Managing Landscapes
description: Create and manage Landscapes as deployment targets for your vectors within Projects.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Managing Landscapes

## Overview

A Landscape represents an environment where you deploy your applications, such as development, staging, or production. When you create a Landscape, Konfidence automatically provisions a dedicated namespace to organize all the deployment resources for that environment. Inside this namespace, you define Stages (your deployment pipelines) and Konfidence manages the resources needed to deploy your applications to the actual infrastructure.

Landscapes can target any platform that has a landscape orchestrator available. Konfidence provides the `kubernetes-landscape-orchestrator` for Kubernetes deployments. Third-party orchestrators may be available for other platforms, or you can build your own custom orchestrator to support additional deployment targets.

The actual deployment targets are configured via **DeploymentTarget** resources created within the landscape namespace.

## Creating a Landscape

Landscapes always belong to a Project, so you must create a Project first. Landscapes are created in the project namespace, and Konfidence automatically generates the landscape namespace based on the project and landscape names.

**Example:**

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: Landscape
metadata:
  name: prod-eu
  namespace: kden-p-ecommerce-platform  # ← Must be a project namespace
spec:
  displayName: Production - EU Region
```

This creates:
- A Landscape resource named `prod-eu` in the project namespace `kden-p-ecommerce-platform`
- A landscape namespace: `kden-l-prod-eu-1ogisnw` (name generated from project and landscape names with hash suffix)

After creating the Landscape, check its status to ensure the namespace was successfully created. Look for a `Ready` condition with status `True`.

```bash
kubectl get landscape prod-eu -n kden-p-ecommerce-platform -o jsonpath='{.status.conditions[?(@.type=="Ready")]}'
```

For full CRD specification details, see the [Landscape CRD Reference](/docs/reference/crd#landscape).

## Deployment Targets

Each landscape can have one or more **DeploymentTarget** resources that define where and how artifacts are deployed. DeploymentTargets reference a **DeploymentClass** (provided by deployer implementations) and include connection details.

### DeploymentClass

Deployers (like `kubernetes-landscape-orchestrator`) install cluster-scoped **DeploymentClass** resources that declare their capabilities. The Kubernetes landscape orchestrator currently supports:

- `konfidence.cloud/helm` - Kubernetes Helm deployments
- `konfidence.cloud/kustomize` - Kubernetes Kustomize deployments

**Example:**

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentClass
metadata:
  name: konfidence.cloud/helm
spec:
  type: konfidence.cloud/helm
  controller: kubernetes-landscape-orchestrator
```

### DeploymentTarget Configuration

Create **DeploymentTarget** resources in your landscape namespace to configure deployment destinations. Here's a Kubernetes example using Helm:

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: kubernetes-helm-prod
  namespace: kden-l-prod-eu-1ogisnw  # Landscape namespace
spec:
  deploymentClass: konfidence.cloud/helm
  connection:
    type: kubeconfig
    ref:
      kind: Secret
      name: prod-cluster-kubeconfig  # Secret containing kubeconfig
```

The `connection` field specifies how to connect to the target infrastructure. For Kubernetes deployments, this typically references a Secret containing a kubeconfig that grants access to the target cluster.

For more deployment target examples and detailed configuration options, see the [DeploymentTarget CRD Reference](/docs/reference/crd#deploymenttarget).

## Next Steps

- [Stages and Promotions](/docs/core-concepts/stages-and-promotions): Deploy vectors to your landscapes
- [Access Control](/docs/deploy-operate/access-control): Control who can manage landscapes
