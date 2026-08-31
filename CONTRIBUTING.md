# Contributing to an SAP Open Source Project

## General Remarks

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
5. **Preview the page.** Install the dependencies with `pnpm install`, start the site with `pnpm dev`, and inspect the rendered page. Run `pnpm build` before submitting the change.
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
- [ ] `pnpm build` completes successfully.
- [ ] Generated reference files have not been edited directly.
- [ ] AI-assisted content follows the project guideline and has been reviewed by a human.

### Pull request titles

Pull request titles must follow the [Conventional Commits](https://www.conventionalcommits.org/) format. The project validates the title because it becomes the default commit message for squash merges.

For example:

```text
docs: explain vector configuration
docs(getting-started): add first deployment tutorial
```

## How to Contribute

1. Make sure the change is welcome (see [General Remarks](#general-remarks)).
2. Create a branch by forking the repository and apply your change.
3. Commit and push your change on that branch.
4. Create a pull request in the repository using this branch.
5. Follow the link posted by the CLA assistant to your pull request and accept it, as described above.
6. Wait for our code review and approval, possibly enhancing your change on request.
    - Note that the maintainers have many duties. So, depending on the required effort for reviewing, testing, and clarification, this may take a while.
7. Once the change has been approved and merged, we will inform you in a comment.
8. Celebrate!
