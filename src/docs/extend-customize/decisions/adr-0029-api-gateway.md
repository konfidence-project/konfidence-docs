---
id: ADR-0029
title: "API gateway conventions and design"
description: "Establishes the HTTP framework, API contract, error schema, client generation strategy, and domain handler placement for the Konfidence API gateway"
status: accepted
date_approved: 2026-07-09
authors: [AleksandarMuradyan]
category: Architecture Pattern
impact: High
dependencies: [ADR-0023, ADR-0026]
pageClass: adr
outline: deep
---
# ADR-0029: API gateway conventions and design

<AdrHeader />

## Context

[ADR-0026](./adr-0026-galaxy-star-single-cluster.md) established a dedicated HTTP API gateway at the border of the star cluster. Consumers: kden CLI, Star Dashboard, external UIs.

This ADR defines the conventions all future API work must follow: HTTP framework, API contract, error schema, auth, client generation, and domain handler placement.

API shape changes must be reviewable at contract level without Go knowledge — the API is part of the external developer experience.

## Considered Solutions

### HTTP Framework

| Option       | `net/http` compatible                                                                      | Works with oapi-codegen | Stakeholder-reviewable contract |
|--------------|--------------------------------------------------------------------------------------------|-------------------------|---------------------------------|
| **Gin**      | no — custom `gin.Context`; requires adapter shims with `controller-runtime` and Prometheus | via adapter             | contract lives in Go code       | 
| **Fiber**    | no — built on `fasthttp`; incompatible with `controller-runtime` webhooks and Prometheus   | via adapter             | contract lives in Go code       | 
| **chi v5** ✓ | yes — pure stdlib; every handler is `http.HandlerFunc`; testable with `net/http/httptest`  | native                  | spec first                      |

chi v5 is also the most widely adopted lightweight Go router (~18k GitHub stars), with a large ecosystem of compatible middleware and long-term community backing.

### API Design Artifact and Toolchain

Three options evaluated against the same Stage endpoint example.

### Option A — OpenAPI YAML + oapi-codegen (spec-first) - selected

Write `api/openapi.yaml` by hand. `oapi-codegen` generates a `StrictServerInterface`. Handlers that diverge from the spec do not compile.

```yaml
paths:
  /stages:
    get:
      operationId: listStages
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: "#/components/schemas/StageListResponse" }
  /stages/{name}:
    get:
      operationId: getStage
      parameters:
        - { name: name, in: path, required: true, schema: { type: string } }
      responses:
        "200":
          content:
            application/json:
              schema: { $ref: "#/components/schemas/StageResponse" }
        "404": { $ref: "#/components/responses/NotFound" }
```

Generated interface (compile-time contract):

```go
// internal/api/openapi/server.go — generated, do not edit
type StrictServerInterface interface {
    ListStages(ctx context.Context, request ListStagesRequestObject) (ListStagesResponseObject, error)
    GetStage(ctx context.Context, request GetStageRequestObject)     (GetStageResponseObject, error)
}
```

Domain handler — current prototype uses mocked data; production implementation replaces the mock with a real k8s client call:

```go
// internal/stage/api/handler.go
type StageHandler struct{ k8s func() client.Client }

func Mount(r chi.Router, _ *slog.Logger, k8s func() client.Client) {
    h := &StageHandler{k8s: k8s}
    openapi.HandlerWithOptions(openapi.NewStrictHandler(h, nil), openapi.ChiServerOptions{
        BaseURL:    "/api/v1",
        BaseRouter: r,
    })
}

func (h *StageHandler) ListStages(_ context.Context, _ openapi.ListStagesRequestObject) (openapi.ListStagesResponseObject, error) {
    return openapi.ListStages200JSONResponse{Items: mockStages}, nil
}

func (h *StageHandler) GetStage(_ context.Context, req openapi.GetStageRequestObject) (openapi.GetStageResponseObject, error) {
    for _, s := range mockStages {
        if s.Name == req.Name {
            return openapi.GetStage200JSONResponse(s), nil
        }
    }
    return openapi.GetStage404JSONResponse{...}, nil
}

// compile error if handler diverges from spec:
var _ openapi.StrictServerInterface = (*StageHandler)(nil)
```

Workflow:
1. Write `api/openapi.yaml` PR — everyone reviews, no Go required
2. PR merged, team aligned on contract
3. `make generate-api` — generates `StrictServerInterface`
4. Backend, Dashboard, CLI implement in parallel against the agreed spec

**Evaluation**

- **Pros:**
  - Contract is a plain YAML file — reviewable by all stakeholders (backend, frontend, CLI, dashboard) without Go knowledge
  - Parallel implementation: backend, Dashboard, and CLI can implement against the agreed spec simultaneously
  - Compile-time enforcement — a handler that diverges from the spec does not compile
  - oapi-codegen is mature and widely adopted
- **Cons:**
  - YAML must be written and reviewed before any implementation begins
  - Generated interface adds some handler boilerplate

### Option B — Go types + Huma (code-first)

