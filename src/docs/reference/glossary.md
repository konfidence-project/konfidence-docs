---
title: Glossary
description: Definitions of the Konfidence terms and custom resources used in this documentation.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Glossary

The glossary defines the Konfidence terms used in this documentation. Each entry lists the pages that use the term.

## Concepts describe the delivery model

### Artifact

An artifact is one deployable piece of your application, such as a microservice. Konfidence packages it as an Open Component Model (OCM) component version.

The artifact contains a manifest and a reference to the build result, such as a container image. It can also include binary resources directly. The manifest names the [deployment class](#deployment-class) the artifact requires. It also states whether one running instance may serve several vectors.

Continuous integration (CI) pipelines publish artifacts to an OCM-compliant repository, such as an Open Container Initiative (OCI) registry.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Advanced features](../develop-integrate/advanced-features/index.md)
- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Author a Kustomize artifact](../develop-integrate/artifact-types/kustomize.md)
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md)
- [Configure signing and verification](../develop-integrate/advanced-features/configure-signing-and-verification.md)
- [Core concepts](../core-concepts/index.md)
- [Create your own artifacts](../getting-started/create-vector.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Deployment model](../core-concepts/deployment-model.md)
- [Develop & Integrate](../develop-integrate/index.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Local development](../extend-customize/local-development.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage landscapes](../deploy-operate/landscapes.md)
- [Manage stages](../deploy-operate/stages.md)
- [Observe & Deliver](../develop-integrate/observe-improve/index.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::

### Artifact alias

An artifact alias is a dynamic reference that tells Konfidence which artifact flavor to include when it assembles a vector. It gives a stable name to a moving target, such as the current main-branch build of a service. An alias does not replace the semantic version of the artifact.

::: details Pages that use this term

- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::

### Control plane

The control plane manages the delivery process and executes it in landscapes. It has two roles:

- Delivery management defines which vectors exist and which vector each stage selects.
- Runtime orchestration turns that stage state into deployments.

The control plane runs as one binary, installed from one Helm chart. In the current release, the control plane, the landscape orchestrator, and your workloads share one Kubernetes cluster.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Installation variants](../deploy-operate/installation-variants.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [System Architecture](../deploy-operate/system-architecture.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### Delivery flow

The delivery flow is the path from published artifacts to the vector each stage selects. It has four phases: build, assemble, assign, and promote. Deployment in a landscape starts after the delivery flow ends.

::: details Pages that use this term

- [Core concepts](../core-concepts/index.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Manage stages](../deploy-operate/stages.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::

### Deployer

A deployer is a platform-specific controller that deploys artifacts of the deployment classes it provides. It reconciles [ArtifactDeployment](#artifactdeployment) resources and turns their deployable content into running workloads. It also takes part in platform-specific migration and activation work.

The current release provides one deployer for Kubernetes, installed with the [landscape orchestrator](#landscape-orchestrator).

::: details Pages that use this term

- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Author a Kustomize artifact](../develop-integrate/artifact-types/kustomize.md)
- [Core concepts](../core-concepts/index.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deployment model](../core-concepts/deployment-model.md)
- [Installation variants](../deploy-operate/installation-variants.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Local development](../extend-customize/local-development.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### Deployment class

A deployment class is a named capability for deploying one kind of artifact, such as Helm or Kustomize. A deployer advertises each class it provides with a cluster-scoped `DeploymentClass` resource.

The class name follows the pattern `<class-name>.<vendor-domain>`, for example `helm.konfidence.cloud`. The `type` field of the artifact manifest names the class the artifact requires.

::: details Pages that use this term

- [Deployment model](../core-concepts/deployment-model.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage stages](../deploy-operate/stages.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)

:::

### Deployment result

A deployment result is one output that a deployer produces while it deploys an artifact. Examples are service endpoints, generated URLs, identities, and allocated resources. Konfidence passes deployment results to the landscape as part of [vector data](#vector-data).

::: details Pages that use this term

- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Quickstart](../getting-started/quickstart.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)

:::

### Deployment target

A deployment target makes one deployment class available in one landscape. It holds the connection information the responsible deployer needs, such as credentials. A landscape has one deployment target per deployment class. The `DeploymentTarget` resource lives in the landscape namespace.

::: details Pages that use this term

- [Deployment model](../core-concepts/deployment-model.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage stages](../deploy-operate/stages.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)

:::

### Feature flag

A feature flag is a named value in the [vector configuration](#vector-configuration) that toggles behavior in your application. Konfidence scopes feature flags to a vector and adds no targeting, variants, or rules. Changing a flag creates a new vector version. Applications read flags through the [vector data service](#vector-data-service).

::: details Pages that use this term

- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Add configuration to a vector](../develop-integrate/vector-data/vector-configuration.md)
- [Advanced features](../develop-integrate/advanced-features/index.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)

:::

### Landscape

A landscape is an operational boundary within a project. It groups stages, deployment targets, credentials, and deployment resources that share ownership, security, compliance, or reliability requirements.

Konfidence creates a dedicated Kubernetes namespace for each landscape. Deployment targets connect the landscape to the infrastructure where deployments run.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Author a Kustomize artifact](../develop-integrate/artifact-types/kustomize.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deployment model](../core-concepts/deployment-model.md)
- [Installation variants](../deploy-operate/installation-variants.md)
- [Installing Konfidence](../deploy-operate/konfidence-installation.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Manage deployers](../deploy-operate/deployer/overview.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage landscapes](../deploy-operate/landscapes.md)
- [Manage stages](../deploy-operate/stages.md)
- [Managing Projects](../deploy-operate/projects.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [System Architecture](../deploy-operate/system-architecture.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### Landscape orchestrator

The landscape orchestrator executes deployments in a landscape. The Kubernetes landscape orchestrator has its own Helm chart and installs the Kubernetes deployer. It also passes vector data to the landscape as `ConfigMap` resources.

::: details Pages that use this term

- [Installation variants](../deploy-operate/installation-variants.md)
- [Installing Konfidence](../deploy-operate/konfidence-installation.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Quickstart](../getting-started/quickstart.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)

:::

### Project

A project provides the organizational boundary and access control for Konfidence resources. Each project owns a dedicated namespace, `kden-p-<project-name>` by default. That namespace holds the project's landscapes, vector templates, and promotion configurations.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Configure signing and verification](../develop-integrate/advanced-features/configure-signing-and-verification.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Local development](../extend-customize/local-development.md)
- [Manage landscapes](../deploy-operate/landscapes.md)
- [Managing Projects](../deploy-operate/projects.md)

:::

### Promotion

A promotion selects a concrete, immutable vector for a target stage by updating the stage's desired vector. It does not rebuild, copy, or change the vector. Each promotion records which vector reached which stage.

A [VectorPromotionConfig](#vectorpromotionconfig) defines a promotion flow. A [VectorPromotion](#vectorpromotion) runs it once. In the current release, you trigger promotions manually.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Define promotions](../deploy-operate/define-promotions.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy & Operate](../deploy-operate/index.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Quickstart](../getting-started/quickstart.md)

:::

### Stage

A stage is a logical checkpoint in the delivery flow, such as development, integration, or production. It selects exactly one desired vector at a time. Stage names describe the purpose of the checkpoint, not the infrastructure behind it.

Each stage belongs to a landscape and uses the deployment targets configured there. Stages in one landscape can share deployments of artifacts they have in common. The `Stage` custom resource holds the selected vector.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md)
- [Core concepts](../core-concepts/index.md)
- [Create your own artifacts](../getting-started/create-vector.md)
- [Define promotions](../deploy-operate/define-promotions.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Deployment model](../core-concepts/deployment-model.md)
- [Installation variants](../deploy-operate/installation-variants.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage landscapes](../deploy-operate/landscapes.md)
- [Manage stages](../deploy-operate/stages.md)
- [Observe & Deliver](../develop-integrate/observe-improve/index.md)
- [System Architecture](../deploy-operate/system-architecture.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::

### Vector

A vector is a complete, immutable version of your application. It is an OCM component version that references a fixed set of artifacts and an optional vector configuration.

Any change to an artifact reference or to the configuration creates a new vector. Stages select vectors, and promotions move them between stages.

::: details Pages that use this term

- [Access Control (RBAC)](../deploy-operate/access-control.md)
- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Add configuration to a vector](../develop-integrate/vector-data/vector-configuration.md)
- [Advanced features](../develop-integrate/advanced-features/index.md)
- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Author a Kustomize artifact](../develop-integrate/artifact-types/kustomize.md)
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md)
- [Configure signing and verification](../develop-integrate/advanced-features/configure-signing-and-verification.md)
- [Core concepts](../core-concepts/index.md)
- [Create your own artifacts](../getting-started/create-vector.md)
- [Define promotions](../deploy-operate/define-promotions.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Deployment model](../core-concepts/deployment-model.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Local development](../extend-customize/local-development.md)
- [Manage deployment targets](../deploy-operate/deployment-targets.md)
- [Manage stages](../deploy-operate/stages.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md)
- [Quickstart](../getting-started/quickstart.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [System Architecture](../deploy-operate/system-architecture.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::

### Vector configuration

Vector configuration is data that you add to a vector: feature flags and free-form authored configuration. Konfidence imposes no schema on authored configuration. The vector ID determines its configuration, so changing the configuration creates a new vector.

::: details Pages that use this term

- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Add configuration to a vector](../develop-integrate/vector-data/vector-configuration.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)

:::

### Vector data

Vector data is runtime data that belongs to one vector deployment. It contains the vector configuration and the deployment results of the vector's artifacts. Applications read vector data by vector ID. Vector data is available before the vector is activated.

::: details Pages that use this term

- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)

:::

### Vector data service

The vector data service is a runtime component that serves vector data to workloads in a Kubernetes landscape. It reads vector data from `ConfigMap` resources and provides an OpenFeature-compatible API. An administrator installs it in each landscape namespace.

::: details Pages that use this term

- [Access vector data in your application](../develop-integrate/vector-data/access-vector-data.md)
- [Advanced features](../develop-integrate/advanced-features/index.md)
- [Installing Konfidence](../deploy-operate/konfidence-installation.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Prepare your application](../develop-integrate/prepare-your-application.md)
- [Quickstart](../getting-started/quickstart.md)
- [Read feature flags in your application](../develop-integrate/advanced-features/feature-flags.md)
- [Types of artifacts](../develop-integrate/artifact-types/index.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector data service](../deploy-operate/runtime-components/vector-data-service.md)

:::

## Custom resources implement the concepts

Konfidence represents its concepts as Kubernetes custom resources in the `konfidence.cloud/v1alpha1` API group. The [CRD reference](./crd.md) lists all fields.

### ArtifactDeployment

A custom resource that describes the deployment of one artifact in a landscape. A deployer reconciles it according to the deployment class in the artifact manifest. Several vector deployments in one landscape can reuse one ArtifactDeployment when their vectors share the artifact.

::: details Pages that use this term

- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Author a Kustomize artifact](../develop-integrate/artifact-types/kustomize.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Kubernetes deployer](../deploy-operate/deployer/kubernetes.md)
- [Landscapes and stages](../core-concepts/landscapes-and-stages.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)

:::

### StageVersion

A custom resource that captures one immutable rollout of a stage. It records the selected vector and the stage generation. Stage versions track stage changes over time and let Konfidence switch between vectors without downtime. The stage status names the active stage version.

::: details Pages that use this term

- [Manage stages](../deploy-operate/stages.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### StageVersionUsage

A custom resource that marks a StageVersion as in use and states the reason. It references the StageVersion by name or by label selector. Konfidence keeps the resources of a StageVersion while a StageVersionUsage references it.

::: details Pages that use this term

- [API Reference](./crd.md#stageversionusage)

:::

### VectorActivation

A custom resource that starts the activation of a vector for a stage version. Activation switches live traffic to that vector.

::: details Pages that use this term

- [Manage stages](../deploy-operate/stages.md)

:::

### VectorAssignment

A custom resource that binds one ArtifactDeployment to one VectorDeployment. One artifact deployment can serve several vectors, so vectors and artifact deployments form an n:m relationship. Each VectorAssignment is one edge of that relationship.

The vector deployment controller manages VectorAssignments. Deployers read them to apply vector-specific configuration.

::: details Pages that use this term

- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### VectorDeployment

A custom resource that deploys all artifacts of one vector in a landscape. It references the vector as an OCM component version in an OCI registry. A change to the vector creates a new VectorDeployment instead of updating the existing one.

::: details Pages that use this term

- [Author a Helm artifact](../develop-integrate/artifact-types/helm.md)
- [Configure signing and verification](../develop-integrate/advanced-features/configure-signing-and-verification.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Manage stages](../deploy-operate/stages.md)
- [Vector data overview](../develop-integrate/vector-data/overview.md)
- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md)
- [Use deployment results](../develop-integrate/vector-data/deployment-results.md)
- [Vector Deployments](../deploy-operate/vector-deployments.md)

:::

### VectorPromotion

A custom resource that runs a promotion flow once. It pins the concrete vector when it is created and records the status of the promotion.

::: details Pages that use this term

- [Define promotions](../deploy-operate/define-promotions.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)

:::

### VectorPromotionConfig

A custom resource that defines a promotion flow from a source to a target stage. The source is a VectorTemplate or another stage.

::: details Pages that use this term

- [Create your own artifacts](../getting-started/create-vector.md)
- [Define promotions](../deploy-operate/define-promotions.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Managing Projects](../deploy-operate/projects.md)

:::

### VectorTemplate

A custom resource that defines how Konfidence assembles a vector. It lists the artifact aliases to include and the upload target for the assembled vector. Konfidence assembles the vector from the latest version of each listed component.

::: details Pages that use this term

- [Add configuration to a vector](../develop-integrate/vector-data/vector-configuration.md)
- [Advanced features](../develop-integrate/advanced-features/index.md)
- [Build vectors](../develop-integrate/observe-improve/build-vectors.md)
- [Configure signing and verification](../develop-integrate/advanced-features/configure-signing-and-verification.md)
- [Create your own artifacts](../getting-started/create-vector.md)
- [Delivery Flow](../core-concepts/delivery-flow.md)
- [Deploy a sample application](../getting-started/deliver-sample-app.md)
- [Managing Projects](../deploy-operate/projects.md)
- [Publish artifacts](../develop-integrate/artifact-types/publish-artifacts.md)
- [Vectors and Artifacts](../core-concepts/vectors-and-artifacts.md)

:::
