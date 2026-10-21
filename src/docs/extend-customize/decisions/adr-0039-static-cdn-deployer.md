---
id: ADR-0039
title: "Static content deployer"
description: "Upload static web apps to object storage and activate them by advancing a per-stage pointer that an administrator-owned CDN resolves at request time."
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

This deployer serves **static web apps** — built HTML/JS/CSS delivered as files, not a running process. It uploads those files to S3-compatible object storage and activates a version through an administrator-owned CDN.

Uploaded files are **immutable**: a new version is a new set of files. Activation never rewrites files — it advances **one per-stage pointer** that the CDN resolves at request time. Consequences: activation is a single small write, rollback is a pointer move, and caching is safe because the bytes behind any given URL never change.

The design is provider-neutral and covers a single-page app, several apps on distinct paths, or microfrontends.

## New concepts

- **Pointer (`_active`)** — a per-stage file naming the active version and its routes. Advancing it is what "activation" does here.
- **Resolver** — an edge function that reads the pointer and serves the right files at request time.

## Decision at a glance

1. New artifact type `static.web.konfidence.cloud/v1alpha1`; payload is one folder of built files.
2. Upload files **unchanged** into a folder named after the `ArtifactDeployment`.
3. Serve assets from a **version-stable base** `/_v/<artifact-deployment-name>/` so an in-flight tab never 404s when a new version goes live.
4. Activation advances **one pointer per stage**; the admin's CDN resolves it at request time. No file is mutated.
5. One **result shape** and one **resolver** cover a single-page app, several apps on paths, or microfrontends.
6. Cleanup is finalizer-driven with an optional grace window. The deployer needs **no CDN access** and sets **no cache headers**.

## Lifecycle

1. **Package** the app as an artifact (files + labels).
2. **Configure storage** with a `DeploymentTarget`.
3. **Upload**: fetch from OCM, copy into the bucket, publish a deployment result.
4. **Activate**: a separate step advances the stage pointer.
5. **Serve**: the admin's CDN resolves the pointer and serves files.

## Scope — ownership

