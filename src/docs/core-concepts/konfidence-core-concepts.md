---
title: Konfidence Core Concepts
description: Reference guide for Konfidence's core concepts. Understand the building blocks of this framework.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Konfidence Core Concepts

Konfidence makes software delivery safe, consistent, and scalable. It manages complexity by breaking the deployment process into clear, distinct parts.

This section explains the main building blocks of Konfidence. You will learn the terminology, the architecture, and how these pieces interact to ship your software.

## System Architecture

Konfidence uses a split architecture. This keeps your central management secure while allowing your applications to run anywhere.

### Global Control Plane (GCP)

The Global Control Plane is the primary interface for your project. It manages the delivery process but does not touch your servers directly.

* **Definition:** A centralized service that defines and distributes the desired state (Vectors and Stages) for all connected environments.
* **Role:** It acts as the "Single Source of Truth" for your software delivery. It receives status updates but never sends commands directly into the clusters, ensuring security.

### Local Control Plane (LCP)

The Local Control Plane is a runtime orchestrator that lives inside your target environment (typically a Kubernetes cluster).

* **Definition:** A local service that pulls configurations from the Global Control Plane and applies them to the cluster.
* **Role:** It executes the actual deployment work. By using a *pull model* (connecting outbound to the manager), it allows you to deploy securely without opening firewalls for inbound traffic.

## Defining Your Application

Before you deploy software, you must define it. Konfidence uses strict versioning to ensure consistency.

### Artifact

An Artifact describes a single piece of your software, such as a microservice or a configuration file.

* **Definition:** A versioned object that contains a reference to a build result (like a Docker image) and its metadata.
* **Role:** It serves as a pointer. It does not contain the binary itself but tells Konfidence exactly where to find it and how to use it.

### Vector

A Vector is a complete, immutable snapshot of your entire application at a specific point in time.

* **Definition:** A fixed collection of Artifacts that belong together, representing exactly one version of the application.
* **Role:** It guarantees consistency. Because it is immutable, it ensures that the exact combination of services you tested in QA is the same combination that deploys to Production.

## Managing Environments

These concepts describe the physical and logical targets where your software runs.

### Landscape

A Landscape is the actual place where deployments happen.

* **Definition:** A logical grouping of deployment targets, represented in Konfidence by a Kubernetes Namespace.
* **Role:** It provides the isolated infrastructure context (like "Production Cluster EU") where the Local Control Plane executes the deployments.

### Stage

A Stage represents a specific step in your delivery process, such as `Build`, `Test`, or `Release`.

* **Definition:** A Kubernetes Custom Resource (CRD) that maps a specific Vector to a specific Landscape.
* **Role:** It acts as a checkpoint. It controls exactly which version of the application (Vector) is currently approved and active in a specific environment.

## Orchestration & Runtime

### StageVersion

Because Stages change over time (e.g., updating `Test` from Vector v1 to v2), Konfidence needs to handle these transitions safely.

* **Definition:** A resource that captures the immutable state of a Stage at a specific moment in time.
* **Role:** It tracks history. This allows the system to manage the rollout of a new version safely while keeping a record of the previous state for potential rollbacks.

### VectorAssignment

This concept connects the abstract deployment plan to the concrete resources in the cluster.

* **Definition:** A resource that creates a logical binding between a VectorDeployment and specific ArtifactDeployments.
* **Role:** It manages efficiency. Since multiple Vectors often reuse the same Artifacts, this assignment ensures the system knows exactly which artifacts belong to the current deployment without duplicating them.

### Deployer

The Deployer is the tool that translates Konfidence instructions into reality.

* **Definition:** A specific controller responsible for executing the deployment of individual artifacts for a specific runtime (like Kubernetes).
* **Role:** It performs the low-level technical work. It reads the ArtifactDeployment instructions and creates the necessary resources (like Pods and Services) in the cluster.

## Putting It All Together: The Workflow

Here is the step-by-step flow of a deployment in Konfidence:

1.  **Build:** Your CI pipeline builds code and registers **Artifacts**.
2.  **Assemble:** Konfidence groups these Artifacts into a new **Vector**.
3.  **Promote:** You assign this Vector to a **Stage** (like `Dev`).
4.  **Pull:** The **Local Control Plane** detects the change and pulls the new configuration.
5.  **Snapshot:** The system creates a **StageVersion** to track this specific rollout.
6.  **Reconcile:**
    * **Deployers** start the necessary Artifacts.
    * **VectorAssignments** link these artifacts to the current vector.
    * **Tasks** (like migrations) prepare the data.
7.  **Activate:** Once everything is ready, traffic switches to the new version, and the dashboard updates.


