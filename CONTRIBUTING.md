# Contributing to an SAP Open Source Project

## General remarks

You are welcome to contribute content (code, documentation etc.) to this open source project.

There are some important things to know:

1. You must **comply with the license of this project** and **accept the Developer Certificate of Origin** (see below) before being able to contribute. The acknowledgement to the DCO will usually be requested from you as part of your first pull request to this project.
2. Please **adhere to our [Code of Conduct](https://github.com/konfidence-project/.github/blob/main/CODE_OF_CONDUCT.md)**.
3. If you plan to use **generative AI for your contribution**, please see our guideline below.
4. **Not all proposed contributions can be accepted**. Some features may fit another project better or don't fit the general direction of this project. Of course, this doesn't apply to most bug fixes, but a major feature implementation for instance needs to be discussed with one of the maintainers first. Possibly, one who touched the related code or module recently. The more effort you invest, the better you should clarify in advance whether the contribution will match the project's direction. The best way would be to just open an issue to discuss the feature you plan to implement (make it clear that you intend to contribute). We will then forward the proposal to the respective code owner. This avoids disappointment.

## Developer Certificate of Origin (DCO)

Contributors will be asked to accept a DCO before they submit their first pull request to this project. This happens automatically during the submission process. SAP uses [the standard DCO text of the Linux Foundation](https://developercertificate.org/).

## Contributing with generative AI

Generative AI can support both code and documentation contributions. Contributors remain responsible for everything they submit, regardless of whether an AI tool helped create it.

Read the [guideline for AI-generated code contributions to SAP Open Source Software Projects](https://github.com/konfidence-project/.github/blob/main/CONTRIBUTING_USING_GENAI.md) before using AI-generated code or content. It defines requirements for tool terms, similarity filtering, third-party materials, attribution, and employer policies.

For AI-assisted documentation contributions:

- Verify every technical statement, command, example, link, and source.
- Review the final text for accuracy, readability, and compliance with the [documentation style guide](/docs/extend-customize/styleguide).
- Follow project and employer rules for confidential, personal, or otherwise non-public information. Do not provide this information to an AI tool unless those rules and the approved tool explicitly allow it.
- Provide any notices, attribution, or license information required by the linked SAP guideline.

## Contributing documentation

Documentation is part of the product. Update it when a change affects how users learn about, integrate, configure, operate, or extend Konfidence.

### When documentation is needed

Use the following table to identify common documentation impacts.

| Change | Documentation impact |
| --- | --- |
| New user-facing feature or workflow | Add or update a tutorial, how-to guide, or concept guide as needed. |
| Changed behavior or user workflow | Update every affected task and explanation. |
| Changed CLI option, API field, or CRD | Update the technical source of truth and any guide that uses it. |
| Deprecated, removed, or breaking behavior | Update affected pages and explain the supported replacement or migration path. |

For substantial new content or a new documentation area, [open an issue](https://github.com/konfidence-project/konfidence-docs/issues) before writing. Maintainers can help confirm the scope and placement.

### Documentation workflow

1. **Plan the impact.** Identify the user-visible change and every page it affects.
2. **Frame the page.** Choose the primary audience, state their user job, and select a content type using the [guide templates](/docs/extend-customize/guide-templates#start-writing-in-three-steps).
3. **Write.** Copy the matching template and follow the [documentation style guide](/docs/extend-customize/styleguide).
4. **Validate the content.** Ask the contributor or feature owner to confirm technical statements. Run commands and examples in the documented environment and check the expected results.
5. **Check and preview the page.** Install the dependencies with `pnpm install`. Run `pnpm lint:prose` and `pnpm lint:markdown`, and review the findings. Start the site with `pnpm dev` and inspect the rendered page. Run `pnpm build`, then `pnpm lint:links`, before submitting the change.
6. **Submit the change.** Include documentation with the related code change when the repository structure permits it. Otherwise, create a separate documentation pull request and link the related issue or code pull request.
7. **Address both reviews.** Resolve feedback about technical accuracy as well as audience, structure, clarity, and style.

Do not edit `src/docs/reference/crd.md` directly. The file is generated from the Konfidence source repository. Update the upstream API or CRD descriptions so the automated synchronization can publish the correction.

### Before opening a documentation pull request

Confirm that:

- [ ] The page identifies one primary audience, user job, and content type.
- [ ] The content follows the matching template and the documentation style guide.
- [ ] A feature owner or other subject-matter expert has confirmed the technical statements.
- [ ] Commands, code, manifests, and expected results have been tested.
- [ ] Prerequisites, permissions, limitations, and known relevant failure modes are documented.
- [ ] Links work, link text is descriptive, and visuals have an equivalent text explanation.
- [ ] Findings from `pnpm lint:prose` and `pnpm lint:markdown` have been reviewed for the changed content.
- [ ] `pnpm build` completes successfully.
- [ ] Findings from `pnpm lint:links` have been reviewed against the current build.
- [ ] Generated reference files have not been edited directly.
- [ ] AI-assisted content follows the project guideline and has been reviewed by a human.

### Review automated findings in a pull request

For pull requests from a branch in this repository, the tools maintain one **Documentation checks** comment in the PR conversation. It updates as each check finishes and shows the checked commit, source locations, findings, and links to the full reports. Open the linked file, review the finding, and push any correction; the next run updates the same comment.

Vale and Markdownlint show reported findings on changed PR lines. Lychee covers the complete website and README, including unchanged pages, and prioritizes changed files in the preview. Repeated links from a shared component appear once with an occurrence count. Link findings include guidance for missing targets, access restrictions, and network failures. For generated references, correct the upstream source.

The comment previews up to ten findings per tool. GitHub also limits annotations, so use the local checks for a complete prose or Markdown report. A green check means the configured check completed; advisory findings can still need review. An incomplete check is shown separately from a check with no findings.

Fork and Dependabot pull requests keep their existing annotations and run summaries without posting this comment. Only the separate reporting job receives comment access; the checking jobs keep read-only permissions. When changing reporting, run `pnpm test:reports`.

### Prose checks with Vale

Use Vale 3.25.1, the version pinned in `.github/workflows/vale.yaml`. See the [README](https://github.com/konfidence-project/konfidence-docs/blob/main/README.md#check-documentation-prose) for installation. From the repository root, run:

```bash
pnpm lint:prose
pnpm test:prose
```

To check one page while writing:

```bash
vale --no-global --config=.vale.ini src/docs/getting-started/quickstart.md
```

The repository configuration takes precedence over personal preferences; the commands also disable global configuration so local and CI results use the same rules.

The built-in `Vale` style checks spelling with its US English dictionary, repeated words, and the spelling of accepted names. Our `Konfidence` style adds the six plain-language replacements from the style guide, discouraged wording, sentence case in headings and `title`, lowercase glossary concepts within sentences, and vague link labels such as “Click here”. Text in `description` and image alternative text is also checked. Code, VitePress component syntax, custom heading anchors, and technical frontmatter values are excluded.

The concept-casing rule preserves link titles and bold UI labels. Other checks, including spelling and vague link labels, remain active there. After the heading label “Optional:”, either initial case is accepted; the remaining words still use sentence case.

These checks cover selected editorial conventions. Vale is not a general grammar checker: tense, active voice, Oxford commas, first-use explanations, inclusive wording, and the usefulness of link labels still need review. Vale also does not validate metadata types, technical accuracy, working links, or the presence of image alternative text. See [ADR-0041](/docs/extend-customize/decisions/adr-0041-documentation-maintenance) for the separate responsibilities of these tools.

The generated `crd.md`, `cli.md`, `helm-values-konfidence.md`, and `helm-values-orchestrator.md` files under `src/docs/reference/` are excluded. Correct their upstream sources instead of editing these files. Authored reference pages, including the glossary, are checked.

#### Findings and pull requests

During rollout, all active rules report `warning`. `MinAlertLevel = warning` displays warnings and errors; it hides suggestions. This setting controls visibility, not whether a GitHub check fails.

The `Documentation prose` workflow runs the rule tests and checks the authored Markdown on pull requests to `main`, pushes to `main`, and manual runs. It uses the official Vale action with annotations and read-only repository permissions, including access to the pull request diff. On pull requests, annotations show findings only on added or modified lines (`filter_mode: added`). Vale still checks complete documents for context. Pushes to `main`, manual runs, and `pnpm lint:prose` report findings across all checked content, so existing findings can be reviewed separately.

Editorial findings are advisory (`fail_level: none`); installation, configuration, and test failures still fail the job. GitHub limits the number of annotations, so use the local command to review the complete findings.

The workflow does not change branch protection or install Git hooks. A failed job blocks merging only when the repository rules require that check. Before making editorial findings mandatory, maintainers and the technical writer should review false positives and the existing backlog, choose the rules that should use `error`, set the action's `fail_level` to `error`, and make the `Vale` check required. If a merge queue is used, add the corresponding `merge_group` trigger at that time.

#### Vocabulary, exceptions, and maintenance

- Add product names and exact resource names to `.vale/styles/config/vocabularies/Konfidence/accept.txt`. This list also controls capitalization, so do not copy all glossary headings into it. Common nouns such as “vector” and “stage” stay lowercase within sentences; resource names belong in inline code.
- Add valid words missing from the spelling dictionary to `.vale/styles/config/ignore/Konfidence.txt`, one word per line. `Vale.Spelling` loads this list automatically. These spelling-only exceptions do not change the rules for capitalization or terminology.
- For an intentional bad example, disable only the relevant rule with a [Vale Markdown comment](https://docs.vale.sh/formats/markdown), explain the exception, and re-enable the rule immediately after the example. Do not disable checking for an entire page to silence unrelated findings.
- Authors review findings in the content they change. Maintainers and the technical writer review vocabulary additions, exceptions, and rule changes against the style guide and glossary.
- Keep rules in `.vale/styles/Konfidence/` and add valid and invalid examples to `.vale/config.test.yml` when changing their behavior. Run `pnpm test:prose` and `pnpm lint:prose` before proposing the change. Coverage requires every custom rule to produce a finding in at least one test.
- When updating Vale, change `VALE_VERSION` in the workflow and the version documented here and in the README together. Re-run the tests and review changes in findings before merging the update. No downloaded style packages need to be maintained.

### Markdown structure checks

`pnpm install` installs the version of `markdownlint-cli2` pinned in `package.json` and `pnpm-lock.yaml`. No separate global installation is needed. Run these commands from the repository root:

```bash
pnpm lint:markdown
pnpm test:markdown
```

To check one page while writing, use `--no-globs` to replace the configured file selection:

```bash
pnpm exec markdownlint-cli2 --no-globs src/docs/getting-started/quickstart.md
```

The root `.markdownlint-cli2.yaml` checks authored Markdown in `src/`, `README.md`, and `CONTRIBUTING.md`. It excludes the same four generated reference files as Vale. The configuration enables only these structural rules:

| Rule | Finding |
| --- | --- |
| MD001 | A heading skips a level. Frontmatter titles are not treated as extra headings. |
| MD005 | List items at the same level use inconsistent indentation. |
| MD040 | A fenced code block has no language label. VitePress code block metadata is allowed. |
| MD045 | A Markdown or HTML image lacks alternative text. |
| MD052 | A full or collapsed reference link or image uses an undefined label. |
| MD056 | A table row has a different number of cells from its header. |

Vale continues to check spelling, terminology, and wording. VitePress checks missing internal pages during the build. The separate lychee check covers link destinations, heading fragments, and static image targets. Markdown structure checks do not judge whether alternative text is useful or whether commands work.

#### Findings and maintenance

Findings appear in the terminal with a file path, line number, and rule identifier. During rollout, all six rules use `warning`: findings are visible, but the command succeeds. Installation, configuration, and test failures still fail the check. Neither command automatically edits content.

The separate `Documentation Markdown` workflow runs on pull requests to `main`, pushes to `main`, and manual runs. It uses the same locked dependency and configuration as local checks. Like Vale, it checks complete documents and uses `reviewdog` to show GitHub Actions warning annotations only on added or modified pull request lines. Pushes to `main`, manual runs, and local checks report the full findings. GitHub limits annotations; use `pnpm lint:markdown` for the full list.

The workflow runs independently of Vale and the site build. It does not add Git hooks or change branch protection. Maintainers and the technical writer should review findings and false positives before making any rules mandatory.

The `.github/markdownlint-cli2.ci.mjs` file adds the official output formatter for CI. It writes a temporary report for annotations and keeps all rules and file selection in the root YAML configuration.

For an intentional exception, use a [markdownlint configuration comment](https://github.com/DavidAnson/markdownlint#configuration) such as `<!-- markdownlint-disable-next-line MD040 -->` and explain why the exception is needed. Limit it to the relevant rule and example. Update generated content at its source.

When changing rules or updating the tool, update the examples in `tests/markdownlint.test.mjs` and run `pnpm test:markdown`, `pnpm lint:markdown`, `pnpm test:prose`, `pnpm lint:prose`, and `pnpm build`. Review changes in findings before merging. Keep dependency updates in `package.json` and `pnpm-lock.yaml` together; CI uses `pnpm install --frozen-lockfile`.

### Link checks with lychee

Use lychee 0.24.2, the version pinned in `.github/workflows/lychee.yaml`. See the [README](https://github.com/konfidence-project/konfidence-docs/blob/main/README.md#link-checks-with-lychee) for installation. It is installed separately; `pnpm install` does not install lychee. From the repository root, run:

```bash
pnpm build
pnpm lint:links
pnpm test:links
```

Always rebuild after changing content. The link check reads the generated HTML in `.vitepress/dist/`, including published generated references. It checks relative links, root-relative links, directory indexes, URLs without `.html`, heading fragments, and static image and asset references. Absolute links to `konfidence.cloud` are checked against the same local build. This lets new pages and anchors be checked before publication.

The internal check makes no network requests. It checks the complete built site because changing a target can break links on unchanged pages. It also checks local links in the repository's README, including Markdown heading fragments, images, and directories such as `LICENSES`. Directory links in the README may point to a repository folder; directory links in the built website still require an index page. It complements Vale and markdownlint without changing their rules or the VitePress build.

#### External links

After building, run the external check when needed:

```bash
pnpm lint:links:external
```

This checks public HTTP and HTTPS targets from both the built website and the repository's README. Links to our own site remain the responsibility of the internal check. Local dashboards and private addresses in examples are excluded. Code examples are not scanned as navigation, and email delivery is not checked.

External checks limit concurrent requests and retry failures. Pull requests and pushes to `main` check targets without restoring cached responses. Local, scheduled, and manual checks cache responses for up to one day. Responses with HTTP status codes from 400 through 599 are excluded from the cache so that the next run checks them again. Remove `.lycheecache` when a successful cached result needs to be checked immediately in a local run.

Review the reported status before changing a link. A 404 or 410 usually indicates a missing target. Authentication failures, rate limits such as 429, server errors, and connection problems need a separate availability check; they do not prove that the target was removed. Timeouts appear in their own report category. These responses remain visible and are not accepted as successful checks.

#### GitHub reports and maintenance

The `Documentation links` workflow builds the site and checks both internal and external targets on pull requests to `main`, pushes to `main`, and manual and weekly runs. It produces separate reports for internal website links, local README links, and external URLs. The weekly schedule starts once the workflow is merged into the default branch and also checks links when no content has changed.

Findings appear in the terminal locally, in the GitHub Actions run summary, and in the shared PR comment described above. During rollout, link findings produce a workflow warning; installation, configuration, build, and test failures still fail the job. Locally, lychee returns exit code 2 for link findings. The workflow does not change branch protection or open issues.

Reports identify the built HTML page or README and the affected URL. They are not filtered to changed source lines: VitePress can combine many source lines into one HTML line, and broken incoming links may be on unchanged pages. Use the corresponding Markdown source to correct authored content, or update the upstream source of a generated reference.

Keep shared options and narrowly justified URL exclusions in `lychee.toml`. The small `scripts/check-links.mjs` helper supplies the build paths and the same arguments for local checks and the official GitHub action. Avoid blanket exclusions for a host merely because one check fails. Maintainers and the technical writer review exceptions and link findings.

When changing options or updating lychee, run `pnpm test:links`, rebuild, and run both link checks. Also run `pnpm test:markdown`, `pnpm test:prose`, `pnpm lint:markdown`, and `pnpm lint:prose`. Keep the workflow version and the version documented here and in the README together. Add regression examples to `tests/lychee.test.mjs`; the network tests use a local test server instead of depending on external websites.

The checks cover static output. JavaScript-generated anchors and assets loaded only in the browser, such as interactive diagrams, still need preview and manual review. They also do not establish technical accuracy, useful image descriptions, or correct commands.

### Pull request titles

Pull request titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. The project validates the title because it becomes the default commit message for squash merges.

For example:

```text
docs: explain vector configuration
docs(getting-started): add first deployment tutorial
```

### Architecture decision records

Write an architecture decision record (ADR) when a change spans several components or is expensive to reverse. Write one too when it sets a pattern other contributors must follow. ADRs live in the [`konfidence-docs`](https://github.com/konfidence-project/konfidence-docs/tree/main/src/docs/extend-customize/decisions) repository. The workflow is the same as for any documentation contribution, with the additions below.

1. Take the next free number after the highest ADR in the
   [decision log](/docs/extend-customize/decisions/).
2. Create `adr-<NNNN>-<slug>.md` in `src/docs/extend-customize/decisions/`.
3. Start the file with this frontmatter, the heading, and the
   `<AdrHeader />` component:

   ```markdown
   ---
   id: ADR-<NNNN>
   title: "<Short title>"
   description: "<One sentence: what the record decides>"
   status: proposed
   date_proposed: <YYYY-MM-DD>
   authors: [<github-handle>]
   category: <Architecture Pattern | Technology Stack | Security | Deployment>
   impact: <High | Medium | Low>
   dependencies: [<ADR-NNNN>]
   pageClass: adr
   outline: deep
   ---

   # ADR-<NNNN>: <Short title>

   <AdrHeader />
   ```

   List authors by GitHub handle only. Records never name people, internal systems, or private repositories.

4. Write the sections **Context**, **Considered options**, **Decision**,
   and **Consequences**.
5. Put diagrams into `assets/` and reference them as `./assets/<file>`.
6. Open the pull request with `status: proposed`.

The maintainers review the record in the pull request. They set `status: accepted` and `date_approved` on merge, or set `status: rejected` and close the pull request with a comment explaining the reasoning. 

The sidebar and the decision log pick up the new file automatically.

## How to contribute

1. Make sure the change is welcome (see [General remarks](#general-remarks)).
2. Create a branch by forking the repository and apply your change.
3. Commit and push your change on that branch.
4. Create a pull request in the repository using this branch.
5. Follow the link posted by the CLA assistant to your pull request and accept it, as described above.
6. Wait for our code review and approval, possibly enhancing your change on request.
    - Note that the maintainers have many duties. So, depending on the required effort for reviewing, testing, and clarification, this may take a while.
7. Once the change has been approved and merged, we will inform you in a comment.
8. Celebrate!
