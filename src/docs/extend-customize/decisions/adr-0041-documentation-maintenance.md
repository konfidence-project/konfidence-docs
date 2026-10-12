---
id: ADR-0041
title: "Documentation maintenance and quality checks"
description: "Maintain documentation through focused automated checks, source-owned references, and human review, with a separate AI review pilot."
status: draft
date_proposed: 2026-10-12
authors: [skradde]
category: Technology Stack
impact: Medium
dependencies: [ADR-0025, ADR-0033]
pageClass: adr
outline: deep
---

# ADR-0041: Documentation maintenance and quality checks

<AdrHeader />

## Context

Konfidence documentation needs a repeatable maintenance process after its first
release. Contributors should catch broken content early without spending more
time maintaining checks than those checks save in review.

The documentation repository already has VitePress, a pnpm build, pull request
checks, REUSE validation, GitHub Pages deployment, and Dependabot updates. It also
synchronizes generated CLI, CRD, Helm, and API references from the product
repositories. The [style guide](../styleguide.md),
[guide templates](../guide-templates.md), and
[glossary](../../reference/glossary.md) provide the editorial baseline.

These foundations leave several gaps:

- The build alone does not validate prose, frontmatter conventions, or every
  rendered link fragment and image reference.
- Vue components, VitePress containers, and explicit heading IDs need rules that
  understand the site's conventions. Generic Markdown defaults can create noise.
- The API view and draw.io diagrams render in the browser. Static checks cannot
  establish that readers can use them.
- Generated references currently follow upstream `main`. Release documentation
  needs identifiable, compatible source versions and fixes at the source.
- Technical accuracy, reader experience, and recurring maintenance need explicit
  owners and a process that continues when an author is unavailable.

The decision covers documentation checks and their operating model. It does not
replace VitePress, introduce a CMS, or define a new product release policy.
Automated checks supplement technical and editorial review.

## Considered options

### Option 1: Keep the current build and rely on manual review

This adds no tooling and preserves the current contribution process. However,
reviewers repeatedly check formatting, links, metadata, and terminology by hand.
Problems in unchanged pages remain easy to miss, and maintenance depends on
individual availability. This does not address the recurring work sufficiently.

### Option 2: Add focused checks to the existing workflow (chosen)

Use one tool for each distinct need, share configuration between local use and CI,
and separate reproducible failures from advisory findings. Keep technical facts
under human ownership and correct generated content upstream.

This requires initial rule calibration and ongoing version updates. In return,
contributors get actionable feedback without adopting another publishing system
or maintaining overlapping linters.

### Option 3: Introduce a broader editorial platform or AI-led review gate

A CMS, overlapping lint suites, and an AI reviewer could provide more authoring
assistance. They would also add configuration, integration work, and findings
whose usefulness needs separate evaluation. AI output cannot reliably determine
technical correctness or act as a reproducible merge condition.

Defer these additions until a measured gap justifies their maintenance cost.

## Decision

We adopt option 2: extend the existing documentation workflow with focused
checks, shared maintenance responsibilities, and a separately evaluated AI pilot.
The following describes the intended implementation; acceptance of the design
does not by itself establish that the checks are operational.

### Tool selection

