---
title: Quickstart
description: Get started with Konfidence in minutes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Before you begin

requirements: 
* an OCI registry to store artifacts
* a running k8s cluster 
  - flux installed
  - gateway API installed (preferably istio controllers)
* clone sample-app/quickstart repo: github.com/konfidence-project/example-app

# Installation

* helm install konfidence-galaxy (+ configuration?)
* helm install konfidence-star (+ configuration?)

very simplistic setup:
* control planes installed on a single cluster
* deploy workloads to same cluster

production-grade setup will involve multiple clusters

# Example application

* based on istio examples, pure k8s deployments
* product-page / reviews / details 
* ratings not included in quickstart because of external database dependency

# Define your Delivery Flow

summary:
* start with dev and production stage
* vectors are assembled and automatically deployed to dev stage 
* manual promotion brings vectors to production stage

steps:
* create a VectorTemplate using example app artifacts, publish a dev vector
* create a StageConfig assigning the dev vector to the dev stage
* define a VectorPromotion that uses dev vector as source and production vector as destination
* create a StageConfig assigning the production vector to the production stage
* apply all resources with `kubectl apply -f <resource>.yaml`

what happened so far:
* delivery flow defined, but no artifacts created yet
* no vector can be created, because referenced artifacts do not yet exist

# Build your first Artifacts

steps:
* publish app artifacts with kden CLI: `kden artifact push -f component-constructor.yaml`
* check VectorTemplate status: `kubectl get vectortemplate vector-dev`
* first vector should be created now (might take few minutes for reconciliation)
* in OCI registry, you should see a new artifact created for the vector

what's happening now:
* vector is available, StageConfig for dev stage can now pick it up and create the corresponding Stage in the cluster
* Stage reconciliation deploys all artifacts of the vector and assigns them dev stage
* internal routing rules are rolled out and allow east-west traffic between artifacts in the dev stage
* migrations are executed (skipped because we have no migration tasks in the quickstart app)
* activation makes services externally available

# Access the app on the dev stage

steps:
* open http://stage-dev.example.com/productpage in your browser 
* shows sample app product page, reviews and details have been fetched from the respective services
* requests automatically go to the latest deployed vector in the stage

check the resources which have been created:
* `kubectl get vectordeployment`
* `kubectl get artifactdeployment`
* `kubectl get httproute`

# Promote the app to production

steps:
* create promotion manifest to execute a manual promotion
* apply with `kubectl apply -f vector-promotion.yaml`
* check promotion status with `kubectl get vectorpromotion vector-dev-to-prod` and wait for it to complete
* now new promoted vector should be available in OCI
* StageConfig for production stage picks up the new vector and creates a new Stage in the cluster
* open http://stage-prod.example.com/productpage in your browser and see the app running in production

# Check out artifact reuse

check again the resources which have been created:
* `kubectl get vectordeployment`
* `kubectl get artifactdeployment`
* `kubectl get httproute`

results:
* new vectordeployment for production stage
* artifactdeployments are shared between dev and production stage, because they share identical versions
* new httproutes for production stage, because they have different hostnames

# Next Steps

(this is a call-to-action for users to continue exploring the project after the quickstart)

* publish changes to an artifact to deploy a new vector to dev stage
* add the ratings microservice to the app and experiment with database migrations
* install the star control plane on a second cluster and deploy the production stage there