- The **administrator** owns the bucket, credentials, DNS, HTTPS, and the CDN, and chooses the public path split: some paths (commonly `/api`, but any they pick) route to Konfidence's gateway, the rest to static files.
- **Konfidence** owns only the files it writes and the stage pointer. It never configures the CDN and never learns the public hostname.
- The deployer is **one cluster-wide controller** (like the Kubernetes deployer). Tenants are isolated by the per-landscape `DeploymentTarget` (its own storage area + credential), not by anything baked into file paths.
- Builds on the [deployer spec](https://github.com/konfidence-project/konfidence/blob/main/deployer-specification/index.md), [ADR-0038](./adr-0038-artifact-type-deployer-selection.md) (type selection), [ADR-0037](./adr-0037-ingress-routing-and-activation.md) (routing), [ADR-0034](./adr-0034-artifact-deployment-naming.md) (naming), [ADR-0027](./adr-0027-landscape-deployment-target.md) (targets), and [ADR-0024](./adr-0024-vector-scoped-data-distribution.md) (vector data).

## Artifact packaging

An artifact is one folder of built files plus the standard `konfidence-manifest`. The author sets labels that tell the deployer how the app is served:

| Label | Meaning | Default |
| --- | --- | --- |
| `static.web.konfidence.cloud/entrypoint` | the HTML file to serve (the app's start page) | `index.html` |
| `static.web.konfidence.cloud/path` | the public path the app is served at | `/` (required if a vector has several static apps) |
| `static.web.konfidence.cloud/module` | optional: importable entry for a microfrontend (e.g. `remoteEntry.js`) | — |

**Validation.** The deployer defines checks that run on `kden` artifact push (upload) and again at deploy/activation time, rejecting a bad package before it serves:

- exactly one payload folder, and the `entrypoint` file exists;
- no path-escaping entries in the folder;
- well-formed labels (`path` valid; `module`, if set, resolves to a real file);
- **no two apps claiming the same `path`**, and no duplicate result `name`, within a vector. (Duplicate-path checks need the whole vector, so they run at deploy/activation time, not on a single push.)

Failures surface on the artifact/vector status with a reason; nothing is uploaded or activated.

## Deployment target

The administrator declares *where* files go via one `DeploymentTarget` per artifact type in the landscape namespace (deployer spec §2). `spec.artifactType` selects this deployer; `spec.parameters` is deployer-defined. The S3 connection (endpoint, bucket, region, keys) lives in a referenced Secret; `parameters` only adds the Konfidence-specific `landscapePrefix`. Core never interprets `parameters`, so it carries no S3/CDN fields.

```yaml
apiVersion: konfidence.cloud/v1alpha1
kind: DeploymentTarget
metadata:
  name: static-prod
  namespace: kden-l-prod-fz8g86s6        # the landscape namespace
spec:
  artifactType: static.web.konfidence.cloud/v1alpha1  # selects this deployer
  parameters:                            # deployer-defined; opaque to core
    landscapePrefix: prod/               # this landscape's prefix; all keys are written under it
    credentialRef:
      name: static-prod-s3-creds         # Secret: endpoint, bucket, region, access keys
status:
  controller: konfidence.cloud/static-content-deployer:v0.1.0
  conditions:
    - type: Ready
      status: "True"
      reason: Accepted                   # set by the deployer after validating parameters
```

Rules, from the deployer spec:

- One target per artifact type per landscape (§2.1). The deployer reconciles only its own `artifactType`, and after validating `parameters` sets `Ready` and reports its `controller` version (§2.1–§2.2).
- The deployer defines and validates `parameters` (§2.2); core never interprets them.
- The deployer MAY use installation-wide defaults applying to every landscape it serves (§2.2).
- The credential SHOULD be limited to `landscapePrefix` so one landscape cannot overwrite another's files (best-effort; the deployer cannot always prove scope).

## Storage layout

Everything is written **under the target's `landscapePrefix`**. Nothing about project, landscape, or bucket is encoded in the keys — the prefix already isolates the landscape.

```text
<artifact-deployment-name>/            # one app's files, uploaded unchanged
  index.html
  assets/app.4f1c.js                   # referenced under /_v/<artifact-deployment-name>/
_vectordata/<vector-id>/vector-data.json   # the vector's runtime data
<stage>/_active                        # the pointer
```

- `<artifact-deployment-name>` is core's deterministic, landscape-unique name (ADR-0034). A reused app keeps one name (one folder); otherwise each vector gets its own.
- `<vector-id>` is the vector deployment name — the same id used as `X-Vector-ID` elsewhere.

## Upload

When core creates an `ArtifactDeployment` of this type, the deployer:

1. reconciles only type `static.web.konfidence.cloud/v1alpha1`;
2. adds a finalizer, fetches and verifies the files from OCM, and uploads them **unchanged** to `<artifact-deployment-name>/`;
3. rewrites the asset base to `/_v/<artifact-deployment-name>/` so asset URLs are pinned to this version. (The folder name is known before upload — it's the `ArtifactDeployment` being reconciled — so there's no chicken-and-egg with content hashes.)
4. publishes a deployment result (next section) and reports `Ready`.

## Deployment result and vector data

A deployment result tells the platform what was deployed and how to reach it. Every static app uses the **same shape**; optional fields encode how it is used.

Navigable app (`path` + `document`):

```json
{
  "name": "shop",
  "type": "static-web",
  "spec": {
    "assetBase": "/_v/shop-frontend-1.2.0-abc/",
    "path": "/",                  // present → navigable (becomes a route in the pointer)
    "document": "index.html"      // present → the page served at that path
  }
}
```

Microfrontend remote (`module`, no `path`):

```json
{
  "name": "checkout",
  "type": "static-web",
  "spec": {
    "assetBase": "/_v/checkout-0.9.1-def/",
    "module": "remoteEntry.js"    // present → importable by a shell; no path → no route
  }
}
```

`path` + `document` → **navigable**; `module` → **importable**. A result with only `assetBase` + `module` has no route — a shell loads it by name (see *One app, many apps, or microfrontends*).

Core aggregates every artifact's result into the vector's immutable **vector data** (feature flags + authored config + the app list) and writes the browser-safe copy to `_vectordata/<vector-id>/vector-data.json`. Storage coordinates (bucket, prefix) never appear in anything a browser can read.

## Activation

Activation writes the stage pointer, `<stage>/_active` — plain JSON listing the navigable routes and a link to the vector data:

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

The pointer carries only **navigable routes**. Microfrontend remotes (no `path`) are not here — they are resolved one hop further, via the vector-data bundle that `vectorDataRef` points to:

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

So one read of `<stage>/_active` yields the routes and a `vectorDataRef`; a shell then reads the bundle (served as `/__vector-data.json`) to discover each remote's `assetBase` + `module`.

Behavior:

- Advancing the pointer is the entire activation — no files move.
- **One writer** (the leader-elected controller), and core already orders activations per stage, so no compare-and-swap or version fencing is needed.
- Mode is **Immediate**: advance as soon as the activation runs (the vector is already fully deployed). Coordinating "serve the UI only after everything else is live" across runtimes is deferred.
- **Opt-in exposure**: only whitelisted apps get a route, so only they are navigable. (Their raw files remain fetchable by URL — see *Security*.)

## Serving (the edge resolver)

The CDN (one distribution per stage) **splits paths first**: the paths the admin assigned to the gateway (commonly `/api`, but any set they choose) go to the gateway; everything else goes to the static origin, where the resolver runs. The resolver therefore only sees static paths, never the gateway ones.

Three rules:

```text
1. /_v/<ad>/*            → serve <ad>/*            (version in the URL → immutable, no pointer read)
2. /__vector-data.json   → read _active, serve the vector-data bundle
3. any other static path → read <stage>/_active, longest-prefix match routes,
                           serve <ad>/<document>   (SPA fallback to the document;
                           no matching route → 404, never another app)
```

The resolver is identical for one app, many apps, or microfrontends — the layout lives in the pointer, not the resolver.

Konfidence can supply the resolver via an optional, deployer-owned **`EdgeResolver`**:

- **Render (default)** — generate the resolver for the admin to install. No credentials, no CDN access.
- **Push (optional)** — with a CDN driver and an admin-granted credential, Konfidence installs it. This is the only place Konfidence holds CDN credentials; opt-in, per stage.

`driver` names the CDN; `mode` chooses render vs push; `config` and `credentialRef` apply only to push.

```yaml
# Render (default): generate the snippet, install it yourself. No credentials.
apiVersion: static.web.konfidence.cloud/v1alpha1
kind: EdgeResolver
metadata:
  name: shop-prod
spec:
  mode: render
  driver: cloudflare
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
# Push (optional): Konfidence installs the resolver on the admin's CDN.
apiVersion: static.web.konfidence.cloud/v1alpha1
kind: EdgeResolver
metadata:
  name: shop-prod
spec:
  mode: push
  driver: cloudfront
  config:                      # driver-specific, opaque to core
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

## Request flow

A browser loading `my.shop.com/`:

```text
GET /                     → resolver reads <stage>/_active → route "/" → shop-frontend-…/index.html
GET /_v/shop-frontend-…/* → passthrough (immutable, cached long)
GET /__vector-data.json   → resolver reads _active → the vector-data bundle (flags, config, app list)
GET /api/...              → admin path rule → gateway (carries the vector id) → backend
```

Only `/` and `/__vector-data.json` read the pointer; everything else is immutable `/_v/` passthrough.

## One app, many apps, or microfrontends

All three share the result shape and the resolver; only which fields are set, and what the browser does, differ:

- **Single-page app** — one app, `path` `/` + a `document`. One route.
- **Several apps on paths** — each sets its own `path` + `document`. Several routes; longest-prefix match selects one, and deep links fall back to that app's `document`.
- **Microfrontends** — a shell app (`path` `/`) plus remotes with `module` (usually no `path`). The shell:
  1. loads and boots from `/`,
  2. fetches `/__vector-data.json`, **pins the vector id**, and uses `results` as a registry,
  3. builds an import map from each remote's `assetBase + module`,
  4. imports each remote from `/_v/<ad>/…` and calls its `mount(element, ctx)`.

The shared `ctx` (`{ vectorId, flags, config, shared deps }`) comes entirely from that one pinned bundle, so shell and remotes are the **same vector** — no version skew. The edge only serves files; composition is browser-side.

## Caching

- The **deployer sets no cache headers**; caching is the admin's CDN configuration.
- Asset URLs are **version-stable** (`/_v/<artifact-deployment-name>/…`) and can be cached indefinitely; a new version has new URLs, so there is nothing to invalidate.
- Only the start page and the vector-data bundle change on activation. With no CDN purge in v1, the admin serves those two **fresh** (uncached / always revalidate) so a new version is visible immediately. They are small; the heavy assets stay cached.

## Cleanup and retention

- The deployer holds a finalizer and, on delete, removes **its own folder** (`<artifact-deployment-name>/`).
- Correct even when shared: with `allowReuse`, core creates **one** `ArtifactDeployment` owned by several vectors, so the folder is removed only when the last vector stops using it. Without reuse, each vector has its own folder. Per-artifact cleanup is therefore always correct — no cross-deployment reference counting in the deployer.
- Optional **`undeployGracePeriod`** (default `0` = delete immediately). Set it to e.g. a few hours so an open tab can still fetch a chunk shortly after undeploy. Implemented as "hold the finalizer, delete after the window" — no bucket lifecycle rule, no CDN access.

## Security and multi-tenancy

- The bucket is **private**; the CDN is the only reader.
- **One credential + prefix per landscape.** The `DeploymentTarget` is the tenant boundary; the deployer writes only under its prefix.
- **Uploaded is not navigable unless routed** — only apps with a route in the pointer are reachable as a page. But raw files under `/_v/<ad>/` are served to anyone who knows the URL (the folder-name hash is obscurity, not access control), so static artifacts must never contain secrets — as with any CDN-served content.

## Not in the first version (deferred)

- **Signing the pointer and per-file integrity (SRI).** Interim trust is the private bucket plus the per-landscape credential. Addable later without structural change.
- **Version fencing / compare-and-swap.** One writer plus core's per-stage ordering is sufficient.
- **Coordinated cross-runtime activation** ("serve the UI only after everything else is live"). v1 uses Immediate; this needs core's cross-runtime ordering.
- **Edge key-value store.** The resolver reads the pointer straight from the bucket.
- **Content-hash deduplication.** Naming folders after the `ArtifactDeployment` is simpler and keeps cleanup correct.
- **Session stickiness.** The browser already pins its vector id and can send it on `/api` calls, so the plumbing exists. Deferred is *honouring* it to keep an open tab on its original version across a switch — so for now an old tab may call the new backend or request a removed asset. Addable later without changing this design.
- **Multi-region convergence.**
