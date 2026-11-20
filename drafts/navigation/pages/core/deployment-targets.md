---
title: "Deployment targets"
scope: "Konfidence core"
editLink: false
lastUpdated: false
---
# Deployment targets {#manage-deployment-targets}

A deployment target connects an artifact type to a destination in a landscape. `DeploymentTarget.spec.artifactType` selects the responsible deployer; `spec.parameters` contains the connection information that deployer defines.

## Choose the artifact type

A landscape needs one ready target for every artifact type its stages deploy. At most one target for a type is allowed in a landscape. Different types can use the same infrastructure.

## Configure the destination

Create a [landscape](./landscapes.md), then follow the target documentation for your deployer:

| Deployer | Destination configuration | Availability |
| --- | --- | --- |
| [Kubernetes](../deployers/kubernetes/configure-target.md) | Local cluster and Kubernetes target parameters | Documented workflow |
| [S3](../deployers/s3/targets.md) | S3-compatible bucket through `S3DeploymentConfig` | In development; design documentation |
| [Cloud Foundry](../deployers/cloud-foundry/index.md) | Configuration workflow remains incomplete | Proof of concept |

The same `DeploymentTarget` resource is part of Konfidence core. Additional configuration resources, such as `S3DeploymentConfig`, belong to the corresponding deployer.

## Understand readiness

The responsible deployer validates the target and reports its `Ready` condition. `Ready=True` means it accepts the parameters; it does not guarantee that a future artifact deployment succeeds.

If there is no condition, check that a running deployer supports the exact `spec.artifactType` value. If readiness stays false, inspect the condition reason and the deployer's parameter reference.

## Check which types a landscape provides

You need `kubectl` access and permission to read `DeploymentTarget` resources in the landscape namespace.

List the targets in the landscape namespace with the following command.

```bash
kubectl get deploymenttargets --namespace=<landscape-namespace>
```

The `spec.artifactType` field identifies the artifact type and `Ready=True` indicates that its deployer accepts the target.
The landscape can deploy an artifact when it contains a ready target matching the artifact manifest type.

## Next steps

Once every required target is ready, [create a stage](./stages.md). The [DeploymentTarget reference](../reference/crd.md#deploymenttarget) lists the shared fields.
