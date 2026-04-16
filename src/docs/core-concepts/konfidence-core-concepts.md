---
title: Konfidence core concepts
description: Reference guide for Konfidence's core concepts. Understand the building blocks of this framework.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Konfidence core concepts

Konfidence makes software delivery safe, consistent, and scalable. It manages complexity by breaking the deployment process into clear, distinct parts.

This section explains the main building blocks of Konfidence. You will learn the terminology, the architecture, and how these pieces interact to ship your software.

## System architecture

Konfidence uses a split architecture. This keeps your central management secure while allowing your applications to run anywhere.

<DrawioDiagram src="/assets/diagrams/konfidence-architecture.drawio" />

### Galaxy

The galaxy is the primary interface for your project. It manages the delivery process but does not touch your target environments directly.

* **Definition:** As the global control plane, the galaxy defines and distributes the desired state for multiple stars.
* **Role:** It assembles, validates, and dispatches deployment configurations, such as software versions and stage resources. The galaxy receives status updates but never sends commands directly into the clusters, ensuring security.

### Star

A star is a local runtime orchestrator that lives close to your target environment (typically a Kubernetes cluster).

* **Definition:** A local operator that pulls configurations from the galaxy and applies them to the cluster.
* **Role:** The star manages and executes software deployments in one or more environments based on a specific target state, such as a stage resource. By using a *pull model* (connecting outbound to the manager), it allows you to deploy securely without opening firewalls for inbound traffic.

### Landscape

A landscape is the actual place where deployments happen.

* **Definition:** The physical or virtual infrastructure where your software runs. Usually, this is a Kubernetes cluster or a CloudFoundry space. However, it can also be a CDN provider, a functional runtime, or a bare-metal machine.
* **Role:** It provides the foundation for your applications. Konfidence does not manage the landscape itself; you must provide the underlying infrastructure. Each landscape belongs to one star, which manages all deployments there. You can set up multiple landscapes for different purposes (like testing vs. production) or for different geographical regions (like EU vs. US).

## Defining your application

Before you deploy software, you must define it. Konfidence uses strict versioning to ensure consistency and builds heavily on the Open Component Model (OCM) to package and describe these definitions. 

### Artifact

An artifact describes a single piece of your software, such as a microservice, a configuration file, or an asset. Developers usually maintain their own artifacts. 
They build and push them during the publish or release stages of their CI/CD pipelines.

* **Definition:** An OCM component version that contains a reference to a build result (like a Docker image) and its metadata.
* **Role:** It tells Konfidence exactly what to deploy. An artifact serves as a pointer but can also contain the actual binary resources directly.  
*(To learn how to create these components, see the [OCM guide on creating component versions](https://ocm.software/docs/getting-started/create-component-versions/).)*

### Vector

A vector is a complete, immutable snapshot of your entire application at a specific point in time. While developers create artifacts, the global control plane usually composes the vectors.

* **Definition:** An OCM component with a fixed collection of artifacts that belong together, representing exactly one version of the application.
* **Role:** It guarantees consistency. Because it is immutable, it ensures that the exact combination of services you tested is the exact combination you deploy. You can define multiple vectors for different purposes. For example:
    * One vector for production (with only stable features).
    * One vector for previews (with experimental features).
    * One vector focused only on a specific team's services.


### Stage

A stage represents a specific step in your delivery process, such as `Development`, `Test`, or `Production`.
As opposed to a landscape (which is physical), a stage is the logical deployment target for a vector.

* **Definition:**  A Kubernetes custom resource (CRD) that acts as a checkpoint. It maps one specific vector to a specific landscape.
* **Role:** Stages allow you to validate changes progressively and test use cases independently. Common use cases include:
    * One stage for the main production deployment.
    * Separate stages for testing different feature sets.
    * One stage per team, running only that team's services.
    * Dedicated stages for load testing or security audits.

<!-- 
I have commented out this part for now because, as Karsten pointed out, it does not address the core concepts of Konfidence; rather, it provides more detail about how Konfidence works. While this information will be useful to extension developers who want to create their own runtime, it is not relevant to “normal” Konfidence users. In due time, this section can be moved to the appropriate place in the documentation.


## Orchestration & Runtime

### StageVersion

Because stages change over time (e.g., updating `Test` from vector v1 to v2), Konfidence needs to handle these transitions safely.

* **Definition:** A resource that captures the immutable state of a stage at a specific moment in time.
* **Role:** It tracks history. This allows the system to manage the rollout of a new version safely while keeping a record of the previous state for potential rollbacks.

### VectorAssignment

* **Definition:** A resource that creates a logical binding between a vectorDeployment and specific artifactDeployments.
* **Role:** It manages efficiency. Since multiple vectors often reuse the same artifacts, this assignment ensures the system knows exactly which artifacts belong to the current deployment without duplicating them.

### Deployer

The Deployer is the tool that translates Konfidence instructions into reality.

* **Definition:** A specific controller responsible for executing the deployment of individual artifacts for a specific runtime (like Kubernetes).
* **Role:** It performs the low-level technical work. It reads the artifactDeployment instructions and creates the necessary resources (like Pods and Services) in the cluster. -->

## Putting it all together: the workflow

Here is the step-by-step flow of a deployment in Konfidence:

1.  **Build:** Your CI pipeline builds code and publishes **artifacts**.
2.  **Assemble:** Konfidence groups these artifacts into a new **vector**.
3.  **Promote:** You assign this vector to a **stage** (like `Development`).
4.  **Pull:** The **star** detects the change and pulls the new configuration.
5.  **Snapshot:** The system creates a **stageVersion** to track this specific rollout.
6.  **Vector lifecycle begins:**
    * **Deployers** deploy the necessary artifacts.
    * **VectorAssignments** link these artifacts to the current vector.
    * **Tasks** (like migrations) prepare the data.
7.  **Activate:** Once everything is ready, traffic switches to the new version, and you can track the entire flow in the delivery dashboard.


