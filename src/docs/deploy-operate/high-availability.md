---
title: High availability
description: Which Konfidence components can run with more than one replica, what each needs, and where state lives.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# High availability

Konfidence has three components that run as Deployments: the operator, the API server, and the Kubernetes deployer. Each can run with more than one replica. This page explains what each needs for that and where state lives, so you can decide which components to scale.

## State lives in the cluster, not in the components

The operator and the deployer keep no state of their own. Every project, landscape, stage, vector template, and promotion is a custom resource in the Kubernetes API. A restarted or replaced replica reads the current state from the API server and continues.

The API server keeps one thing in memory by default: login sessions. With the default `in-memory` session store, a restart signs every user out, and two replicas do not share sessions.

## The operator and the deployer use leader election

Both controllers run with leader election on by default. With two or more replicas, one replica holds the lease and reconciles. The others stand by and take over when the lease expires. Standby replicas do not share the reconciliation load. They shorten the time without a working controller after a node failure.

Set `replicas` to 2 or more and enable the PodDisruptionBudget so voluntary disruptions, such as node drains, keep one replica running:

```yaml
replicas: 2
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

The same values exist on both charts. Use `affinity` to spread the replicas across nodes.

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

- [System architecture](./system-architecture.md) explains the three components and the one-cluster topology.
- [Helm values: konfidence](/docs/reference/helm-values-konfidence) and [Helm values: orchestrator](/docs/reference/helm-values-orchestrator) list every value named here.
