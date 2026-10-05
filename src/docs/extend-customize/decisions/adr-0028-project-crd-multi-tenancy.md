---
id: ADR-0028
title: "Project CRD and multi-tenancy authorization"
description: "Introduce a cluster-scoped Project CRD that owns a project namespace and defines a role-based authorization model over group- and OIDC-based subjects"
status: accepted
date_approved: 2026-07-15
authors: [nirnanaaa]
category: Security
impact: High
dependencies: [ADR-0004, ADR-0026]
pageClass: adr
outline: deep
---
# ADR-0028: Project CRD and multi-tenancy authorization

<AdrHeader />

## Context

There is currently no boundary between one team's galaxy resources
(VectorTemplate, VectorPromotion, stage configuration, …) and another's, and no
place to express who may do what within such a boundary.
[ADR-0026](./adr-0026-galaxy-star-single-cluster.md) left open whether this calls
for a dedicated project mechanism or only an authorization mechanism. The
answer is both, and one CRD carries both cheaply: a namespace for isolation
plus a declarative authorization model. The namespace is what gives each
project real resource isolation, its own naming space, and a clean blast radius
when it is deleted.

Two kinds of callers shape the authorization side. Humans authenticate
interactively and carry group memberships. Workloads — typically CI
pipelines — authenticate with short-lived OIDC tokens whose claims (`sub`,
`repository`, `ref`, `environment`, …) decide what the pipeline may do.

One word of disambiguation: this is *platform* tenancy, isolating Konfidence's
own operator-facing users and resources. It is not the application/end-customer
tenancy of ADR-0004, which deliberately keeps
application tenancy out of the core. The two are orthogonal; this ADR does not
change ADR-0004's stance. The glossary is updated to distinguish **Project**
from **Tenant**.

## Decision

