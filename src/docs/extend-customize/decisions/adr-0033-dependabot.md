---
id: ADR-0033
title: "Dependabot for code dependency updates"
description: "Dependabot updates all code dependencies; Renovate stays only for hermit and Helm, which Dependabot cannot handle"
status: accepted
authors: [nirnanaaa]
category: Technology Stack
impact: Medium
dependencies: [ADR-0011]
pageClass: adr
outline: deep
---
# ADR-0033: Dependabot for code dependency updates

<AdrHeader />

## Context

ADR-0011 §3 chose Renovate (the hosted GitHub App) for automated dependency
updates, configured through a shared preset in the `.github` repository.

While preparing the repositories for open-source publication, we found
reasons to rethink this:

- **Security alerts and update PRs live in different systems.** GitHub
  reports vulnerable dependencies through Dependabot alerts, but the PRs
  that fix them came from Renovate. The two are not connected. In practice
  this gap was real: `konfidence` had 7 open critical alerts and no update
  PRs at all.
- **GitHub's security tooling expects Dependabot.** GitHub's security overview,
  dependency graph, and compliance checks build on Dependabot. A
  third-party bot in public repositories is one more account to explain
  and audit.
- **Coverage gaps went unnoticed.** Renovate only works on repositories
  granted to the app. `konfidence` and `kubernetes-landscape-orchestrator`
  were never in that list, so they received no update PRs at all — and
  nothing surfaced this. Dependabot is active wherever a config file exists
  in the repository, which makes coverage visible in the repository itself.

Dependabot cannot do everything Renovate does. It has no support for
**hermit**-pinned tools (used in every code repository) and none for
**Helm** charts and values (`konfidence`,
`kubernetes-landscape-orchestrator`).

## Considered Solutions

### Option 1: Keep Renovate for everything (status quo)

**Pros:**
- One updater covers all ecosystems, including hermit and Helm.
- Flexible grouping and automerge rules, already configured.

**Cons:**
- Not connected to GitHub security alerts.
- Third-party app and bot account in public repositories.
- The coverage gap described above stays invisible.

### Option 2: Dependabot for everything

**Pros:**
- Everything in one GitHub-native system.

**Cons:**
- hermit and Helm would get no update PRs at all. Toolchains and charts
  would drift unnoticed.

### Option 3: Dependabot for code, Renovate only for hermit and Helm (chosen)

**Pros:**
- All code dependencies (gomod, npm, pip/uv, bundler, gradle, docker,
  github-actions) move to the GitHub-native updater.
- Nothing loses coverage: Renovate keeps the two sources Dependabot cannot
  handle.
- Alerts and the PRs that fix them come from the same system.

**Cons:**
- Two updaters stay in use, though with strictly separate scopes.
- Dependabot's grouping is less flexible than Renovate's. In particular,
  it cannot group updates across ecosystems.

## Decision

We adopt **Dependabot for all code dependencies, with Renovate scoped down
to hermit and Helm**.

1. **Dependabot version updates.** Every repository has
   `.github/dependabot.yml` covering its code ecosystems on a weekly
   schedule. Minor and patch updates are grouped per ecosystem; major
   updates arrive as single PRs. Commits use `chore(deps):` to follow
   Conventional Commits.
2. **Renovate is scoped, not removed.** The shared preset
   (`.github/renovate-config/presets/base.json5`) sets
   `enabledManagers: [hermit, helmv3, helm-values]`. Hermit minor/patch
   updates keep platform automerge. All repositories extend this preset.
3. **Automerge via GitHub App.** A reusable workflow
   (`konfidence-project/.github/.github/workflows/dependabot-automerge.yaml`)
   reads the update type with `dependabot/fetch-metadata` and queues minor
   and patch PRs for auto-merge (`gh pr merge --auto --rebase`) using a
   token from the existing `konfidence-bot` app. Callers trigger on
   `pull_request_target` because Dependabot-triggered `pull_request` runs
   cannot read Actions secrets; the workflow checks out no code. Major
   updates always wait for a maintainer.
4. **Guard rails.** "Allow auto-merge" is enabled on all repositories.
   Repositories with PR CI (`konfidence`,
   `kubernetes-landscape-orchestrator`) require the `CI Gate / CI Gate`
   status check, so auto-merge waits for green CI. Dependabot alerts and
   security updates are enabled everywhere.

## Consequences

### Positive

- Dependency updates, security alerts, and fix PRs live in one
  GitHub-native system that GitHub's security tooling understands.
- Update coverage is declared per repository in `dependabot.yml` instead of
  in an app's repository-access list, so gaps are visible where they matter.
- Fewer moving parts owned by a third party in public repositories.

### Negative

- Two updaters remain until Dependabot supports hermit and Helm; the
  Renovate app cannot be uninstalled yet.
- Repositories without PR CI (`konfidence-docs`, `example-app`, `.github`)
  auto-merge minor/patch updates without a test gate. Adding CI there is a
  follow-up.
- Version families that must move in lock-step across ecosystems (e.g. an
  npm package with a matching Docker image) end up as separate PRs, since
  Dependabot cannot group across ecosystems.

### Neutral

- Conventional Commits remain mandatory; Dependabot is configured to
  comply.
- The Renovate app stays installed but only produces hermit and Helm PRs.

## Related ADRs

- **Supersedes**: ADR-0011 §3
  (Automated Dependency Updates with Renovate) for code ecosystems. Renovate
  remains authoritative for hermit and Helm only.
