---
title: Quickstart
description: Get started with Konfidence in minutes.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Before you begin

requirements: 
* a running k8s cluster 
  - flux installed (link to flux installation guide)
  - gateway API installed (link to istio installation guide)

# Installation

* can we do it as easy-to-use kind setup?
* helm install konfidence-galaxy (+ configuration?)
* helm install konfidence-star (+ configuration?)

very simplistic setup:
* control planes installed on a single cluster
* deploy workloads to same cluster

production-grade setup will involve multiple clusters

# Next Steps

* publish changes to an artifact to deploy a new vector to dev stage
* add the ratings microservice to the app and experiment with database migrations
* install the star control plane on a second cluster and deploy the production stage there