Introduce a cluster-scoped **`Project`** CRD
([PR #67](https://github.com/konfidence-project/konfidence/pull/67), issue
[#54](https://github.com/konfidence-project/konfidence/issues/54)) whose
controller reconciles a project namespace, and define a role-based
authorization model in `spec.roleBindings` that the Konfidence API server
enforces.

The controller creates and owns one namespace per Project — `kden-project-<name>`
by default, overridable and immutable via `spec.namespace` — labeled
`konfidence.cloud/type: project` and `konfidence.cloud/project: <name>`, and
tied to the Project by a controller owner reference. A finalizer deletes the
namespace and waits for it to terminate before the Project is released.
Deleting a Project deletes the namespace and everything in it.

`spec.roleBindings` maps a role name to a list of subjects; a caller holds a
role if any subject in the list matches. Roles are a fixed, well-known set
today (admin, pm, dev), but the field is a map precisely so the set can grow
without a schema change.

```yaml
spec:
  roleBindings:
    admin:
      - session:
          memberOf: [platform-admins]
      - jwks:
          endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
          audience: https://konfidence.example/api
          claims:
            sub: repo:konfidence-project/konfidence:*
    pm:
      - session:
          memberOf: [project-pms]
    dev:
      - session:
          memberOf: [project-devs]
```

A subject is one of two kinds today. A `session` subject matches an interactive
user by group membership — membership in any listed `memberOf` group counts. A
`jwks` subject matches a workload token: the token is verified against the OIDC
discovery `endpoint` (the provider's `.well-known/openid-configuration`), must
carry the `audience` the subject names, and is then narrowed by `claims`, a map
of claim name to a glob pattern (`*` matches any run of characters — glob, not
regular expressions, as authorizers commonly use). Both an `audience` and at
least one claim are required — the audience so a token minted for another
service cannot be replayed against Konfidence, and a claim so a subject cannot
inadvertently match every token a provider issues. Claims are a map rather than
a single `sub` field because OIDC tokens carry more useful claims than the
subject (repository, ref, environment, …) and providers format subjects
differently anyway.

Every listed claim must match — this is an AND, deliberately unlike the OR used
for `session.memberOf`. A workload identity is granted by narrowing its token as
tightly as possible (pinning `sub` and often more alongside the audience), so
each claim is a required constraint; loosening any one would widen access rather
than add an alternative.

The subject is an open union: supporting another kind of identity later means
adding a new optional field next to `session` and `jwks`, which is a
backward-compatible schema change, so hardcoding just these two now costs
nothing in future flexibility.

The roles are described at the level of intent, on purpose — the concrete
permission model is not settled yet:

| Role | Intent |
|------|--------|
| **admin** | Full control of the project: manage its `roleBindings`, the project lifecycle, and everything in the project namespace. |
| **pm** | Manage the delivery process: promotion flows and stage configuration, and approve promotions. Cannot change `roleBindings`. |
| **dev** | Read-only / observability: deployment status, logs, artifact and vector details — anything a developer needs to look at. No mutating actions. |

Because `roleBindings` is a map, adding or splitting roles later is
non-breaking.

### Authorization granularity

Authorization is at the level of API endpoints and resource kinds, not
individual fields. A role grants access to whole resource kinds and the verbs
allowed on them; an endpoint the caller holds no granting role for is rejected
outright. The API server does not project or redact individual fields — if a
role may read a kind, it reads whole objects of that kind. A role's observability
intent (a `dev` seeing status but not mutating configuration) is therefore
expressed by *which* endpoints and kinds the role is granted, not by hiding
fields within a resource.

Two finer-grained models are deliberately out of scope for now:

- **Field-level filtering** — exposing only part of a resource, such as hiding
  credential references from a `dev`. This would push per-field policy into the
  API handlers and possibly the schema, and the complexity is not justified
  before we understand the endpoints and the shape of their responses.
- **Per-object authorization** — distinguishing individual objects of the same
  kind, for example granting `Stage` `dev-1` but not `dev-2` within one project.
  A role applies to a kind across the whole project, never to a single object.

Both can be revisited later without changing the `roleBindings` shape.

### Authorization flow

Enforcement is performed by the Konfidence API server. For a request like
`GET /projects/:id/stages`:

1. Resolve the Project and load its `roleBindings`.
2. Match the caller: an interactive user by intersecting their groups with each
   `session` subject's `memberOf`; a workload by validating the presented
   bearer token against the OIDC providers named by the project's `jwks`
   subjects, then matching each `claims` pattern against the token's claims.
3. The union of matched roles decides what the request may do — which endpoints
   and resource kinds it may reach, with which verbs.

Concretely for GitHub Actions: the pipeline requests a token with
`id-token: write`, sends it as a bearer token, and the server resolves the
project, finds a `jwks` subject whose endpoint validates the token, and checks
the claims before granting the role.

## Consequences

This is the first cluster-scoped CRD in the codebase and the first controller
that creates namespaces, with the RBAC and finalizer handling that implies.
Per-role permissions are deliberately still undefined, so consumers must not
assume a frozen permission matrix. In return, isolation and authorization live
in one declarative, auditable place, and human and workload identities are
modeled uniformly.

Because these rules live above the Kubernetes API, plain Kubernetes RBAC cannot
enforce them: granting a caller direct kube-apiserver access to a project
namespace bypasses the authorization layer entirely. Project users must reach
their resources only through the Konfidence API server, and a team that needs
direct `kubectl` access has to run its own star instance rather than share the
managed one.

## Open Questions

1. **Provider trust.** Are `jwks` endpoints trusted per-project as written on
   the Project, or must providers be pre-registered at the platform level and
   only referenced?
2. **Role permissions.** What each role concretely permits and how visibility
   narrows. This lives in the authorization layer, not the CRD.

## Related ADRs

- **Related to**: [ADR-0026](./adr-0026-galaxy-star-single-cluster.md) — answers
  its open question on project tenancy: both a project mechanism and an
  authorization mechanism, via one CRD.
- **Related to**: ADR-0004 — orthogonal axis of
  tenancy; ADR-0004 keeps application tenancy out of core, this introduces
  platform tenancy. Neither supersedes the other.
