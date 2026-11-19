---
title: "Konfidence and deployers"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Konfidence and deployers

Konfidence helps your team deliver the same tested application version across environments. It combines versioned **artifacts** into an immutable **vector**, records which vector each **stage** selects, and coordinates deployment and promotion.

A **deployer** performs the work for a target platform. The currently documented deployer is the **Kubernetes landscape orchestrator (KLO)**. It deploys Helm and Kustomize artifacts through Flux and provides Kubernetes runtime integrations.

## Follow an application version

<DeliveryPath />

Your CI pipeline builds the services. Konfidence assembles their artifacts into a vector. Selecting that vector for a stage starts deployment. Promoting it selects the same version for the next stage, where deployment runs again.

## Know which part you are configuring

| Task | Konfidence core | Kubernetes landscape orchestrator |
| --- | --- | --- |
| Define the application version | Artifacts, immutable vectors, and vector configuration | Helm and Kustomize packaging requirements |
| Select a destination | Projects, landscapes, stages, and deployment targets | Kubernetes target parameters |
| Deploy the version | Coordinate the deployment lifecycle | Create Flux resources and report deployment results |
| Supply application data | Aggregate configuration and results into vector data | Materialize ConfigMaps for the vector data service |
| Activate the version | Coordinate activation and record active stage state | Update stage HTTPRoutes |

Konfidence itself runs on Kubernetes. Its hosting platform and the target platform implemented by a deployer are separate responsibilities. Core resource guides therefore also use Kubernetes manifests and `kubectl`.

## Understand the shared model

- [Artifacts and vectors](./artifacts-and-vectors.md): what belongs to an application version.
- [Landscapes and stages](./landscapes-and-stages.md): operational boundaries and delivery checkpoints.
- [Delivery flow](./delivery-flow.md): how published artifacts become selected stage state.
- [Deployment model](./deployment-model.md): how artifact types, deployers, and targets connect.
- [Vector data](./vector-data.md): configuration and results associated with a vector.

To try the complete setup, follow the [Quickstart](../start/quickstart.md). To integrate an application with Kubernetes, use the [Kubernetes deployer guides](../deployers/index.md#kubernetes).
