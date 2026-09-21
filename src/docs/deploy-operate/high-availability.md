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

The API server stores nothing except login sessions. With the default `in-memory` session store, a session lives in the memory of the replica that created it. A restart signs every browser and CLI user out. Two replicas do not see each other's sessions. A user whose requests reach the other replica is signed out as well. Bearer tokens from CI pipelines are verified on every request and need no session, so they are unaffected.

## The operator uses leader election

The operator runs with leader election on by default. With two or more replicas, one replica holds the lease and reconciles. The others stand by and take over when the lease expires. Standby replicas do not share the reconciliation load. They shorten the time without a working controller after a node failure.

Set `replicas` to 2 or more and enable the PodDisruptionBudget so voluntary disruptions, such as node drains, keep one replica running:

```yaml
replicas: 2
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

Use `affinity` to spread the replicas across nodes.

## The API server needs a shared session store for more than one replica

The API server is stateless apart from sessions. To run more than one replica, switch the session store to PostgreSQL. The chart exposes the store type as a value and reads the connection string from the environment:

```yaml
api:
  replicas: 2
  session:
    storageType: db-pg
  env:
    - name: API_DB_CONNECTION
      valueFrom:
        secretKeyRef:
          name: konfidence-api-db
          key: connection
  podDisruptionBudget:
    enabled: true
    minAvailable: 1
```

The connection string uses the PostgreSQL URL form, for example `postgres://konfidence:<PASSWORD>@postgres.example.com:5432/konfidence`. The API server refuses to start when `storageType` is `db-pg` and the connection string is empty. Pool sizes are set under `api.database`.

## What Konfidence does not make highly available

Konfidence depends on Flux, the Gateway API CRDs, and cert-manager when the webhook is enabled. Their availability is configured in their own installations. The state of Konfidence is only as durable as the cluster's etcd. Back up the cluster or the custom resources with your existing tooling.

## Related pages

- [System architecture](./system-architecture.md) explains the control plane and the one-cluster topology.
- [Helm values: konfidence](/docs/reference/helm-values-konfidence) lists every value named here.
