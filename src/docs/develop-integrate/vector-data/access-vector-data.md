---
title: Access vector data
description: Learn how to access vector-scoped configuration data in your application code.
---

# Access vector data in your application

<!-- 
  Content type (Diátaxis): How-to guide — developer wants to access vector data in their code
-->

*   Identity = X-Vector-ID HTTP header set by the ingress gateway on every routed request — this is what tells the app which vector's config to load. Forward it on every outbound HTTP call (mandatory contract; otherwise vector routing breaks at the next hop).
*   Lookup goes through the central per-landscape configuration service via OpenFeature / OFREP. No plain REST endpoint, no Konfidence SDK — use any standard OpenFeature client. Pass the vector-id as the targetingKey in the OpenFeature evaluation context.
*   Two evaluation modes against the same OFREP API:
*   Single-flag: POST /ofrep/v1/evaluate/flags/{key} with the toggle name → returns one value.
*   Whole-bundle shortcut: pass the vector-id itself as the flag key → returns the entire vector configuration object (features + authored config + deployment results) in one call. Useful at app startup to prime your local view.
*   Bulk: POST /ofrep/v1/evaluate/flags returns all features at once with ETag support (If-None-Match) for cheap revalidation.
*   Works for any workload protocol. It's a plain HTTP call to a landscape-local service — HTTP services, gRPC services, Kafka consumers, batch jobs, cron jobs, anything that can do an HTTP request can ask for its config whenever it needs it. The only thing that's HTTP-specific is the X-Vector-ID header on inbound traffic; non-HTTP workloads obtain the vector-id from their own message metadata or context.
*   Not available during deployment / migration. The bundle is guaranteed complete only after vector activation — deploy-time tasks (DB migrations etc.) cannot read it. Use the task spec for those; vector config is for running app code.
*   Immutable per vector-id. Once fetched, the data for that vector never changes — cache for the lifetime of the vector, no invalidation, no polling. The service itself caches ConfigMaps in memory so repeated lookups stay cheap.
