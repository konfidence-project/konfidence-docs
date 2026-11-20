---
id: ADR-0047
title: "Documentation versioning strategy"
description: "Propose a versioning strategy for the Konfidence documentation."
status: draft
date_proposed: "2026-11-13"
authors: [skradde, AnsgarH1]
category: Architecture Pattern
impact: High
dependencies: [ADR-0025]
pageClass: adr
outline: deep
---

# ADR-0047: Documentation versioning strategy

<AdrHeader />

## Context

The documentation currently has no separate release versions.

Users need documentation that matches the Konfidence version they use. Development continues on `main` after a release. Without separate documentation versions, instructions can describe features that are not yet available or miss changes that have already shipped.

The documentation stays in its own repository. It covers Konfidence and the [Kubernetes Landscape Orchestrator](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) (KLO) and must also accommodate future deployers.

## Decision

We propose separate documentation for published releases and ongoing development. Release documentation describes the behavior available in the corresponding release. Development documentation follows work on `main` and is clearly marked as unreleased.

Under this proposal, published documentation can receive corrections and missing explanations that apply to its release. Relevant corrections also need to reach other maintained versions, including development documentation.

## Open questions

The team needs to resolve the following questions:

### Release scope and readiness

- What defines the final release contents, and when do we confirm them?

- Who checks that the documentation covers those contents and excludes later changes?

- How do we handle missing documentation at release time?

### Versioned references and compatibility

The default command in [Install the `kden` CLI](../../getting-started/install-cli.md) downloads a published command-line interface (CLI) release. The installer script comes from `main`. Pinning the CLI release does not pin the script.

We need to decide how to keep the instructions consistent with the documented release:

- Which CLI and deployer versions should each documentation version use? Can it use newer versions if compatibility with the documented Konfidence release is verified?
- Which scripts and specification links need a fixed tag or commit? How do we keep the versions installed by the quickstart aligned with the documented release?
- Who verifies the selected version combinations, and which checks must be repeated when the CLI, installer script, or deployed components change?

### Version names

We propose showing **main** with a **Development** label. Published releases use their full version number, without separate stability labels. The default view shows the documentation for the published release with the highest version number. This can be a pre-release.

Should that release also carry a **Latest** label?

### Publishing and navigation

How should readers access different documentation versions?

- **Separate subdomains:** Each version has its own site, for example `v0-1.docs.konfidence.cloud` and `main.docs.konfidence.cloud`.
- **Versioned paths:** Versions share one site, for example `docs.konfidence.cloud/0.1/` and `docs.konfidence.cloud/main/`.

These URLs illustrate the options; the domain and version names remain open.

Both approaches can provide a version selector. Should switching versions retain the current page when it exists in the target version?

The choice has implications for hosting and maintenance:

- **Subdomains:** Established VitePress sites such as [Vite](https://v7.vite.dev/) and [Vitest](https://v3.vitest.dev/) publish older versions on separate subdomains, linked through their navigation. This allows each version to be built and deployed independently. Our current single-repository GitHub Pages setup cannot host separate sites per version because [GitHub Pages allows only one site per repository](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages). Adopting this approach would require separate publishing repositories, an additional routing layer, or a different host, along with domain and deployment configuration for each version.
- **Versioned paths:** These fit the current GitHub Pages hosting model. We could build each version separately with its own base path and combine the outputs into one deployment. We would maintain the build assembly and version navigation ourselves, including preserving older versions when publishing updates. A versioning plugin is not required for this approach.
- **Plugin dependency:** The previously considered [`vitepress-versioning-plugin`](https://github.com/IMB11/vitepress-versioning-plugin) is archived. The alternative [`@viteplus/versions`](https://github.com/viteplus/versions) is active, but we have not established broad production adoption. Relying on it would introduce a maintenance risk: compatibility problems with future VitePress releases could require us to maintain a fork or replace the plugin. A selector that links separate builds avoids that dependency, but we would own its behavior and upkeep.

Should we retain GitHub Pages and maintain the build and navigation logic for versioned paths, or change the hosting setup to support independently deployed subdomains?

### Support window

How many documentation versions should we maintain, and which releases count as separate versions?

Should documentation maintenance follow the software support window?

One option is to maintain the three most recent stable versions and hide older versions from the version selector. This is a suggestion for team discussion. Would older pages remain available through direct links?

### Component versions

Do deployers (currently the KLO) have a release cycle independent of Konfidence, or are they expected to? If so, how should their versions map to documentation versions?

## Consequences

Maintaining several documentation versions means checking which versions each change affects. Release preparation includes reviewing documentation across the repositories involved.

If maintained documentation uses newer CLI releases or changing installer scripts, updates may require compatibility checks against the documented platform version.

## Related ADRs

[ADR-0025: Release on demand via manual tags](./adr-0025-release-strategy.md) defines the software release process, separate component release cycles, and support for the latest and previous minor version.

The documentation versioning work is tracked in [story #343](https://github.com/konfidence-project/konfidence-project/issues/343).
