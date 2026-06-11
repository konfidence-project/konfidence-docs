---
title: Build vectors
description: Learn how to assemble vectors from artifacts and manage your application versions in Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

<!-- 
  Content type (Diátaxis): How-to guide — user wants to assemble a vector with own artifacts 

  Dev input needed:

  Ticket: DOCS — How to build vectors
-->

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

## Managing vector versions

### Vector lifecycle

1. **Assembly:** Compose artifacts into a vector
2. **Validation:** Ensure vector is deployable
3. **Distribution:** Make vector available for deployment
4. **Deployment:** Promote vector through stages
5. **Archival:** Retain history for auditing

### Best practices

- Use semantic versioning for vectors
- Document vector composition and purpose
- Keep vector versions secure in your registry
- Archive old vectors for compliance

## Next steps

After creating vectors, [define promotions](/docs/develop-integrate/observe-improve/define-promotions) to deploy them through your stages.

