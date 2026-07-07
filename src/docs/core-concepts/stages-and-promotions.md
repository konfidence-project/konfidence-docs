---
title: Stages and Promotions
description: Understand how stages select vectors and how promotions prepare vectors for later delivery targets.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Stages and Promotions

Stages and promotions connect an immutable vector to the delivery targets that should use it.
A stage selects one vector at a time.
A promotion makes that same vector available under another alias, registry location, or repository path without changing the vector contents.

## Stages

A stage is a defined checkpoint in the delivery process.
It represents a delivery target such as development, test, or production and points to the vector that should be delivered for that checkpoint.

The important part is the relationship between a stage and a vector.
The vector describes what should be delivered.
The stage describes where that vector should become the current delivery state.

## Stage configuration

The `StageConfiguration` custom resource describes the relationship between a stage and its selected vector.
It defines the stage name, the vector assigned to that stage, and the target location where Konfidence creates the stage state.

The following example shows the stage-to-vector relationship:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: StageConfiguration
metadata:
  name: stage-configuration-example
  namespace: default
spec:
  name: example-stage
  vector: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  targetWorkspace: root:sample-organization
  targetNamespace: dev-eu10
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

In this example, `vector` references the component that was configured as the `uploadTarget` in the `VectorTemplate`.
The stage named `example-stage` is created in the Kubernetes namespace `dev-eu10` inside the KCP workspace `root:sample-organization`.
The `config` section gives Konfidence the registry access information it needs to fetch the vector.

## Promotions

A promotion prepares a vector for another delivery target.
Conceptually, promotion is re-aliasing: Konfidence takes a known vector reference and makes it available under another alias, registry location, or repository path.

This re-aliasing is useful because stages need distinct vector references.
For example, a development stage can use a `latest` alias while a production stage uses a `stable` alias.
Both aliases can point to vector versions over time, but a promotion is the explicit action that moves a verified vector from one track to another.

Because vectors are immutable, promotion does not rewrite the vector contents.
It only changes where the same vector can be resolved from.
That keeps the tested application version intact while still allowing each stage to use its own delivery reference.

## Promotion targets

The simplest promotion target is another alias in the same Open Container Initiative (OCI) repository.
This fits the common case where teams move a vector from a development alias to a stable alias.

Promotions can also target another OCI repository or registry.
That supports delivery models where different targets need different controls, for example:

- Access control, such as allowing many teams to publish development vectors while only the release pipeline can publish stable vectors.
- Security boundaries, such as separating unverified vectors from vectors approved for production.
- Geographical proximity, such as moving vectors closer to the runtime infrastructure that pulls them.
- Organizational ownership, such as separating team-owned repositories from release-owned repositories.

## Promotion resources

Konfidence represents promotion setup and promotion execution with separate resources.
For concept pages, the main point is that the configuration defines the source and target, and the trigger starts one promotion run.

The `VectorPromotionConfig` custom resource defines where the vector comes from and where the promoted reference should be available:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: example-vector-promotion-config
  namespace: default
spec:
  source: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  target: https://registry.example.com/sample-project//example.tools/constructed-vector:stable
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

The `VectorPromotion` custom resource triggers one execution of that configuration:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: example-vector-promotion
  namespace: default
spec:
  vectorPromotionConfigRef: example-vector-promotion-config
  ttlAfterFinished: 1h
```

A `VectorPromotion` runs once, whether it succeeds or fails.
This makes promotion an explicit delivery event and helps protect aliases from accidental overwrites.
The status is recorded on the referenced `VectorPromotionConfig`, so teams can see the latest promotion result and the latest successful promotion result.

## Related pages

- [Vectors and Artifacts](./vectors-and-artifacts.md) explains how artifacts and vectors define the application version that stages select.
- [Delivery Flow](./delivery-flow.md) explains how stage assignment and promotion fit into the complete delivery flow.
- [Define promotions](../develop-integrate/observe-improve/define-promotions.md) explains the task-oriented flow for configuring promotions.
