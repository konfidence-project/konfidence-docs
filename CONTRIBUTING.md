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
5. **Check and preview the page.** Run `pnpm lint:prose` and review the findings. Install the dependencies with `pnpm install`, start the site with `pnpm dev`, and inspect the rendered page. Run `pnpm build` before submitting the change.
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
- [ ] Findings from `pnpm lint:prose` have been reviewed for the changed content.
- [ ] `pnpm build` completes successfully.
- [ ] Generated reference files have not been edited directly.
- [ ] AI-assisted content follows the project guideline and has been reviewed by a human.

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

These checks cover selected editorial conventions. Vale is not a general grammar checker: tense, active voice, Oxford commas, first-use explanations, inclusive wording, and the usefulness of link labels still need review. Vale also does not validate metadata types, technical accuracy, working links, or the presence of image alternative text. See [ADR-0041](/docs/extend-customize/decisions/adr-0041-documentation-maintenance) for the separate responsibilities of the planned tools.

The generated `crd.md`, `cli.md`, `helm-values-konfidence.md`, and `helm-values-orchestrator.md` files under `src/docs/reference/` are excluded. Correct their upstream sources instead of editing these files. Authored reference pages, including the glossary, are checked.

#### Findings and pull requests

During rollout, all active rules report `warning`. `MinAlertLevel = warning` displays warnings and errors; it hides suggestions. This setting controls visibility, not whether a GitHub check fails.

The `Documentation prose` workflow runs the rule tests and checks the authored Markdown on pull requests to `main`, pushes to `main`, and manual runs. It uses the official Vale action with annotations and read-only repository permissions. Editorial findings are advisory (`fail_level: none`); installation, configuration, and test failures still fail the job. GitHub limits the number of annotations, so use the local command to review the complete findings.

The workflow does not change branch protection or install Git hooks. A failed job blocks merging only when the repository rules require that check. Before making editorial findings mandatory, maintainers and the technical writer should review false positives and the existing backlog, choose the rules that should use `error`, set the action's `fail_level` to `error`, and make the `Vale` check required. If a merge queue is used, add the corresponding `merge_group` trigger at that time.

#### Vocabulary, exceptions, and maintenance

- Add product names and exact resource names to `.vale/styles/config/vocabularies/Konfidence/accept.txt`. This list also controls capitalization, so do not copy all glossary headings into it. Common nouns such as “vector” and “stage” stay lowercase within sentences; resource names belong in inline code.
- Add valid words missing from the spelling dictionary to `.vale/styles/config/ignore/Konfidence.txt`, one word per line. `Vale.Spelling` loads this list automatically. These spelling-only exceptions do not change the rules for capitalization or terminology.
- For an intentional bad example, disable only the relevant rule with a [Vale Markdown comment](https://docs.vale.sh/formats/markdown), explain the exception, and re-enable the rule immediately after the example. Do not disable checking for an entire page to silence unrelated findings.
- Authors review findings in the content they change. Maintainers and the technical writer review vocabulary additions, exceptions, and rule changes against the style guide and glossary.
- Keep rules in `.vale/styles/Konfidence/` and add valid and invalid examples to `.vale/config.test.yml` when changing their behavior. Run `pnpm test:prose` and `pnpm lint:prose` before proposing the change. Coverage requires every custom rule to produce a finding in at least one test.
- When updating Vale, change `VALE_VERSION` in the workflow and the version documented here and in the README together. Re-run the tests and review changes in findings before merging the update. No downloaded style packages need to be maintained.

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