| Tool | Use and rationale | Scope of enforcement |
| --- | --- | --- |
| [markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2), using [markdownlint](https://github.com/DavidAnson/markdownlint) | Check Markdown structure, code fence labels, link syntax, and tables within the existing Node workflow. | Selected rules become blocking after calibration. Allow Vue, containers, explicit IDs, and frontmatter alongside an H1. Do not impose line length as a quality gate. |
| [Vale](https://vale.sh/) | Enforce a small executable subset of the style guide and approved terminology. | Start with five to ten project rules. Unambiguous terminology errors may become blocking; contextual style advice stays advisory. Protect code, identifiers, and historical quotations. |
| [lychee](https://github.com/lycheeverse/lychee) | Check links and fragments in built HTML, plus external targets in a separate scheduled run. | Missing local targets, fragments, and static image files become blocking. External failures do not block unrelated PRs. |
| [gray-matter](https://github.com/jonschlinkert/gray-matter) and [Ajv](https://ajv.js.org/guide/getting-started.html) | Parse frontmatter and validate small schemas for the repository's content types. | Malformed metadata and duplicate ADR IDs become blocking. Match VitePress parsing and existing conventions. |
| [Playwright with axe-core](https://playwright.dev/docs/accessibility-testing) | Add targeted browser checks for navigation, search, hydrated API content, diagrams, images, and selected accessibility rules. | Introduce after the static checks. Only reproducible browser failures and calibrated accessibility rules become blocking. |

[Linkinator](https://github.com/JustinBeckwith/linkinator) is a viable alternative
to lychee, including fragment and clean-URL support. Prefer lychee for the proposed
offline build checks and separate cached network scan. Validate that choice
against this repository before rollout; if it fails the compatibility cases,
evaluate Linkinator as a replacement rather than running both.



Keep Dependabot as established in [ADR-0033](./adr-0033-dependabot.md).
Defer CSpell, Prettier, and Front Matter CMS until spelling, formatting, or editing
friction demonstrates a need. API schema linting and reference generation belong
with their upstream sources. Executable documentation examples are a separate,
bounded follow-up rather than permission to run every code block.

### Shared content policy

Keep content profiles and ownership in `docs-maintenance/content-policy.json`.
Use it for tool adapters and derive the publication set from VitePress configuration
or build output. Avoid copying exclusion lists into each tool's configuration.

- **Authored pages:** apply Markdown, prose, metadata, and rendered-link checks.
- **Generated references:** check metadata appropriate to the generator, build
  output, links, and provenance. Do not apply editorial autofixes to generated
  CLI, CRD, Helm, or API files.
- **ADRs:** validate the filename and ID, unique IDs, field types, and the statuses
  defined in the [ADR conventions](./index.md). Preserve historical decisions;
  missing legacy optional fields must not prevent adoption of the checks.
- **API wrappers, landing pages, and repository root documents:** use appropriate
  profiles for metadata, headings, and site versus GitHub link resolution.
- **Unpublished pages:** exclude from publication quality gates and restore their
  applicable checks automatically when they become part of the site.

Require non-empty titles and descriptions for ordinary authored pages. Do not add
mandatory owner, audience, and review-date fields to every page. Store area owners
and actual review records centrally. Exceptions need a narrow scope, reason,
responsible role or team, and review date.

### Local and CI checks

Expose the same commands locally and in GitHub Actions:

| Planned command | Contract |
| --- | --- |
| `pnpm docs:lint` | Run the selected Markdown and Vale rules against their content profiles. |
| `pnpm docs:metadata` | Validate frontmatter and ADR consistency before sidebar generation. |
| `pnpm docs:links:local` | Check all built HTML pages offline, including fragments and static image references. |
| `pnpm docs:check` | Run lint, metadata validation, the existing build, and local link checks in that order. |
| `pnpm docs:links:external` | Produce a separate report of external link results. |
| `pnpm docs:smoke` | Run the browser checks against the built site once they are introduced. |

Pin tool versions when implementing the checks and use the lockfile for Node
dependencies. Provide documented installation paths for the Vale and lychee
binaries. No version combination is considered validated by this ADR alone.

For local links, enable fragment validation and resolve root-relative paths,
directory indexes, and VitePress URLs against `.vitepress/dist`. Inspect every
built HTML page rather than only pages reachable by crawling the homepage. Do not
reuse network cache results for local checks.

Run external checks weekly with bounded concurrency, timeouts, and retries.
Cache successful results for at most 24 hours. Distinguish missing targets from
authentication failures, rate limits, and temporary outages; report exclusions
explicitly. Start with job summaries and artifacts rather than repeated bot
comments or automatically opening an issue for each failure.

Add a stable `docs-quality` status to the existing PR workflow and require it for
merge after calibration. Ordinary docs PRs, reference-sync PRs, and Dependabot PRs
must all receive the check. Deployment must depend on successful required checks
in the main-branch workflow as well. Preserve REUSE and existing required checks.
If path filtering is used, ensure it cannot leave a required status pending.

Browser checks cover a key getting-started path, sidebar navigation, search, a
known API entry after hydration, a rendered diagram, and a loaded image. Use a
pinned viewer fixture for deterministic diagram tests and a separate advisory
check against the live external viewer. A website smoke test does not prove that
CLI installation, cluster operations, or complete accessibility work.

### Sources, ownership, and recurring maintenance

Product changes must record their documentation impact or explain why none is
needed. Link related product and documentation changes. Technical owners verify
behavior and examples; the technical writer or editorial backup reviews reader
needs, structure, and wording. Maintainers own check configuration and exceptions;
the release owner confirms compatible source versions. Document these roles and
backups in the maintenance runbook. Use `CODEOWNERS` for routing, with explicit
evidence of both technical and editorial review for substantive content changes.

Keep generated references synchronized through PRs and fix errors at the source
or in the transformation. Record both upstream revisions and every copied
artifact. Use an explicit manifest of compatible core and orchestrator revisions
for release documentation; label development documentation that follows `main`.
This complements the support policy in
[ADR-0025](./adr-0025-release-strategy.md). A versioned documentation portal is a
separate decision.

Ensure sync automation actually starts required checks without manual intervention.
Use the existing GitHub App to create and update sync PRs where needed, and verify
the complete trigger path. A bot approval is not evidence that checks ran.
Automerge must wait when a generated artifact fails validation.

Triage link, dependency, and sync findings weekly. Start with a 30-minute triage
budget and investigate recurring noise if that budget is regularly exceeded.
Assess key getting-started and operations guides for review needs at least every
30 days and other active guides every 90 days. Product changes trigger review
immediately. A commit timestamp or successful build is not a technical review.

### AI assistance as a separate pilot

Start with a writer-review and re-review checklist. Evaluate it across three to
five real reviews before promoting it to a shared skill at
`.agents/skills/docs-writer-review/SKILL.md`.

The pilot must:

1. Identify the reviewed commit, base, reader task, and scope; read full affected
   pages, relevant context, and existing review discussions.
2. Check structure and missing reader steps before wording. Require evidence,
   counterchecks, and a concrete reader impact for every finding.
3. Verify re-review findings against the changed text, not only a resolved thread.
4. Separate necessary changes, optional suggestions, and follow-ups. Produce short
   English comment drafts with verified file, diff side, and line anchors.
5. State uncertainty and test limits. Allow a review with no findings.

Human reviewers remain responsible for technical claims and publishing decisions.
The skill does not authorize posting comments, resolving threads, or merging.
AI findings are not required CI checks. Reuse the repository's editorial guidance
and contribution rules without introducing a second style guide.

Evaluate both correctly resolved cases and deliberately introduced reader problems;
an always-empty review is not success. Require no unsupported mandatory findings,
invented technical claims, or unauthorized publication. Compare review time and
corrections with the existing workflow before team adoption. Draft restructuring,
documentation-impact analysis, and journey audits remain later checklist pilots.
Known terminology rules belong in Vale.

### Implementation sequence and acceptance

Deliver the work in independently reviewable increments:

| Phase | Deliverables | Acceptance evidence |
| --- | --- | --- |
| 1. Profiles and responsibilities | `docs-maintenance/content-policy.json`, runbook, ownership routing, and PR template. | All source groups have a profile; generated and unpublished files are handled explicitly; backups are assigned. |
| 2. Static checks in advisory mode | `.markdownlint-cli2.jsonc`, `.vale.ini`, project styles, frontmatter schemas, validation script, and `lychee.toml`. | Valid Vue syntax, containers, explicit IDs, and frontmatter plus H1 pass. Deliberately broken metadata, duplicate ADR IDs, Markdown, local targets, fragments, and image paths fail their checks. |
| 3. CI and source provenance | Shared commands, calibrated `docs-quality` gate, weekly maintenance workflow, source manifest, and sync workflow changes. | Normal, sync, and Dependabot PRs receive checks; a broken sync artifact prevents automerge; failed required checks prevent deployment; an external rate limit does not block an unrelated PR. |
| 4. Browser coverage | Playwright configuration, smoke tests, and selected axe checks. | Missing images, empty API content, failed diagram rendering, and broken search are detected. Live external dependencies remain separate from deterministic PR checks. |
| 5. Handover and evaluation | Contributor instructions, failure triage, exception procedure, and jointly reviewed trial PRs. | A developer and technical writer or their backups can run the checks and handle a content PR and a sync PR using the runbook. |
| Separate pilot | Review checklist, evaluation cases, and a shared skill only after successful evaluation. | Three to five human-reviewed runs meet the AI criteria above and demonstrate useful assistance. |

Before making a rule blocking, fix existing violations or document narrow
exceptions. Review false positives jointly with the technical writer. If a new
rule proves unreliable, return that rule to advisory mode with a review date;
do not disable the full quality gate.

After four weeks, compare review effort, unusable findings, escaped defects, CI
duration, and rule maintenance time. Aim for fewer than 10% unusable findings in
a writer-reviewed sample and no increase in total maintenance effort. These are
evaluation targets, not measured results. Reduce or remove checks that fail to
justify their recurring cost.

## Consequences

### Positive

- Contributors get consistent local and CI feedback for repeatable problems.
- Technical and editorial review can focus on accuracy and reader needs.
- Generated content has traceable sources and follows the same merge protection
  as authored changes.
- Maintenance continues through documented ownership, backups, and triage.
- AI assistance can be evaluated without making it a dependency of the core
  documentation workflow.

### Negative

- The repository gains configuration, schemas, tool binaries, and browser tests
  that need version updates and owners.
- Rule calibration and initial cleanup require developer and writer time.
- Browser tests add CI cost; external links and viewers still need human triage.
- Passing checks cannot establish technical truth, complete accessibility, or
  successful execution of documented product workflows.

### Deferred

- A CMS migration, full documentation versioning, and comprehensive executable
  examples remain separate decisions.
- Additional AI skills and authoring tools require evidence of reduced effort
  before adoption.
