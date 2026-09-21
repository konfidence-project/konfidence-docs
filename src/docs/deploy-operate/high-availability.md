---
title: High availability
description: Which control plane components can run with more than one replica, what each needs, and where state lives.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# High availability

The Konfidence control plane runs as two Deployments: the operator and the API server. Each can run with more than one replica. This page explains what each needs for that and where state lives, so you can decide which components to scale.

::: warning Not fully tested
Running the control plane with more than one replica is not fully tested in the current release. Use it at your own discretion and verify failover in a non-production cluster first.
:::

## Delivery state is stored as custom resources

Konfidence stores all delivery state as custom resources in the Kubernetes API. That covers projects, landscapes, deployment targets, stages, stage versions, vector templates, promotion configurations, and promotions. The operator holds only in-memory caches of those resources and the leader election Lease. When a replica stops, nothing is lost that was not already written to the Kubernetes API. The replacement replica rebuilds its caches from the API and continues from the stored state.

The API server stores nothing except login sessions. The default session store is `in-memory`, so a restart loses every session and signs all users out. To keep sessions across restarts, set `api.session.storageType` to `db-pg`. [Keep login sessions in PostgreSQL](./konfidence-installation.md#keep-login-sessions-in-postgresql) on the install page shows the values.

## The operator uses leader election

The operator runs with leader election on by default. With two or more replicas, one replica holds the lease and reconciles. The others stand by and take over when the lease expires. Standby replicas do not share the reconciliation load. They shorten the time without a working controller after a node failure.

Set `replicas` to 2 or more and enable the PodDisruptionBudget so voluntary disruptions, such as node drains, keep one replica running:

```yaml
replicas: 2
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

Use `affinity` to spread the replicas across nodes. Pass these values with `--values` to the Helm command in [Install Konfidence](./konfidence-installation.md#install-the-control-plane).

## The API server needs a shared session store for more than one replica

With the default `in-memory` store, two API server replicas do not share sessions. Switch the store to PostgreSQL before setting `api.replicas` above 1. [Keep login sessions in PostgreSQL](./konfidence-installation.md#keep-login-sessions-in-postgresql) on the install page shows the values. Add `api.podDisruptionBudget` with `minAvailable: 1` alongside, as for the operator.

## What Konfidence does not make highly available

Konfidence depends on Flux, the Gateway API CRDs, and cert-manager when the webhook is enabled. Their availability is configured in their own installations. The state of Konfidence is only as durable as the cluster's etcd. Back up the cluster or the custom resources with your existing tooling.

## Related pages

- [System architecture](./system-architecture.md) explains the control plane and the one-cluster topology.
- [Helm values: konfidence](/docs/reference/helm-values-konfidence) lists every value named here.
