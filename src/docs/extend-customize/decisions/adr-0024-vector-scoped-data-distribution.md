---
id: ADR-0024
title: "Vector-scoped data distribution"
status: draft
date_proposed: 2026-05-11
category: Architecture Pattern
impact: High
dependencies: [ADR-0006, ADR-0015, ADR-0019]
pageClass: adr
outline: deep
---
# ADR-0024: Vector-scoped data distribution

<AdrHeader />

## Context

Applications deployed through Konfidence need access to vector-scoped data at runtime. A vector represents a complete, versioned set of artifacts; some data associated with a vector is cross-cutting -- it concerns multiple applications inside the vector and must be made available to all of them in a uniform way. This ADR addresses how such vector-scoped data is modeled, distributed, and accessed by applications.

Two sources of vector-scoped data are in scope:

1. **Authored data** -- values declared as part of the vector (in the `VectorTemplate` / OCM artifact). The primary known example today is feature toggles; other generic key-value or structured configuration is also expected to fit here.
2. **Deployment results** -- data that is *produced* by Konfidence as a side effect of deploying the vector and that the applications inside the vector then need to consume. The most concrete example today is service-discovery information (which services exist in the vector and how they are reachable, derived from the routing resources created during deployment), but the same pattern applies to any other deployment outcome that needs to be observable from inside the vector.

