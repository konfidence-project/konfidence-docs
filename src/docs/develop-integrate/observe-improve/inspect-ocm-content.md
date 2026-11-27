---
title: Inspect OCM content
description: Inspect vector and artifact content and compare two vectors using the Konfidence API and UI.
outline: [ 2, 3 ]
editLink: true
lastUpdated: true
---

# Inspect OCM content

Konfidence exposes three read endpoints that give you direct access to the OCM data behind your vectors and artifacts:

- **Vector content** - the component list and vector configuration (feature flags and authored config) for one or more
  vectors.
- **Artifact content** - the type, tasks, resources, and reuse policy of a single artifact.
- **Vector diff** - a structured diff between two vectors, showing which components changed and how the vector
  configuration changed.

These capabilities are available through the Konfidence UI during the promotion flow, through the REST API, and through
the `kden` CLI.

Repeated requests for the same ref are served efficiently - the API server avoids redundant registry round-trips
by using a caching mechanism so response times stay consistent even under concurrent access or repeated page loads.

For architectural context, see [ADR-0045](../../extend-customize/decisions/adr-0045-ocm-content-layer.md).

## OCM ref strings

All three endpoints identify vectors and artifacts by their OCM ref string. The format is:

```
registry//component:version
```

For example:

```
registry.example.com//konfidence.io/payment-hub:1.0.0
```

The double slash (`//`) separates the registry host from the component path. This is an OCM convention and is not a
typo.

### URL percent-encoding

OCM ref strings contain characters (`/`, `:`) that have reserved meaning in URLs. When passing a ref as a query
parameter, percent-encode the entire ref string:

| Character | Encoded |
|-----------|---------|
| `/`       | `%2F`   |
| `:`       | `%3A`   |

Example:

```
registry.example.com%2F%2Fkonfidence.io%2Fpayment-hub%3A1.0.0
```

Most HTTP client libraries encode query parameters automatically. If you are constructing URLs by hand, encode the ref
before appending it.

## Authentication

All three endpoints require a bearer token. Pass it in the `Authorization` header:

```
Authorization: Bearer <token>
```

Obtain a token with `kden login` or by passing `--access-token` to any `kden` command. See
the [API reference](../../reference/api.md) for the full authentication flow.

## Vector content

Returns the component list and vector configuration for one or more vectors.

### API

```
GET /v1/projects/{projectId}/vectors/content?refs=<encoded-ref>&refs=<encoded-ref>
```

Pass `refs` once per vector. The parameter is repeated, not comma-separated:

```
?refs=registry.example.com%2F%2Fmy-org%2Fpayment-hub%3A1.0.0&refs=registry.example.com%2F%2Fmy-org%2Fpayment-hub%3A1.1.0
```

**Response shape:**

```json
{
  "data": [
    {
      "ref": "registry.example.com//my-org/payment-hub:1.0.0",
      "components": [
        {
          "componentName": "konfidence.io/checkout",
          "version": "2.3.1"
        },
        {
          "componentName": "konfidence.io/notifications",
          "version": "0.9.0"
        }
      ],
      "config": {
        "features": {
          "dark-mode": false,
          "new-checkout": true
        },
        "authored": {
          "max-retries": 3
        }
      }
    }
  ]
}
```

`config` is omitted from the response when the vector has no vector configuration.

### CLI

Pass `--refs` once per vector. The flag is repeatable:

```bash
kden vector content \
  --refs registry.example.com//my-org/payment-hub:1.0.0 \
  --refs registry.example.com//my-org/payment-hub:1.1.0 \
  --projectId <projectId>
```

The CLI accepts raw unencoded ref strings — percent-encoding is handled internally.

The default `--output pretty` prints one section per vector with three subsections: **Components**, **Features**, and **Authored**. Use `--output json` or `--output yaml` for machine-readable output or when config values contain maps or arrays that are truncated in the table view.

## Artifact content

Returns the type, tasks, resources, and reuse policy for a single artifact.

### API

```
GET /v1/projects/{projectId}/artifacts/content?ref=<encoded-ref>
```

**Response shape:**

```json
{
  "ref": "registry.example.com//my-org/checkout:2.3.1",
  "type": "helm.deployer.konfidence.cloud",
  "allowReuse": false,
  "resources": [
    {
      "name": "checkout-chart",
      "type": "helmChart"
    }
  ],
  "tasks": [
    {
      "name": "run-migrations",
      "type": "k8s-job",
      "dependsOn": []
    }
  ]
}
```

