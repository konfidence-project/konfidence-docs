---
title: Deploy a sample application
description: Learn how to deploy a sample application with Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Before you begin

requirements: 
* an OCI registry to store artifacts
* a running k8s cluster with konfidence installed (see quickstart guide)
* clone sample-app/quickstart repo: github.com/konfidence-project/example-app

# Example application

* based on istio examples, pure k8s deployments
* product-page / reviews / details 
* ratings not included in quickstart because of external database dependency

# Define your Delivery Flow

summary:
* start with dev and production stage
* use pre-made vector/artifacts from example app 
* manual promotion brings vectors to production stage

steps:
* create a StageConfig assigning the dev vector to the dev stage
* define a VectorPromotion that uses dev vector as source and production vector as destination
* create a StageConfig assigning the production vector to the production stage
* apply all resources with `kubectl apply -f <resource>.yaml`

what happened so far:
* delivery flow defined, but no artifacts created yet
* no vector can be created, because referenced artifacts do not yet exist

# Access the app on the dev stage

steps:
* open the product page through your gateway's dev-stage hostname, e.g. `http://stage-dev.example.com/productpage` (the hostname depends on how your Gateway is configured — for local clusters, map it in `/etc/hosts` or use `kubectl port-forward`)
* shows sample app product page, reviews and details have been fetched from the respective services
* requests automatically go to the latest deployed vector in the stage

check the resources which have been created:
* `kubectl get vectordeployment`
* `kubectl get artifactdeployment`
* `kubectl get httproute`

# Promote the app to production

requirement: OCI registry with push access

steps:
* create promotion manifest to execute a manual promotion
* apply with `kubectl apply -f vector-promotion.yaml`
* check promotion status with `kubectl get vectorpromotion vector-dev-to-prod` and wait for it to complete
* now new promoted vector should be available in OCI
* StageConfig for production stage picks up the new vector and creates a new Stage in the cluster
* open the product page through your gateway's production-stage hostname (e.g. `http://stage-prod.example.com/productpage`) and see the app running in production

results:
* new vectordeployment for production stage
* artifactdeployments are shared between dev and production stage, because they share identical versions
* new httproutes for production stage, because they have different hostnames

# Next Steps

* publish changes to an artifact to deploy a new vector to dev stage
* add the ratings microservice to the app and experiment with database migrations