Both sources share the same lifecycle (scoped to a vector version, immutable for that version, distributed before the vector's migration tasks run so they are available during migration and after activation) and the same consumers (applications running inside the vector). They should therefore be distributed through the same mechanism rather than through parallel systems.

### Authored Data as an OCM Artifact

Authored vector-scoped data is modeled as a dedicated OCM artifact type within the vector. This artifact is subject to the following constraints:

- **Singleton**: Only one such artifact may exist per vector. This avoids ambiguity about which data applies. The artifact is **optional** -- vectors without it simply have nothing authored to distribute (i.e. the artifact may be absent/empty). When present, it is declared as part of the `VectorTemplate` and validated at assembly time. Enforcing the singleton constraint for vectors assembled through the `VectorTemplate` is straightforward at assembly time; preventing it for vectors created manually (bypassing the template) is an open question -- see [Open Questions](#open-questions). In the future this constraint could be relaxed.
- **Immutable**: Once a vector version is assembled, the artifact is immutable. Applications can cache its content for the lifetime of the vector once loaded for a given vector-id.
- **Versioned with the vector**: Changes produce a new vector version, ensuring that authored data and application code are always deployed as a coherent unit.

The artifact is resolved from the OCM repository during vector deployment, just like any other artifact in the vector.

### Deployment Results

Deployment results are not authored by the vector author -- they are **computed by Konfidence as a side effect of deploying the vector**. The canonical example is service discovery: the set of reachable services and their addresses for a vector is exposed to the applications inside it, so a caller resolves a peer's address from the deployment results rather than from a gateway routing rule. Other deployment outcomes (e.g., assigned identities, generated endpoints, allocated quotas) can be carried in the same way.

Properties:

- **Per-vector and immutable per vector version**: Once a vector version is fully deployed, its deployment-result payload is fixed.
- **Source of truth is the platform**: Applications do not have to discover this information themselves; the platform computes it and hands it over.
- **Consumed alongside authored data**: Applications retrieve deployment results using the same vector-id-based lookup as authored data.

#### Opting a Service into the deployment results

A Kubernetes Service opts into the deployment results by carrying the `konfidence.cloud/deployment-result` annotation. Its value is the *stable* result name consumers look up -- the deployed Service name is suffixed per vector (so artifacts shared between vectors do not collide) and therefore cannot be used directly. Konfidence records one deployment result per opted-in Service, carrying the Service's namespace, its actual (suffixed) Kubernetes name, and its ports verbatim -- so multi-port Services need no special handling.

Results are aggregated per artifact component; a single component may expose more than one Service, so each component maps to a *list* of results. Nothing routing-specific is created for east-west traffic: there is no synthesized Service and no HTTPRoute -- the peer address is read from the deployment results. This supersedes the gateway-based east-west assignment sketched in ADR-0015.

### Scope

This ADR covers feature toggles, generic authored configuration, and deployment results (with service discovery as the leading concrete example) under a single mechanism. If these concerns ended up with different distribution mechanisms, applications would have to integrate with several patterns and the platform would have to maintain several parallel infrastructure paths -- for what is conceptually one problem: providing vector-scoped data to applications at runtime.

### Requirements

1. **Distribution guarantee before migration** -- a vector's data must be distributed before its migration tasks run, so that service-to-service calls made during migration can resolve it. The `VectorMigration` is created only once the `VectorDeployment` is fully ready -- all artifacts deployed, all `VectorAssignment`s ready, and the `VectorData` materialised -- which guarantees the data is in place before migration begins and, transitively, before activation. From that point there must be no window in which a request could arrive at an application without the correct data being available.
2. **Runtime resolution by vector-id** -- applications must be able to retrieve the correct configuration for the vector associated with the current request, without restart or redeployment of the service.
3. **Language-agnostic** -- no mandatory SDK or client library.
4. **Platform-agnostic concepts, platform-specific distribution** -- the *concepts* (data lives in OCM, contains both authored and deployment-derived data, scoped per vector, etc.) are platform-agnostic. The *distribution mechanism* itself realistically cannot be -- it is the responsibility of the deployer / landscape orchestrator to provide a suitable implementation per platform.
5. **Minimally invasive** -- application code changes should be as small as possible.
6. **Immutability** -- the data for a given vector version never changes; caching is safe for the lifetime of the vector.
7. **Unified access pattern** -- authored data and deployment results are retrieved through the same mechanism, not via parallel APIs.

### Existing Infrastructure

- **`X-Vector-ID` header**: Present on every routed request (set by the ingress gateway)
- **HTTPRoute `RequestHeaderModifier` filter**: Gateway API standard filter that can add/set/remove headers on requests matching a route rule

## Considered Solutions

### Option A: Central Configuration Service per Landscape

Deploy a central service per landscape that holds all vector-scoped data. During deployment of a vector, both the resolved authored artifact and the deployment results (e.g., the service-discovery payload computed from the routing resources) are pushed to the service. Applications query it at runtime using the vector-id from their incoming request.

**Deployment flow:**

1. Vector deployment begins; the authored artifact is resolved and the deployment results are computed (e.g., the set of reachable services and their addresses for this vector)
2. The deployer calls the central service API, e.g. `PUT /vector-data/{vector-id}`, with the combined payload
3. The service acknowledges storage -- this is a **prerequisite for vector activation** (the activation controller waits for confirmation)
4. Vector activation proceeds only after the data is confirmed stored

**Runtime flow:**

1. Application receives a request with `X-Vector-ID` header
2. Application looks up vector-scoped data for this vector-id in its local cache
3. On cache miss (first request for a previously unseen vector-id), the application calls `GET /vector-data/{vector-id}`
4. Application caches the response for the lifetime of the vector (data is immutable per vector-id). The data is immutable, so the cache never needs invalidation, but entries should still carry a (generously long) TTL rather than being held indefinitely -- vectors are eventually undeployed, and stale entries for retired vectors should be evicted.
5. Subsequent requests for the same vector-id are served entirely from cache

This runtime flow integrates with [OpenFeature](https://openfeature.dev/). OpenFeature's evaluation API supports multiple value types (boolean, string, integer, float, and structured objects), so a single OpenFeature provider backed by this service could serve feature-toggle evaluations, generic configuration lookups, and deployment-result lookups (the latter as structured-object values, e.g. keyed by logical service name). The vector-id is passed in the OpenFeature evaluation context. Because OpenFeature already covers structured object values, the protocol itself likely covers the config use case too, so a separate plain REST endpoint may be redundant -- it largely depends on the provider implementation and on whether we want to serve language-agnostic consumers that have no OpenFeature SDK. Whether OpenFeature is sufficient as the unified access protocol, or whether a separate plain REST endpoint (e.g., `GET /vector-data/{vector-id}`) is also needed, still needs to be evaluated.

**Pros:**

- **Strong distribution guarantee**: Data is stored centrally before activation. All applications (existing and newly scaled) can retrieve it immediately.
- **No payload size limitation**: Unlike HTTP headers, the service can store arbitrarily large and structured data, which matters for deployment-result payloads that can grow with the size of the vector.
- **Single API for all categories**: Authored data and deployment results fit naturally into one key/value or structured-document API.
- **Works for non-HTTP workloads**: Kafka consumers, background jobs, and batch processes can query the service when needed -- including for deployment-result lookups before initiating outbound calls.
- **Simple caching model**: Immutability means once loaded, the data never needs invalidation.

**Cons:**

- **Availability risk / single point of failure**: A landscape-wide outage of this service affects all applications in all vectors. If the service is unavailable and an application does not have the configuration cached (e.g., a fresh pod scaling up, or first request for a newly activated vector), the application cannot serve requests for that vector. Mitigation options are unsatisfying:
    - *Reject requests*: Causes user-visible errors and potential cascading failures
    - *Assume defaults*: Silently incorrect behavior, potentially worse than rejection
    - *Push-based pre-warming*: Instead of relying solely on lazy fetch on first request, the configuration service could push new configuration to running applications proactively after a vector is deployed. This reduces the window in which a service outage would cause cache misses. However, even with pre-warming, scaling up new pods during an outage would still fail since there is no source to fetch from.
  This requires high-availability deployment (replicas, health checks, persistent storage).
- **Persistent storage required**: The service needs a durable storage layer (e.g., database, etcd) to survive restarts and retain configuration across all deployed vectors. An in-memory-only approach would lose all configuration on pod restart. However, if the controllers that manage vector deployments reconcile periodically (as they do with other artifacts), they would re-push configuration to the service after a restart. This would eliminate the need for persistent storage but introduces a recovery window during which cache misses cannot be served. Probably etcd can be used as a storage (write ConfigMaps with a ServiceAccount)
- **Operational overhead**: The service must be developed, deployed, monitored, and lifecycled per landscape. The landscape operator is responsible for its availability.
- **Development cost**: A new service must be built (or an existing system like [flagd](https://flagd.dev/) adapted). flagd is designed for feature flag evaluation and could potentially be extended, but its data model may not fit generic key-value configuration.
- **Network dependency**: Every application must be able to reach the configuration service for the first request of any new vector-id. While subsequent requests are served from cache, the initial fetch is on the hot path of a user request, adding latency / failure possibilities at that point.

#### Option A': Per-Vector ConfigMap Written by the LCP Controller

A simpler variant of Option A avoids running an active service entirely. Instead, the LCP controller writes one ConfigMap per vector into the landscape (e.g., `vector-data-<vectorId>`) at activation time. Business apps inside the vector access it via the Kubernetes API using their ServiceAccount, which is conceptually similar to calling a central service but without an active component to operate.

Trade-offs vs. Option A:

- **Pros**: No additional service to develop, deploy, or keep available -- the Kubernetes API already provides the storage and the access path. ConfigMaps are reconciled by the controller, so they are reconstructable from OCM and deployment results without separate persistent storage.
- **Cons**: Applications need a ServiceAccount with read access to their vector's ConfigMap (slightly more setup than calling a REST/OpenFeature endpoint). OpenFeature is no longer a first-class citizen -- applications either use a ConfigMap-backed OpenFeature provider (additional library work) or read the ConfigMap directly. Kubernetes-only -- non-K8s landscapes would need a different distribution mechanism (consistent with the platform-specific-distribution requirement).

### Option B: HTTPRoute Header Injection

Konfidence already creates HTTPRoute resources for vector-based routing. These existing HTTPRoutes can be extended with `RequestHeaderModifier` filters to inject vector-scoped data as HTTP request headers -- no new custom resources are needed. Since each HTTPRoute already matches a specific `X-Vector-ID`, it can add vector-specific headers to the request before forwarding to the backend.

This option is a particularly natural fit for deployment results: the same controllers that compute them (because they create the routes) are the ones injecting the headers. The data the application receives is, in effect, derived from the very routing rule that delivered the request.

Note: This applies to the Kubernetes platform where Gateway API is available. Equivalent mechanisms for other platforms (e.g., Cloud Foundry) are yet to be evaluated.

**Deployment flow:**

1. Vector deployment begins; the authored artifact is resolved and the deployment results (e.g., service discovery) are computed
2. The controllers that create HTTPRoutes add `RequestHeaderModifier` filters carrying the combined data:
    - The **VectorAssignment controller** (landscape-flux-deployer) adds them to the service-to-service HTTPRoutes
    - The **Activation Execution controller** adds them to the ingress/gateway HTTPRoutes
3. The HTTPRoute updates are reconciled by the gateway implementation (e.g., Istio/Envoy)
4. Vector activation proceeds -- the data is now injected into every matching request

**Runtime flow (ingress):**

1. Request arrives at the gateway with `X-Vector-ID` header
2. The HTTPRoute matches and injects the relevant `X-Vector-*` headers
3. Application reads vector-scoped data from request headers

**Runtime flow (service-to-service):**

1. Service A receives a request with `X-Vector-ID` and the injected `X-Vector-*` headers
2. Service A calls Service B, forwarding only the `X-Vector-ID` header
3. The waypoint/mesh routes the call through Service B's HTTPRoute, which injects Service B's `X-Vector-*` headers
4. Service B reads its vector-scoped data from the injected headers

**Pros:**

- **No central service dependency**: No additional infrastructure to deploy, monitor, or lifecycle. Eliminates the availability risk entirely.
- **Leverages existing infrastructure**: The existing controllers already create HTTPRoutes for vector-based routing. Adding header modification is an incremental extension.
- **Zero application code change**: Applications read standard HTTP request headers -- every web framework exposes these natively.
- **Inherently request-scoped**: Each request carries its own data, correctly handling artifact reuse scenarios.
- **Distribution guarantee via routing**: The data is embedded in the routing rules. If the HTTPRoute is active, the data is available. No separate distribution step needed.

**Cons:**

- **Header size limits**: HTTP header sizes are constrained (~8KB total across all headers in many implementations; Envoy/Istio default up to 60KB). Sufficient for boolean feature toggles and simple key-value pairs, but may be exceeded by larger structured data or by deployment-result payloads in vectors with many services.
- **Platform-specific implementation**: On Kubernetes, Gateway API HTTPRoutes provide a clean mechanism. On Cloud Foundry or other platforms, equivalent functionality does not exist natively -- different solutions (route services, custom buildpacks) would be needed.
- **Only works for HTTP-based communication**: Other technologies like Kafka or gRPC streaming would not be covered. In particular, an application that needs the data to *initiate* an outbound call (without first receiving a triggering HTTP request) would not have access to it through this mechanism.

### Option C: ConfigMap/Volume Mount

Maintain a single global ConfigMap containing all vector-scoped data, mounted into all pods. When a new vector is deployed, the ConfigMap is updated with the new vector's entry. Applications read from the mounted file at runtime, keyed by vector-id.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vector-data
data:
  vector-1: |
    {
      "config": {"dark-mode": true, "beta-api": false},
      "services": {"orders": "http://orders.vector-1.svc/", "billing": "http://billing.vector-1.svc/"}
    }
  vector-2: |
    {
      "config": {"dark-mode": false, "beta-api": true},
      "services": {"orders": "http://orders.vector-2.svc/", "billing": "http://billing.vector-2.svc/"}
    }
```

- Kubernetes-specific: no equivalent on other platforms
- Update propagation is not observable -- there is no way to know when all pods have received the updated ConfigMap, which violates the distribution guarantee. Upstream issues [#30189](https://github.com/kubernetes/kubernetes/issues/30189) and [#22368](https://github.com/kubernetes/kubernetes/issues/22368) have been open since 2016 without a proposal to expose distribution status; nothing comparable is on the horizon.
- ConfigMap size limit: 1MB total -- grows with every active vector's authored data and deployment results
- Application must read `X-Vector-ID` from request and look up the corresponding entry

A variation of this option avoids the 1MB ConfigMap limit entirely: mount a writable volume into each pod and have the controller (or a central service) write the vector config directly into that volume rather than relying on a ConfigMap. This is essentially Option E (writer controller + volume). Cross-cluster behavior -- when the workloads run on a different cluster than the LCP -- still needs to be checked for this variant.

### Option D: ConfigMap per Vector

A separate ConfigMap is created for each vector, containing only that vector's data, e.g. `vector-data-{vector-id}`. Pods reference these ConfigMaps via dedicated volume mounts per vector they participate in.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: vector-data-vector-3
data:
  data.json: |
    {
      "config": {"dark-mode": true, "beta-api": true},
      "services": {"orders": "http://orders.vector-3.svc/"}
    }
```

This avoids the 1MB total limit of Option C, since each ConfigMap holds a single vector's payload. However, to reference a newly-created ConfigMap from a pod, the pod's `spec` must change to include the new volume or `envFrom` entry -- which means **all participating pods must be rolled on every new vector activation**. The rollout completion is observable and provides a strong distribution guarantee, but at a high operational cost.

- Restarts on every vector activation are unavoidable
- Defeats the value of long-lived application pods shared across vectors -- a pod serving vectors 1..N is redeployed solely because vector N+1 was activated
- With many vectors and frequent deployments, the resulting churn is operationally heavy
- Kubernetes-specific: no equivalent on other platforms

### Option E: Cluster-Local Persistent Volume with Writer Controller

A `ReadWriteMany` PersistentVolume is provisioned on the landscape cluster (backed by NFS, CephFS, EFS, Filestore, etc.). A small writer controller on the landscape consumes a `VectorConfig` custom resource representing the desired state per vector, materializes the data as an immutable file on the PV (e.g. `vector-{id}.json`), and reports back via CR status. Business pods mount the same PV read-only and read on cache miss.

**Deployment flow:**

1. Vector deployment begins; the configuration OCM artifact is resolved
2. The LCP-side activation controller creates/updates a `VectorConfig` CR on the landscape cluster, with the resolved data inline
3. The landscape-side writer controller reconciles and writes to the volume, then sets `Status.Phase: Committed`
4. Vector activation proceeds only after `Status.Phase == Committed`

**Runtime flow:**

1. Application receives request with `X-Vector-ID` header
2. Application looks up data in its in-memory cache (immutable, cached for the lifetime of the vector)
3. On cache miss, application opens `/var/run/konfidence/vectors/{vector-id}.json` and reads
4. Subsequent requests for the same vector-id are served entirely from cache

**Pros:**

- **Reads require no running component**: Once the file is committed, any consumer can read it as long as the storage is mounted -- no service to be up, no API to call. Pods scaling up during a control-plane outage can still serve requests for already-activated vectors. This is the key distinction from Option A.
- **Strong, observable distribution guarantee**: Activation gates on a single ACK (`Status.Phase: Committed`) backed by the writer's `fsync` + atomic rename. After that point, any first-time `open()` will see the file, given a filesystem with close-to-open consistency.
- **No payload size limitation**: Filesystem can store arbitrarily large data or rather the landscape cluster admin can freely configure it.
- **Reuses existing cross-cluster pattern**: Desired-state propagation via CRs from the LCP to the landscape is the same pattern already used elsewhere in Konfidence.

**Cons:**

- **RWX storage requirement**: The cluster must provide a `ReadWriteMany` storage class. Not always available, especially on bare-metal or minimal clusters; this is a real portability cost for cluster operators installing the Konfidence chart.
- **Filesystem consistency tuning**: NFSv3 with default attribute caching can briefly hide the file from a fresh `open()` after commit. Mitigated by FS choice (CephFS/EFS), mount tuning (e.g. `actimeo=0`), or a bounded reader-side retry on `ENOENT`.
- **Kubernetes-specific**: No equivalent on Cloud Foundry or other non-K8s platforms; would need a parallel mechanism.
- **Cluster-local only**: A landscape that spans multiple clusters needs a PV + writer controller per cluster.
- **Writer/storage availability gates activations**: A storage backend or writer outage blocks new vector activations -- but does not affect serving of already-activated vectors (bounded blast radius).
- **Complexity**: Requires a custom controller, PV provisioning and a new CRD.

### Option F: Node-Local DaemonSet (Per-Node File System or Local Endpoint)

A DaemonSet runs one pod per node in the landscape cluster. The daemon watches a source of truth in the Kubernetes API (per-vector ConfigMap, CR, or stream from the LCP controller) and projects vector-scoped data onto each node so that local applications can access it without going off-node.

There are two consumption variants:

- **Filesystem variant**: the daemon writes files to a `hostPath` directory (e.g., `/var/run/vector-data/<vector-id>.json`); apps mount the same `hostPath` read-only and read the file.
- **Local-endpoint variant**: the daemon exposes a small HTTP/gRPC API on the node (`hostPort` or NodeIP); apps query `http://127.0.0.1:<port>/vector-data/<vector-id>` (this is essentially the [flagd RPC mode](https://flagd.dev/architecture/) deployed as a DaemonSet, and could double as an OpenFeature/OFREP endpoint).

The LCP controller publishes per-vector data into a Kubernetes API resource (ConfigMap/CR), and each DaemonSet pod watches that resource and updates its node-local state accordingly. In this sense, Option F is a **node-local cache layer on top of Option D**.

**Pros:**

- **Fast, low-latency access**: Apps talk to a process on the same node (file read or `127.0.0.1`), no central network hop on the hot path.
- **Bounded blast radius**: One daemon pod per node; an outage of one daemon affects only its node, not the entire landscape.
- **Survives control-plane hiccups (read path)**: Once data is on the node, apps can keep reading it even if the K8s API server is briefly unavailable.
- **No payload size limits**: Local filesystem / local API is not bound by HTTP-header limits.
- **Works for non-HTTP workloads**: Kafka consumers, jobs, etc., can query the local daemon.
- **OpenFeature-friendly**: Local-endpoint variant integrates naturally with OpenFeature providers (e.g., flagd-style).

**Cons:**

- **Distribution guarantee is harder to prove**: The activation controller must be sure every relevant node's daemon has the new vector's data before activation. Without an explicit ACK protocol per daemon pod (or readiness gates on app pods that depend on the daemon), this is eventually consistent and re-introduces the activation-window problem from Option C.
- **New-node race condition**: When the cluster autoscales, an app pod can be scheduled to a new node before the DaemonSet pod there is ready. Two mitigations:
    - **Node taint** (the correct mechanism here -- this is precisely what taints exist for, and it is non-invasive): new nodes come up with a taint like `vector-data-not-ready=true:NoSchedule`; only the DaemonSet tolerates it; the daemon removes the taint once it has loaded its data, after which app pods can be scheduled. Cilium uses the same pattern (`node.cilium.io/agent-not-ready`) for CNI readiness.
    - **App-side initContainer / readiness gate** that waits for the local daemon -- works but is invasive on the application, and is not really a separate option given that the node taint already solves the scheduling race cleanly.
- **HostPath / hostPort security**: `hostPath` and `hostPort` are restricted by the Pod Security Standards "baseline"/"restricted" profiles and require explicit policy exceptions. Apps must mount the same `hostPath`, which is also restricted. Both restricted mechanisms can be avoided, however:
    - For the **local-endpoint variant**, instead of `hostPort` use a regular `Service` with `internalTrafficPolicy: Local` (traffic stays on the node) backed by a regular, non-privileged container -- no host networking needed.
    - For the **filesystem variant**, instead of `hostPath` use a **CSI node driver** (also deployed as a DaemonSet, exposing a filesystem to the container programmatically). This keeps the same node-local delivery while avoiding `hostPath`, and it has an additional benefit: because the app pod's volume comes from the CSI driver, the container will not start until the driver is available -- which cleanly handles restarts and scale-out races (the volume mount itself gates pod startup on driver readiness).
- **Still depends on a K8s-side source**: The daemon doesn't magically know about new vectors -- something (a ConfigMap, a CR, the LCP controller) must publish them, so this option is layered on top of Option D rather than replacing it. The added value is the node-local cache, not a new distribution channel. This need not be purely pull/watch-based, though: an active component in the cluster can **accept the settings from the LCP and actively fan them out to the daemons via gRPC** to multiple targets (a headless `Service` or `EndpointSlice` is just a "give me all current targets" DNS/API lookup), pushing the data in addition to the Kubernetes API as a backing/recovery layer. Unlike the pure ConfigMap-watch model (Option C), an active push path like this does **not** rule out explicit delivery guarantees -- the fan-out can collect per-target ACKs before activation proceeds.
- **Operational overhead**: DaemonSet image, RBAC, monitoring, rollouts, version compatibility with apps. The overhead is primarily in **monitoring** (a per-node component to observe) rather than in deployment complexity per se -- a DaemonSet is not inherently harder to deploy than the central service in Option A; it is just spread across every node instead of replicated for HA.
- **Kubernetes-specific**: Same caveat as Options B/C/D/E -- non-K8s landscapes need a different mechanism.

## Decision

**Proposed direction: Option A (central per-landscape service), with Option A' as its storage layer.**

The contract exposed to applications is a wire protocol -- no Konfidence-specific client library is shipped. Applications integrate using upstream off-the-shelf libraries (OpenFeature OFREP providers, standard HTTP clients).

- **Storage layer (Option A' under the hood).** The Star controller writes one ConfigMap per vector into the landscape cluster (e.g. `vector-data-<vectorId>`) at deployment time of the configuration artifact. ConfigMap creation against the kube-apiserver = durable, which makes gating trivial and avoids a separate persistent store for the service. The `VectorMigration` is gated on the `VectorDeployment` being fully ready (which includes the `VectorData` being materialised), so the ConfigMap exists before migration tasks run -- not only before activation.
- **Service layer (Option A on the wire).** A small per-landscape service exposes two read APIs over the same per-vector data:
    - **OFREP** for feature toggles, scoped per vector.
    - **Plain REST `GET /vector-data/v1/{vectorId}`** returning the full immutable bundle (authored config + deployment results) for SDK-less consumers and non-toggle data.
- **Service ↔ ConfigMaps.** The service interacts with the kube-apiserver to obtain per-vector data, either via a labeled informer/watch populating an in-memory cache or lazy fetch on cache miss.
- **Non-Kubernetes landscapes.** The service-on-the-wire contract is platform-neutral and can be reused. The storage layer is K8s-specific by design and would be replaced per platform without affecting clients.

Note: the options above are not mutually exclusive. More than one of them may end up being implemented over time, given that the distribution mechanism is platform-specific anyway. Whether the platform exposes this as a stable interface (with multiple backends), as runtime flags on a single deployer, or as a separate deployer implementation per option, is itself an open design question.

## Open Questions

1. **Scope definition**: What concrete authored data beyond feature toggles would be vector-scoped?
2. **flagd reuse**: Can [flagd](https://flagd.dev/) or a similar existing project serve as the basis for the central service?
3. **Non-Kubernetes platforms**: How would these solutions look like on non-K8s platforms?
4. **Schema**: Should there be a typed schema for vector-scoped data (validated at assembly time), or is it free-form key-value?
5. **OpenFeature sufficiency**: Does OpenFeature's type system (boolean, string, integer, float, object) fully cover both authored data and deployment results, or is a separate REST endpoint needed for language-agnostic consumers without an OpenFeature SDK?
6. **Singleton enforcement for manually-created vectors**: The singleton constraint is easy to enforce at assembly time for vectors built from a `VectorTemplate`. How do we prevent a vector that is created manually (bypassing the template) from carrying more than one configuration artifact? How is the artifact actually packed into the vector -- as part of the `VectorTemplate`?
7. **Deployment-result categories**: Beyond service discovery, which other deployment outcomes should flow through this mechanism, and what is their canonical shape?
