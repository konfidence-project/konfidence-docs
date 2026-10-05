---
id: ADR-0023
title: "Monorepo with separate binaries"
status: proposed
date_proposed: 2026-04-29
dependencies: []
pageClass: adr
outline: deep
---
# ADR-0023: Monorepo with separate binaries

<AdrHeader />

## Context

Today the Konfidence codebase is spread across multiple repositories. Each repo has its own release pipeline, its own CI setup, and its own set of open PRs. Shared types (CRDs, OCM helpers) are duplicated or pulled in as Go modules with version skew, and changes that cross repository boundaries require coordinated PRs that are easy to get wrong.

We have two distinct runtime concerns:

- **Galaxy** — the management-plane controllers (e.g. `VectorAssembly`, `PromotionConfig`).
- **Star** — the workload-plane controller(s) running on managed clusters.

Both share CRD definitions, OCM utilities, and large parts of the controller-runtime scaffolding. They are developed by the same team and almost always change together.

A separate piece — the kubernetes landscape (deployment) orchestrator — has a different lifecycle and a less-clear scope today. This orchestrator serves the purpose of handling the entire deployment lifecycle of a vector against a target landscape.

## Decision

We will consolidate Galaxy, Star, and the `kden-cli` into a single monorepo:

```
konfidence-project/konfidence/
├── apis/                          # kubebuilder CRD types (single source of truth)
├── cmd/
│   ├── galaxy/
│   │   ├── app/root.go            # mgr.Register(vectorassembly...), mgr.Register(promotion...)
│   │   └── main.go
│   ├── star/
│   │   └── main.go
│   └── kden-cli/
│       └── main.go
├── config/                        # generated kubebuilder output + samples
├── helm/
│   ├── galaxy/
│   ├── galaxy-crds/   (TBD)
│   ├── star/
│   ├── star-crds/     (TBD)
│   └── ui/            (TBD)
├── internal/
│   ├── galaxy/
│   │   ├── vectorassembly/        # controller.go + *_test.go co-located
│   │   ├── vectorpromotion/
│   │   └── ...
│   └── star/
│       ├── stage/ 
│       ├── activation/
│       └── ...
├── pkg/
│   └── ocm/                       # shared, externally importable helpers
└── tests/
```

Key choices:

1. **One repo, multiple binaries.** Galaxy and Star are built from the same module. CRDs, OCM helpers, and shared utilities live in one place and are referenced directly — no cross-repo version pinning. The multi binary approach is necessary because this keeps the star binary small and auditable, for example for FIPS-validated builds
2. **Controller selection via flag.** Each binary registers all controllers it could run, then enables a subset at startup using a `--controllers` glob flag:

    - `--controllers=*` — run everything
    - `--controllers=VectorAssembly` — run only that one
    - `--controllers=!VectorAssembly,*` — run everything except that one

    This lets us split workloads across pods (one controller per leader-election lease) without rebuilding binaries.

3. **Tests live next to code.** Per-domain `controller_test.go`, `integration_test.go`, and `suite_test.go` sit beside `controller.go`. Cross-cutting tests live in `tests/`.
4. **Platform/Deployment specific landscape orchestrator stays separate.** It will live in its own repo. The repo name will be `kubernetes-landscape-orchestrator`. This makes konfidence extensible to other platform/deployment orchestrators in the future (e.g. CloudFoundry or other platform-specific deployers), and keeps the scope of the monorepo focused on the core functionality.
The controllers will be split up as follows:

    ```
    konfidence-project/konfidence
    ├── Galaxy
    │   ├── gcp-vector-assembly-controller
    │   ├── gcp-stage-configuration-controller
    │   └── gcp-vector-promotion-controller
    └── Star
        ├── landscape-gcp-sync-controller
        ├── landscape-stage-controller
        ├── landscape-vector-activation-controller
        ├── landscape-task-orchestration-controller
        └── landscape-vector-deployment-controller

    konfidence-project/kubernetes-landscape-orchestrator
    ├── landscape-kubernetes-task-execution-controller
    ├── landscape-kubernetes-activation-execution-controller
    └── landscape-flux-deployer
    ```

## Consequences

**Positive**

- One PR can change a CRD, both controllers, and the Helm chart atomically.
- No more version-skew bugs between Galaxy and Star on shared types.
- We establish a clean application-level policy on remaining consistent communication standards within major versions.
- One CI pipeline, one release process, one place to look for issues.
- New contributors clone one repo and have a working dev loop.
- The `--controllers` flag gives operators flexibility to split or combine controllers without code changes.

**Negative / costs**

- CI runs get longer because the test surface is larger — we will need to keep an eye on build times and add caching/parallelism where it matters.
- A monorepo concentrates blast radius: a bad merge can break Galaxy and Star at once. Mitigated by per-package test isolation and the fact that they ship as separate binaries.

## Open Questions

- **UI.** Where does it live? Options: (a) inside `konfidence/` under `ui/` and a `cmd/ui/` or `web/` directory, (b) its own repo. Decision deferred — depends on whether the UI ships on the same release cadence as the controllers.
- **Helm CRD charts.** Do we ship `galaxy-crds` and `star-crds` as separate sub-charts, or fold CRDs into the main charts? Lean toward separate, so CRDs can be installed/upgraded independently of the operator.