`tasks` is omitted when the artifact declares no post-deployment tasks.

### CLI

```bash
kden artifact content \
  --ref registry.example.com//my-org/checkout:2.3.1 \
  --projectId <projectId>
```

The CLI accepts a raw unencoded ref string — percent-encoding is handled internally.

The default `--output pretty` prints the artifact type, reuse policy, resources, and tasks. Use `--output json` or `--output yaml` for machine-readable output.

## Vector diff

Returns a structured diff between two vectors. Use this to understand exactly what changed before promoting a new vector
version.

### API

```
GET /v1/projects/{projectId}/vectors/diff?left=<encoded-ref>&right=<encoded-ref>&includeUnchanged=false
```

`left` and `right` are both required. `includeUnchanged` is optional and defaults to `false`.

**`includeUnchanged` flag**

By default, the diff omits components and config entries that are identical in both vectors. Set `includeUnchanged=true`
to include them. This is useful when you want to verify the full component set rather than only the delta.

**Response shape:**

```json
{
  "left": "registry.example.com//my-org/payment-hub:1.0.0",
  "right": "registry.example.com//my-org/payment-hub:1.1.0",
  "components": [
    {
      "componentName": "konfidence.io/checkout",
      "changeType": "changed",
      "leftVersion": "2.3.1",
      "rightVersion": "2.4.0"
    },
    {
      "componentName": "konfidence.io/notifications",
      "changeType": "unchanged",
      "leftVersion": "0.9.0",
      "rightVersion": "0.9.0"
    }
  ],
  "config": {
    "features": [
      {
        "key": "new-checkout",
        "changeType": "changed",
        "leftValue": false,
        "rightValue": true
      }
    ],
    "authored": [
      {
        "key": "max-retries",
        "changeType": "unchanged",
        "leftValue": 3,
        "rightValue": 3
      }
    ]
  }
}
```

`config` is omitted when neither vector has a vector configuration.

### CLI

```bash
kden vector diff \
  --left registry.example.com//my-org/payment-hub:1.0.0 \
  --right registry.example.com//my-org/payment-hub:1.1.0 \
  --projectId <projectId>
```

The CLI accepts raw unencoded ref strings and percent-encoding is handled internally.

**`--include-unchanged` flag**

By default, unchanged components and config entries are omitted. Pass `--include-unchanged` to include them:

```bash
kden vector diff \
  --left registry.example.com//my-org/payment-hub:1.0.0 \
  --right registry.example.com//my-org/payment-hub:1.1.0 \
  --projectId <projectId> \
  --include-unchanged
```

The default `--output pretty` prints three sections: **Components**, **Features**, and **Authored**. Each row shows the component or key, its change type (color-coded), and the left and right values. Map values render inline as `map[key:value ...]` and arrays as `[value value ...]`. For entries with large or complex values, use `--output json` or `--output yaml` to see the full data.

## Diff change types

Each entry in `components`, `config.features`, and `config.authored` carries a `changeType` and the fields that go with
it:

| `changeType` | `leftVersion` / `leftValue` | `rightVersion` / `rightValue` |
|--------------|-----------------------------|-------------------------------|
| `added`      | absent                      | present                       |
| `removed`    | present                     | absent                        |
| `changed`    | present                     | present                       |
| `unchanged`  | present                     | present                       |

`unchanged` entries appear only when `includeUnchanged=true` is set.

## UI: vector diff in the promotion flow

When a [vector promotion](../../deploy-operate/manage-delivery/promote-vectors.md) reaches a stage, Konfidence shows
a diff between the incoming vector and the vector currently deployed to that stage. This gives reviewers a focused view
of what will change before they approve or reject the promotion.

The diff view in the UI uses the same data as the vector diff endpoint. It shows:

- **Components** - which artifact versions changed, were added, or were removed.
- **Features** - feature flag values that changed between the two vectors.
- **Authored config** - authored configuration entries that changed.

Unchanged entries are hidden by default. The UI provides a toggle to include them.

## API reference

For the full parameter descriptions, error responses, and schema definitions, see
the [OpenAPI spec](../../reference/api.md).
