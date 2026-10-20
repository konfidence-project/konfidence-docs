---
id: ADR-0039
title: "Static content deployer"
description: "Upload static apps to object storage and make them live by flipping a per-stage pointer that an administrator-owned CDN resolves at request time."
status: draft
authors: []
category: Architecture Pattern
impact: Medium
dependencies: [ADR-0024, ADR-0027, ADR-0034, ADR-0037, ADR-0038]
pageClass: adr
outline: deep
---

# ADR-0039: Static content deployer

<AdrHeader />

## Context

Some apps in a vector are static front-ends (built HTML, JS, CSS), not services. A stage serves them under one hostname: static files through a CDN, and `/api` through Konfidence's public gateway.

This ADR defines a deployer that:

1. uploads a static app's files, unchanged, to S3-compatible object storage, and
2. makes a new version live by flipping a small **pointer**, which an administrator-owned CDN reads at request time.

The files are immutable once uploaded. What a stage *serves* changes on activation — so activation is a pointer flip, not a file change. The design is provider-neutral and works for a single-page app, several apps on different paths, or a set of microfrontends.

## Scope

- The **administrator** owns the bucket, credentials, DNS, HTTPS, the CDN, and the public path split (gateway-owned paths such as `/api` → gateway; everything else → static origin). The gateway-owned paths are the admin's choice and need not be `/api`. Konfidence owns only the files it writes and the pointer.
- The deployer is one cluster-wide controller (like the Kubernetes deployer). It isolates tenants through the per-landscape `DeploymentTarget` (its own bucket area + credential), not through a path segment.
- Builds on the [deployer spec](https://github.com/konfidence-project/konfidence/blob/main/deployer-specification/index.md), [ADR-0038](./adr-0038-artifact-type-deployer-selection.md) (type selection), [ADR-0037](./adr-0037-ingress-routing-and-activation.md) (routing), [ADR-0034](./adr-0034-artifact-deployment-naming.md) (naming), [ADR-0027](./adr-0027-landscape-deployment-target.md) (targets), and [ADR-0024](./adr-0024-vector-scoped-data-distribution.md) (vector data).

## Decision (at a glance)

1. New artifact type `static.web.konfidence.cloud/v1alpha1`; payload is one folder of built files.
2. Upload files **unchanged** into a folder named after the `ArtifactDeployment`.
3. Serve assets from a **version-stable base** `/_v/<artifact-deployment-name>/` so old tabs never break on a cache flip.
4. Activation flips **one pointer per stage**; the admin's CDN resolves it at request time. No file is changed.
5. The same result shape and the same edge resolver cover **one app, many apps, or microfrontends**.
6. Cleanup is finalizer-driven, with an optional grace window. No CDN access, no cache headers set by the deployer.

## Artifact packaging

The OCM component carries the `konfidence-manifest` and one payload folder. Three authored labels:

| Label | Meaning | Default |
| --- | --- | --- |
| `static.web.konfidence.cloud/entrypoint` | the HTML document to serve | `index.html` |
| `static.web.konfidence.cloud/path` | public path the app is served at | `/` (required if a vector has several static apps) |
| `static.web.konfidence.cloud/module` | optional: importable entry for microfrontends (e.g. `remoteEntry.js`) | — |

**Validation.** The deployer defines a validation mechanism that runs on `kden` artifact push (upload) and again at deploy/activation time, and rejects a bad package before anything is served. It checks at least:

- exactly one payload folder, and the `entrypoint` document actually exists;
- no path-escaping entries in the folder;
- well-formed labels (`path` valid; `module`, if set, points to a real file);
- **no duplicate `path` and no duplicate result `name`** across the vector's static artifacts — e.g. two apps both claiming `/` is rejected (duplicate-path checks are vector-wide, so they are enforced at deploy/activation time, not on a single push).

Failures are reported on the artifact/vector status with a clear reason; nothing is uploaded or activated.

## Deployment target

Following the deployer spec (§2), the administrator creates one `DeploymentTarget` per artifact type in the landscape namespace. `spec.artifactType` selects the static deployer; `spec.parameters` is deployer-defined (§2.2). The full S3 connection — `endpoint`, `bucket`, `region`, and access keys — lives in a referenced Secret; `parameters` only adds the Konfidence-specific `landscapePrefix`. Core never interprets `parameters`, so it gains no S3/CDN fields.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: static-prod
  namespace: kden-l-prod-fz8g86s6        # the landscape namespace
spec:
  artifactType: static.web.konfidence.cloud/v1alpha1  # versioned artifact type → selects this deployer
  parameters:                            # deployer-defined and -validated; opaque to core
    landscapePrefix: prod/                     # per-landscape boundary; keys are written relative to this
    credentialRef:
      name: static-prod-s3-creds         # Secret: endpoint, bucket, region, access keys
status:
  controller: konfidence.cloud/static-content-deployer:v0.1.0
  conditions:
    - type: Ready
      status: "True"
      reason: Accepted                   # the deployer sets this after validating parameters
```

Rules, from the deployer spec:

- One target per `<type-name>` per landscape namespace (§2.1); the deployer reconciles only its own `artifactType`, and after validating `parameters` it sets `Ready` and reports `controller` + `supportedArtifactTypeVersions` (§2.1–§2.2).
- The deployer defines and validates `parameters` (§2.2); core never interprets them, so it gains no S3/CDN fields.
- The deployer MAY use installation-wide defaults that apply to every landscape it serves (§2.2).
- The credential SHOULD be scoped to `landscapePrefix` so one landscape cannot write another's keys (best-effort; the deployer cannot always prove scope).

## Storage layout

All keys are written **relative to the target's configured prefix** (the per-landscape boundary). Nothing about project, landscape, or bucket is baked into the key.

```text
<artifact-deployment-name>/            # the app's files, uploaded unchanged
  index.html
  assets/app.4f1c.js                   # referenced under /_v/<artifact-deployment-name>/
_vectordata/<vector-id>/vector-data.json
<stage>/_active                        # the pointer
```

- `<artifact-deployment-name>` is core's deterministic, landscape-unique name (ADR-0034). Reusable apps share one name (and one folder); non-reusable ones get a distinct name per vector.
- `<vector-id>` is the vector deployment name — the same id used as `X-Vector-ID` elsewhere.

## Upload (the ArtifactDeployment phase)

1. Reconcile only `ArtifactDeployment`s of type `static.web.konfidence.cloud/v1alpha1`.
2. Add a finalizer, then fetch the files from OCM (verifying what OCM gives us) and upload them unchanged to `<artifact-deployment-name>/`.
3. Set the app's asset base to `/_v/<artifact-deployment-name>/` so asset URLs are version-stable. (The deployer knows this name before upload — it's the AD it is reconciling — so there is no chicken-and-egg with content hashes.)
4. Publish a `static-origin` deployment result (below) and report `Ready`.

## Deployment result and vector data

Every static app publishes the **same** result shape. Optional fields describe how it is used:

```json
// A navigable app (SPA, page, or shell): has a path + document.
{
  "name": "shop",
  "type": "static-web",
  "spec": {
    "assetBase": "/_v/shop-frontend-1.2.0-abc/",
    "path": "/",                  // present → navigable (gets a route in _active)
    "document": "index.html"      // present → the page served at that path
  }
}
```

```json
// A microfrontend remote: loaded by a shell, not navigable → assetBase + module, no path.
{
  "name": "checkout",
  "type": "static-web",
  "spec": {
    "assetBase": "/_v/checkout-0.9.1-def/",
    "module": "remoteEntry.js"    // present → importable by a shell; no path = no route
  }
}
```

`path` + `document` make a result **navigable** (it becomes a route in `_active`); `module` makes it **importable** by a shell. A remote with only `assetBase` + `module` has no route — the shell loads it by name through the `/_v/<ad>/` passthrough.

Core aggregates these into the vector's immutable `VectorData` (feature flags + authored config + results). The browser-safe bundle is written to `_vectordata/<vector-id>/vector-data.json`. Storage coordinates (bucket, prefix) are **never** placed in anything a browser can read.

## Activation (the pointer)

A separate activation step writes `<stage>/_active` — plain JSON, from the vector's whitelisted navigable (`static-web`) results:

```json
{
  "vectorId": "prod-7f3a",
  "vectorDataRef": "_vectordata/prod-7f3a/vector-data.json",
  "routes": [
    { "path": "/",      "ad": "shop-frontend-1.2.0-abc", "document": "index.html" },
    { "path": "/admin", "ad": "shop-admin-0.9.1-def",    "document": "index.html" }
  ]
}
```

`_active` lists only the **navigable routes**. Importable microfrontend remotes (`assetBase` + `module`, no path) are **not** in `_active` — the shell discovers them by following `vectorDataRef` to the vector-data bundle:

```json
// _vectordata/prod-7f3a/vector-data.json  — what vectorDataRef resolves to
{
  "vectorId": "prod-7f3a",
  "features": { "betaCheckout": true },
  "authored": { "public": { "theme": "dark" } },
  "results": [
    { "name": "shop",     "spec": { "assetBase": "/_v/shop-frontend-1.2.0-abc/", "path": "/", "document": "index.html" } },
    { "name": "admin",    "spec": { "assetBase": "/_v/shop-admin-0.9.1-def/", "path": "/admin", "document": "index.html" } },
    { "name": "checkout", "spec": { "assetBase": "/_v/checkout-0.9.1-def/", "module": "remoteEntry.js" } }
  ]
}
```

So a fetch of `<stage>/_active` gives the routes **and** a `vectorDataRef`; the shell then fetches that bundle (served as `/__vector-data.json`) and reads `results` to discover each remote's `assetBase` + `module`.

- Flipping the pointer is the whole activation. No files move.
- **One writer** (the leader-elected controller), and core already orders activations per stage, so no compare-and-swap or version fencing is needed.
- Mode is **Immediate**: flip when the activation runs (the vector is already fully deployed). Coordinating "serve the UI last" across runtimes is deferred.
- Opt-in exposure: only whitelisted apps get a route, so only they are **navigable** (reachable as a page) and listed in the bundle. Their raw files remain fetchable via the `/_v/<ad>/` passthrough if the URL is known — see Security.

## Serving (the edge resolver)

The admin's CDN (one distribution per stage) splits paths **before** the resolver runs: whichever paths the admin assigns to the gateway (commonly `/api/*`, but it can be any path or set of paths they choose) go straight to the gateway origin; everything else goes to the static origin, where the resolver runs. So the resolver only ever sees the static paths the admin routed to it — never the gateway-owned ones.

The static origin points at the target's prefix and runs a small request-time resolver with three rules:

```text
1. /_v/<ad>/*            → serve <ad>/*            (immutable; no pointer read)
2. /__vector-data.json   → read _active, serve vectorDataRef
3. any other static path → read <stage>/_active, longest-prefix match routes,
                           serve <ad>/<document>   (SPA fallback to the document;
                           no matching route → 404, never a fallback to another app)
```

This resolver is **identical** for one app, many apps, or microfrontends — the layout lives in `_active` data, not in the resolver.

Konfidence can provide the resolver through an optional, deployer-owned **`EdgeResolver`**:

- **Default — render only.** It generates the resolver snippet for the admin to install. No credentials, no CDN access.
- **Optional — push.** A `driver` plus a `RawExtension` (CDN-specific settings and a `credentialRef` to a secret) lets Konfidence apply the resolver to the admin's CDN. This is the only place Konfidence holds CDN credentials, and it is opt-in and per-stage.

`EdgeResolver` is deployer-owned (core gains no CDN fields). The resolver logic is the same everywhere and comes from the driver; the CR only carries where and how to push.

```yaml
# Render only (default): generate the snippet, install it yourself. No credentials.
apiVersion: static.web.konfidence.cloud/v1alpha1
kind: EdgeResolver
metadata:
  name: shop-prod
spec:
  mode: render
  driver: cloudflare           # which CDN the resolver targets
status:
  rendered: |
    // Cloudflare Worker — generated resolver for stage "prod".
    // Bindings (wrangler.toml): BUCKET (R2) + vars STAGE and LANDSCAPE_PREFIX.
    export default {
      async fetch(request, env) {
        const path = new URL(request.url).pathname;
        const prefix = env.LANDSCAPE_PREFIX;        // e.g. "prod/"
        const stage = env.STAGE;                    // e.g. "prod"

        // 1. Version-stable assets: /_v/<ad>/* -> immutable passthrough (no pointer read)
        const asset = path.match(/^\/_v\/([^/]+)\/(.*)$/);
        if (asset) return serve(env, prefix + asset[1] + "/" + asset[2], true);

        // Read the stage pointer (plain JSON; no signing in v1)
        const ptrObj = await env.BUCKET.get(prefix + stage + "/_active");
        if (!ptrObj) return new Response("no active pointer", { status: 503 });
        const ptr = JSON.parse(await ptrObj.text());

        // 2. Config bundle
        if (path === "/__vector-data.json")
          return serve(env, prefix + ptr.vectorDataRef, false);

        // 3. Navigable routes: longest-prefix match, SPA fallback to the document
        const route = matchRoute(ptr.routes, path);
        if (!route) return new Response("not found", { status: 404 });
        const rest = path.slice(route.path.length).replace(/^\/+/, "");
        const exact = await env.BUCKET.get(prefix + route.ad + "/" + (rest || route.document));
        if (exact) return respond(exact, false);
        return serve(env, prefix + route.ad + "/" + route.document, false);
      },
    };

    function matchRoute(routes, path) {
      let best = null;
      for (const r of routes) {
        const base = r.path === "/" ? "/" : r.path + "/";
        if (path === r.path || path.startsWith(base))
          if (!best || r.path.length > best.path.length) best = r;
      }
      return best;
    }

    async function serve(env, key, immutable) {
      const obj = await env.BUCKET.get(key);
      if (!obj) return new Response("not found", { status: 404 });
      return respond(obj, immutable);
    }

    function respond(obj, immutable) {
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("etag", obj.httpEtag);
      headers.set("cache-control", immutable
        ? "public, max-age=31536000, immutable"   // /_v/ assets never change
        : "no-cache");                             // entry doc + bundle: always fresh
      return new Response(obj.body, { headers });
    }
---
# Optional push: Konfidence applies the resolver to the admin's CDN.
apiVersion: static.web.konfidence.cloud/v1alpha1
kind: EdgeResolver
metadata:
  name: shop-prod
spec:
  mode: push
  driver: cloudfront           # same field; selects the CDN
  config:                      # RawExtension — driver-specific, opaque to core
    distributionId: E123ABC
    functionName: konf-shop-prod
    credentialRef:             # reference to a Secret, never inline creds
      name: cloudfront-edge-creds
status:
  conditions:
    - type: Pushed
      status: "True"
    - type: Converged
      status: "True"
    - type: Ready
      status: "True"
```

`driver` always names the CDN; `mode` chooses render vs push; `config` and `credentialRef` apply only to `push`.

## Request flow (example)

For `my.shop.com/`:

```text
GET /                     → resolver reads <stage>/_active → route "/" → shop-frontend-…/index.html
GET /_v/shop-frontend-…/* → passthrough (immutable, cached long)
GET /__vector-data.json   → resolver reads _active → _vectordata/<vector-id>/vector-data.json
GET /api/...              → admin path rule → gateway (carries the vector id) → backend
```

Only `/` and `/__vector-data.json` read the pointer. Everything else is immutable `/_v/` passthrough.

## One app, many apps, or microfrontends

All three use the same result shape and the same resolver. The difference is only which fields are set and what the browser does:

- **Single-page app** — one app with `path` `/` and a `document`. One route.
- **Several apps on paths** — each app sets its own `path` + `document`. Several routes. Longest-prefix match picks the right one; deep links fall back to that app's document.
- **Microfrontends** — one shell app (`path` `/`) plus remotes that set `module` (and usually no `path`). The shell:
  1. loads and boots from `/`,
  2. fetches `/__vector-data.json`, **pins the vector id**, and reads the `results` as a registry,
  3. builds an import map from each remote's `assetBase + module`,
  4. imports each remote from `/_v/<ad>/…` (passthrough) and calls its `mount(element, ctx)`.

The shared `ctx` is `{ vectorId, flags, config, shared deps }` — all from the one pinned bundle. Because every remote URL comes from that single immutable bundle, the shell and all remotes are the **same vector**; there is no version skew. Composition happens entirely in the browser; the edge only serves files.

## Caching

- The **deployer sets no cache headers**. Caching is the admin's CDN configuration.
- Asset URLs are version-stable (`/_v/<artifact-deployment-name>/…`), so the admin can safely cache them for a long time. A new version produces new URLs — nothing to invalidate.
- Only the entry document and the vector-data bundle change on activation — they are the mutable surface. Since v1 has no CDN purge, the admin should serve these **fresh** (no edge caching, or revalidate on every request) so an activation is visible immediately. The heavy files (assets) are still cached long, so serving the small entry document and bundle uncached costs almost nothing.

## Cleanup and retention

- The deployer adds a finalizer and, on delete, removes **its own folder** (`<artifact-deployment-name>/`).
- This is safe even when apps are shared: with `allowReuse`, core creates **one** shared `ArtifactDeployment` owned by many vectors, so the folder is deleted only when no vector uses it anymore. Without reuse, each vector has its own folder. Per-ArtifactDeployment cleanup is therefore always correct — no cross-deployment reference counting in the deployer.
- Optional **`undeployGracePeriod`** (default `0` = delete immediately). Set it to e.g. a few hours so an open browser tab can still fetch a chunk shortly after undeploy. Implemented by holding the finalizer and deleting after the window — no bucket lifecycle rule and no CDN access needed.

## Security and multi-tenancy

- The bucket is **private**; the CDN is the only reader.
- **One credential + prefix per landscape.** The `DeploymentTarget` is the tenant boundary; the deployer writes relative to its prefix.
- **Uploaded is not navigable unless routed** — only apps with a route in `_active` can be reached as a page. But raw bytes under `/_v/<ad>/` are served by the passthrough to anyone who knows the URL (the AD-name hash is obscurity, not access control), so static artifacts must never contain secrets — the same as any CDN-served static content.

## Not in the first version (deferred)

- **Signing the pointer and per-asset integrity (SRI).** Interim trust is the private bucket plus the per-landscape credential. Signing can be added later without structural change.
- **Version fencing / compare-and-swap.** A single writer plus core's per-stage ordering is enough.
- **Coordinated cross-runtime activation** ("serve the UI only after everything else is live"). First version uses Immediate; this needs core's cross-runtime ordering.
- **Edge key-value store.** The resolver reads the pointer from the bucket.
- **Content-hash deduplication.** Addressing by `ArtifactDeployment` name is simpler and makes cleanup correct.
- **Session stickiness.** The browser already pins its vector id from the bundle and can pass it on `/api` calls, so the plumbing to carry a vector id exists today. What is deferred is *honouring* it to keep an open tab on its original vector across a switch — so for now, after activation an old tab may call the new backend or request a removed asset. Stickiness can be added later without changing this design.
- **Multi-region convergence.**

