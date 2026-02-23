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

The Global Control Plane is the primary interface for your project. It manages the delivery process but does not touch your target environments directly.

* **Definition:** A centralized service that defines and distributes the desired state (Vectors and Stages) for all connected environments.
* **Role:** It acts as the "Single Source of Truth" for your software delivery. It receives status updates but never sends commands directly into the clusters, ensuring security.

### Local Control Plane (LCP)

The Local Control Plane is a runtime orchestrator that lives close to your target environment (typically a Kubernetes cluster).

* **Definition:** A local operator that pulls configurations from the Global Control Plane and applies them to the cluster.
* **Role:** It manages the vector lifecycle, consisting of deployment, migration and activation. By using a *pull model* (connecting outbound to the manager), it allows you to deploy securely without opening firewalls for inbound traffic.

### Landscape

A Landscape is the actual place where deployments happen. Infrastructure administrators usually manage Landscapes.

* **Definition:** The physical or virtual infrastructure where your software runs. Usually, this is a Kubernetes cluster or a CloudFoundry space. However, it can also be a CDN provider, a functional runtime, or a bare-metal machine.
* **Role:** It provides the foundation for your applications. Konfidence does not manage the Landscape itself; you must provide the underlying infrastructure. Each Landscape belongs to one Local Control Plane, which manages all deployments there. You can set up multiple Landscapes for different purposes (like Testing vs. Production) or for different geographical regions (like EU vs. US).

## Defining Your Application

Before you deploy software, you must define it. Konfidence uses strict versioning to ensure consistency and builds heavily on the Open Component Model (OCM) to package and describe these definitions. 

### Artifact

An Artifact describes a single piece of your software, such as a microservice, a configuration file, or an asset. Developers usually maintain their own Artifacts. 
They build and push them during the publish or release stages of their CI/CD pipelines.

* **Definition:** An OCM component version that contains  a reference to a build result (like a Docker image) and its metadata.
* **Role:** It tells Konfidence exactly what to deploy.   An Artifact serves as a pointer but can also contain the actual binary resources directly.  
*(To learn how to create these components, see the [OCM guide on creating component versions](https://ocm.software/docs/getting-started/create-component-versions/).)*

### Vector

A Vector is a complete, immutable snapshot of your entire application at a specific point in time. While developers create Artifacts, the Global Control Plane usually composes the Vectors.

* **Definition:** An OCM component with a fixed collection of Artifacts that belong together, representing exactly one version of the application.
* **Role:** It guarantees consistency. Because it is immutable, it ensures that the exact combination of services you tested is the exact combination you deploy. You can define multiple Vectors for different purposes. For example:
    * One Vector for Production (with only stable features).
    * One Vector for Previews (with experimental features).
    * One Vector focused only on a specific team's services.


### Stage

A Stage represents a specific step in your delivery process, such as `Development`, `Test`, or `Release`.
As opposed to a Landscape (which is physical), a Stage is the logical deployment target for a Vector.

* **Definition:**  A Kubernetes Custom Resource (CRD) that acts as a checkpoint. It maps one specific Vector to a specific Landscape.
* **Role:** Stages allow you to validate changes progressively and test use cases independently. Common use cases include:
    * One Stage for the main Production deployment.
    * Separate Stages for testing different feature sets.
    * One Stage per team, running only that team's services.
    * Dedicated Stages for load testing or security audits.

<!-- 
I have commented out this part for now because, as Karsten pointed out, it does not address the core concepts of Konfidence; rather, it provides more detail about how Konfidence works. While this information will be useful to extension developers who want to create their own runtime, it is not relevant to “normal” Konfidence users. In due time, this section can be moved to the appropriate place in the documentation.


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
* **Role:** It performs the low-level technical work. It reads the ArtifactDeployment instructions and creates the necessary resources (like Pods and Services) in the cluster. -->

## Putting It All Together: The Workflow

Here is the step-by-step flow of a deployment in Konfidence:

1.  **Build:** Your CI pipeline builds code and publishes **Artifacts**.
2.  **Assemble:** Konfidence groups these Artifacts into a new **Vector**.
3.  **Promote:** You assign this Vector to a **Stage** (like `Development`).
4.  **Pull:** The **Local Control Plane** detects the change and pulls the new configuration.
5.  **Snapshot:** The system creates a **StageVersion** to track this specific rollout.
6.  **Vector lifecycle begins:**
    * **Deployers** deploy the necessary Artifacts.
    * **VectorAssignments** link these artifacts to the current vector.
    * **Tasks** (like migrations) prepare the data.
7.  **Activate:** Once everything is ready, traffic switches to the new version, and you can track the entire flow in the delivery dashboard.


