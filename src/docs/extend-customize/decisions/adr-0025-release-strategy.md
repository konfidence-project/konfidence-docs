---
id: ADR-0025
title: "Release on demand via manual tags"
description: "Maintainers cut releases by pushing SemVer tags; a tag-triggered pipeline builds them"
status: accepted
authors: [nirnanaaa]
category: Deployment
impact: Medium
dependencies: [ADR-0011, ADR-0023]
pageClass: adr
outline: deep
---
# ADR-0025: Release on demand via manual tags

<AdrHeader />

## Context

ADR-0011 §2 and §5 release on every push to `main`: `semantic-release` computes
the next version from conventional commits and creates the tag and GitHub
release automatically. After consolidating into a monorepo (ADR-0023) and adding
user-facing artifacts, this model no longer fits:

- Half-baked features merged to `main` ship straight to users as versions.
- Maintainers have no control over *when* a release happens or what it contains.
- Frequent, often irrelevant version bumps flood downstream dependency-update
  systems and obscure the changelog.
- Release quality depends entirely on commit-message hygiene.
- Coordinating docs, blog posts, and multi-component releases is hard.

We need releases to be deliberate acts, while keeping `main` continuously
building deployable artifacts for integration environments.

## Considered Solutions

### Option 1: Release on every push to `main` (status quo)

`semantic-release` auto-tags and releases per ADR-0011.

**Pros:**
- Zero release ceremony; fast cycles for integration environments.
- Already implemented.

**Cons:**
- All the problems listed in Context: no control, supply-chain noise, leaking
  unfinished work, changelog churn.

### Option 2: Fixed release cadence

Release on a schedule (e.g. every two weeks).

**Pros:**
- Predictable; room to coordinate docs and announcements.

**Cons:**
- Too rigid for the current project scope and team size.
- Either ships incomplete scope to hit the date, or skips empty cycles.

### Option 3: Release on demand on scope achievement (chosen)

A maintainer pushes a SemVer tag when a meaningful scope is done; a tag-triggered
pipeline produces the release. `main` keeps building artifacts on every push.

**Pros:**
- Maintainer controls timing and contents; only intentional releases reach
  users.
- Decouples continuous deployability (every `main` commit) from user releases.
- Backports to supported minors are straightforward.

**Cons:**
- Manual step; relies on maintainers to tag.
- Requires a release script and a tag-triggered pipeline to be built.

## Decision

We adopt **release on demand on scope achievement**.

1. **Manual tagging.** A permitted maintainer chooses the next SemVer version and
   pushes the tag. There is no automatic release on `main`.
2. **Two pipelines.** The `main` pipeline builds deployable artifacts on every
   push. A separate **release pipeline** triggers on a pushed SemVer tag, reuses
   those artifacts, re-runs the full test suite, and creates the GitHub release
   (binaries with embedded version/sha, docker images, Helm charts to `ghcr.io`,
   a checksummed artifact manifest, and grouped release notes).
3. **`semantic-release` is demoted to changelog generation.** Conventional
   commits still drive changelog grouping and serve as version-bump guidance, but
   no longer trigger releases.
4. **Per-repo cycles.** `konfidence-core` (controllers + CRDs, plus the
   ui/cli/api binaries) and `kubernetes-landscape-orchestrator` release
   independently. Core makes no compatibility promise to the orchestrator; the
   orchestrator pins a core version and is tested against core's latest +
   previous minor.
5. **Support window.** We support the latest and previous minor version. Hotfixes
   land on `release/vX.Y` branches and ship as patch tags while that minor is in
   support.

A release script (`./hack/release.sh major|minor|patch`) and a tag-triggered
pipeline implement this decision. The end-to-end
process is documented in the [Release Process](https://github.com/konfidence-project/.github/blob/main/semantic-release/README.md).

## Consequences

### Positive

- Releases are deliberate; unfinished work no longer auto-ships to users.
- Integration environments still get fresh artifacts from every `main` commit.
- Cleaner changelogs and fewer irrelevant downstream update PRs.
- Backports and patch releases for supported minors are well-defined.

### Negative

- Releasing now requires a manual maintainer action.
- New tooling (release script + tag-triggered pipeline) must be built and
  maintained per repo.

### Neutral

- Conventional Commits remain mandatory — their role shifts from trigger to
  changelog and bump guidance.

## Related ADRs

- **Supersedes**: ADR-0011 §2
  (Versioning) and §5 (Branching and Release Flow) — the automatic
  release-on-`main` flow. The rest of ADR-0011 (CRD sync, Renovate, GitHub App
  auth) still stands.
- **Related to**: [ADR-0023](./adr-0023-repo-structure.md) — the monorepo structure
  this release model targets.