[Huma](https://huma.rocks/) wraps chi and generates OpenAPI 3.0 from Go struct tags via reflection. Spec served live at `GET /openapi.json`.

```go
type StageResponse struct {
    Name       string           `json:"name"`
    Namespace  string           `json:"namespace"`
    Vector     string           `json:"vector"`
    Conditions []StageCondition `json:"conditions"`
}

func RegisterRoutes(api huma.API, k8s func() client.Client) {
    huma.Register(api, huma.Operation{
        OperationID: "list-stages",
        Method:      http.MethodGet,
        Path:        "/api/v1/stages",
    }, func(ctx context.Context, _ *struct{}) (*struct{ Body StageListResponse }, error) {
        // handler body
    })
}
```

**Evaluation**

- **Pros:**
  - No separate YAML; spec always current
  - Built-in request validation and docs UI
- **Cons:**
  - Non-Go stakeholders cannot review the contract until Go code exists — blocks parallel implementation
  - No compile-time enforcement
  - Low adoption (~5k stars, v2 launched 2024) compared to chi (~18k stars) and the broader `net/http` ecosystem

### Option C — TypeSpec (spec-first, language-agnostic)

[TypeSpec](https://typespec.io/) compiles to OpenAPI, JSON Schema, and Protobuf. More concise than raw YAML.

```typescript
@route("/api/v1/stages")
interface Stages {
    @get list(): { items: StageResponse[] };
    @get @route("{name}") get(@path name: string): StageResponse | NotFoundError;
}
```

Workflow: Write `.tsp` → `tsp compile` → OpenAPI YAML → `oapi-codegen` → Go interface (same as Option A from here).

**Evaluation**

- **Pros:**
  - More concise than raw YAML
  - Compile-time schema validation
  - Multi-format output (OpenAPI, JSON Schema, Protobuf)
- **Cons:**
  - New tool with no team familiarity — Microsoft-backed project with a narrower community than established Go tooling
  - Extra compilation step (`tsp compile` → YAML → codegen)
  - Overkill for current team size and API surface

## Decision

**HTTP framework: chi v5. API toolchain: Option A — OpenAPI YAML + oapi-codegen.**

### Design Decisions

1. **HTTP framework.** chi v5. All handlers are `http.HandlerFunc`; all middleware is `func(http.Handler) http.Handler`. No adapter layer required alongside `controller-runtime`.

2. **API contract.** Spec-first via `api/openapi.yaml`. `oapi-codegen` generates `StrictServerInterface`. A handler that diverges from the spec is a compile error. The YAML is reviewed as a PR before any implementation begins.

3. **Response shape.** Single resources are returned directly; collections are wrapped in a `data` field:
   - Single resource: returned directly, no wrapper
   - Collection: `{ "data": [] }`

   ```json
   GET /api/v1/stages/prod → { "name": "prod", "vector": "...", "conditions": [...] }
   GET /api/v1/stages      → { "data": [ ... ] }
   ```

   Using a dedicated `data` key for collections follows common API conventions and keeps single-resource responses clean and flat.

4. **Error shape.** All errors use a single envelope regardless of origin:

   ```json
   { "error": { "code": "not_found", "message": "stage \"prod\" not found" } }
   ```

   - `code`: machine-readable, snake_case, stable. Standard values and their HTTP status codes:

     | `code`                  | HTTP status |
     |-------------------------|-------------|
     | `bad_request`           | 400         |
     | `unauthorized`          | 401         |
     | `forbidden`             | 403         |
     | `not_found`             | 404         |
     | `conflict`              | 409         |
     | `internal_server_error` | 500         |

   - `message`: human-readable, safe to display. Never includes internal detail.
   - Internal causes are logged server-side only.

5. **Domain handler placement.** `internal/api/` is infrastructure only (router, middleware, server lifecycle). Domain HTTP handlers live next to their domain:

   ```
   internal/
     stage/
       api/             ← handler, DTOs, mapping, Mount()
       internal/
         controller/    ← reconciler
     api/
       handler/         ← probe endpoints only (healthz, readyz)
       middleware/      ← logging, error handling, recovery
       router/          ← MountFunc wiring
       server/          ← http.Server lifecycle
   ```

6. **Route registration.** Each domain exposes a `Mount(r chi.Router, logger *slog.Logger, k8s func() client.Client)` function. Registered explicitly in `cmd/api/cmd/root.go`:

   ```go
   // current bootstrap — one domain registered
   return server.New(parsed, stageapi.Mount).Run(ctx)

   // pattern for additional domains
   server.New(parsed, stageapi.Mount, vectorpromotionapi.Mount, ...)
   ```

7. **Contract rules.**
    - Handlers must never return CRD types directly. Always map to dedicated DTO structs.
    - The spec diff is reviewed before merge. Any leaked field or unintended shape change must be fixed before merge.

8. **Client generation.** `api/openapi.yaml` is the single source for all generated clients: `internal/kden/apiclient/` (Go) and the Star Dashboard (TypeScript-node) have to generate their clients.

9. **Kubernetes client.** Built lazily on first domain request via `ctrl.GetConfig()`. Resolves via `KUBECONFIG` env var or in-cluster config. Server starts and serves probes without a cluster.

10. **Health probes.** `/healthz` and `/readyz` return `{"status":"ok"}` statically. Liveness must never depend on an external system.

## Consequences

**Positive:**
- Single committed spec drives all consumers — no client drift
- Domain handlers co-located with domain logic — changes are self-contained
- Consistent error shape — clients handle one format
- chi composes cleanly with `controller-runtime`
- Explicit `MountFunc` registration keeps the dependency graph visible

**Negative:**
- Every new endpoint requires a YAML change before implementation
- Domain handler placement — `internal/<domain>/api/` not `internal/api/handler/`
- New domain requires one explicit line in `cmd/api/cmd/root.go`

## Open Questions

1. **Authentication and authorization.** Auth flow and role-based access control are to be defined in a dedicated ADR.

2. **Readiness probe active check.** `/readyz` should perform a bounded Kubernetes connectivity check once the lazy client is initialized. Requires a short timeout and circuit-breaker to avoid cascading failures.

## Related ADRs

- [ADR-0023](./adr-0023-repo-structure.md) — monorepo structure
- [ADR-0026](./adr-0026-galaxy-star-single-cluster.md) — resolves Open Questions #2 (dedicated aggregation service vs. direct cluster API access)