---
title: Build vectors
description: Learn how to assemble vectors from artifacts and manage your application versions in Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Build vectors

* Vectors are the core deployment unit in Konfidence

## Understanding vectors

* vector combines multiple artifacts into a single deployable unit
* represents a specific version of your application
* can be deployed as a whole, ensuring consistency across all stages

## Creating vectors

* select which artifacts should be part of vector
* create VectorTemplate resource
* vectors will be created automatically based on template

## Vector naming strategies

* consider naming conventions that reflect the deployment strategy:
  - vector-dev, vector-test, vector-prod
  - vector-team-a, vector-team-b
  - vector-experimental, vector-stable

## Next steps

After creating vectors, [define promotions](/docs/develop-integrate/observe-improve/define-promotions) to deploy them through your stages.

