---
title: "Style guide"
description: "Style guide for Konfidence project documentation"
---

# Style guide

Use this style guide after you have identified the primary audience, user job, and content type for your page. If you have not made those decisions yet, start with the [guide templates](./guide-templates.md#start-writing-in-three-steps).

The rules on this page help you write Konfidence documentation that is clear, consistent, accessible, and easy to use. Keep each page focused on one primary user job.

Use this page as a reference while writing and reviewing documentation. You do not need to read it from beginning to end. Start with the appropriate template and consult the relevant sections when needed.

## Spelling and grammar

- Use US English spelling and vocabulary.
- Use the [Merriam-Webster Dictionary](https://www.merriam-webster.com/) to check spelling and word choice.
- Use the present tense unless another tense is necessary to make the sequence clear.
- Use the Oxford comma in a list of three or more items.
- Spell out numbers from one to nine. Use numerals for 10 and above.

## Terminology

- Use the same term for the same concept throughout the documentation.
- Use the preferred terms in the Konfidence [glossary](../reference/glossary.md).
- Explain a Konfidence-specific term when the intended audience might not know it. Do not explain general programming or Kubernetes concepts to an audience that can be expected to know them.
- Spell out an abbreviation the first time you use it on a page. Include the abbreviation in parentheses only if you use it again.

> Konfidence uses the Open Component Model (OCM) to describe vectors and artifacts stored in an Open Container Initiative (OCI) registry.

## Writing style

### Use plain English

Use short sentences, common words, and concrete verbs. Avoid idioms, cultural references, and unnecessary words that can make the text difficult for non-native English speakers or translation tools.

| Use | Avoid |
| --- | --- |
| use, delete, get | utilize, dispose of, obtain |
| to, because, except | in order to, due to the fact, with the exception of |

### Address the user directly

Use active voice and address the reader as *you*. Start instructions with an imperative verb.

| Use | Avoid |
| --- | --- |
| Upload the artifact. | The artifact can be uploaded by the user. |
| Run the following command. | You should run the following command. |

### Be clear and specific

- Put the most important information first.
- Keep paragraphs focused on one idea.
- Describe what an action accomplishes before explaining how to perform it.
- State limitations, risks, and destructive effects before the relevant action.
- Prefer positive instructions when they are clearer. Use *do not* when a prohibition protects the user from an error or risk.
- Do not use *easy*, *simple*, or *just*. These words do not help the reader complete the task and can dismiss real difficulty.

### Use inclusive language

- Use inclusive and bias-free terms. Consult the [Inclusive Naming word lists](https://inclusivenaming.org/word-lists/) when you are unsure.
- Avoid assumptions about gender, culture, location, or physical ability.
- Use *they* and *their* instead of gendered pronouns when referring to an unspecified person.

## Structure and scannability

- Start the page with one or two sentences that state its purpose and relevance.
- Use sentence case for titles and headings.
- Organize sections in the order in which the reader needs them.
- Use short paragraphs and descriptive headings.
- Use numbered lists for ordered steps and bulleted lists for unordered information.
- Keep list items parallel. Start procedural list items with verbs.
- Introduce every list and table with a sentence that explains its purpose.
- Use tables only when readers need to compare values across multiple items. Use a list when the information is primarily sequential.
- Make the page title match its sidebar label unless a shorter sidebar label improves navigation without changing the meaning.

## Commands, code, and manifests

Readers often copy examples before reading all surrounding text. Make every example safe, understandable, and usable in its stated context.

- Introduce each example and explain what it demonstrates or accomplishes.
- Use a fenced code block with the correct language identifier, such as `bash`, `yaml`, `json`, or `go`.
- Prefer examples that users can copy, paste, and run. Test them in the documented environment.
- Include all dependencies, required files, permissions, and setup that are not already stated in the prerequisites.
- Clearly label partial, illustrative, or non-production examples.
- Use valid syntax. Put explanations outside command blocks instead of adding comments to commands that users should copy.
- Use the same sample names, namespaces, and placeholder values throughout a workflow.
- Use angle brackets and hyphens for values the reader must replace, for example `<project-name>`.
- Never include real credentials, personal data, internal hostnames, or production identifiers.
- Show or describe the expected result when it helps the user confirm success.

### API and CRD reference content

Generate reference content from its technical source of truth whenever possible. The file `src/docs/reference/crd.md` is synchronized from the Konfidence source repository. Do not edit the generated file directly. Update the upstream API or CRD descriptions so the next synchronization includes the correction.

Generated reference content still needs human-authored context. Link to relevant concepts and tasks, and explain important caveats or side effects that cannot be inferred from the schema.

## Prerequisites, results, and troubleshooting

- List only the prerequisites required to begin the documented task.
- State required access, permissions, tools, versions, resources, and decisions.
- Place prerequisites before the first action that depends on them.
- Provide a verification step or expected result for a task or tutorial.
- Add troubleshooting only for known, relevant failure modes. Describe the symptom, likely cause, and recovery action.
- Do not speculate about unsupported behavior. Ask the feature owner or maintainer to validate uncertain technical statements.

## Formatting

| Element | Formatting | Example |
| --- | --- | --- |
| Headings and titles | Markdown heading, sentence case | `## Configure access control` |
| Command-line tools | Inline code | `kubectl`, `git`, `docker` |
| Inline code and commands | Inline code | Run `kubectl get projects`. |
| Code and CLI blocks | Fenced code block with a language | `bash`, `yaml`, `json` |
| Custom resources | UpperCamelCase and inline code | `VectorActivation` |
| Files, directories, and paths | Inline code | `src/docs/`, `~/.kube/config` |
| Keyboard shortcuts | Inline code, plus sign, no spaces | `Cmd`+`S` |
| User interface elements | Bold | Choose **Create**. |
| Text input | Inline code | Enter `example` in **Name**. |
| Placeholders | Angle brackets and hyphens | `<workspace-name>` |
| Emphasis | Bold, used sparingly | Complete the **required** fields. |

Do not use capitalization or bold text as decoration.

## Links and user journeys

- Use the exact page title or a descriptive phrase as link text.
- Do not use *here*, *this*, *this guide*, or a raw URL as link text.
- Link to the next information the reader needs to complete their journey. Avoid lists of loosely related pages.
- Link to the source page instead of duplicating information that has a clear owner.
- In Markdown files, use a relative link to the target source file and include the `.md` extension:

  ```md
  [Core concepts](../core-concepts/index.md)
  ```

- Use root-relative `/docs/` links in VitePress navigation and configuration.
- Check that internal links and heading anchors work before submitting a pull request.

## Diagrams and screenshots

Use a visual only when it makes a relationship, sequence, or interface materially easier to understand.

- Introduce each visual and state the key point the reader should notice.
- Provide meaningful alternative text for images.
- Do not use a diagram or screenshot as the only explanation. Include an equivalent text summary nearby.
- Do not rely on color alone to communicate meaning. Use sufficient contrast and add labels or patterns.
- Keep visuals focused, readable, and free of credentials, personal data, and internal information.
- Minimize screenshots. They become outdated quickly and are difficult to localize and access.

### Embed diagrams from draw.io

The Konfidence documentation can render `.drawio` files inline with a custom Vue component.

1. Place the `.drawio` file in the topic-specific subfolder under `public/assets/diagrams/`.
2. Introduce the diagram and its purpose in the surrounding text.
3. Embed the file:

   ```md
   <DrawioDiagram src="/assets/diagrams/example-file.drawio" />
   ```

4. Follow the component with a short text summary of the relationships or sequence shown in the diagram.
