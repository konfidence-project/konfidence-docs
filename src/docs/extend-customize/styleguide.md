---
title: "Style guide"
description: "Style guide for Konfidence project documentation"
---

# Style guide

This style guide defines tone, structure, and formatting rules for writing and editing Konfidence project documentation. It ensures that the content is clear, consistent, and accessible for all readers.

## Spelling and grammar

- Use **US English** spelling and vocabulary.
- Use the [Merriam Webster Dictionary](https://www.merriam-webster.com/) for spelling and grammar checks.

## Terminology

- Use consistent vocabulary.
- Refer to the Konfidence [glossary](../reference/glossary.md) when writing or editing documentation.
- Introduce abbreviations only after spelling them out:
    > Konfidence uses the Open Component Model (OCM) to describe vectors and artifacts stored in an Open Container Initiative (OCI) registry.

## Structure

### Choose the right document type

Before you start writing, ask yourself: *Why will the user read my document?*

The user comes to our documentation with a specific goal in mind, whether they're trying to solve a problem, understand a term, or look up technical details. That goal should guide both the content and the structure of your document.

Depending on the user's goal, your document will most likely fit into one of these types:

| Document type    | Helps user to        | Provides                                    |
| ---------------- | -------------------- | ------------------------------------------- |
| [**How-to guide**](./guide-templates.md#how-to-guide) | Accomplish a task    | Step-by-step instructions                   |
| [**Concept guide**](./guide-templates.md#concept-guide)     | Understand something | Explanation of concepts and functionalities |

## Writing style

### Use simple language

Use **short sentences** and **simple words** that non-native English speakers are also familiar with.

| ✅ **Use**           | ❌ **Avoid**                                         |
|---------------------|-----------------------------------------------------|
| use, delete, get    | utilize, dispose of, obtain                         |
| to, because, except | in order to, due to the fact, with the exception of |

### Address the user directly

Use the **active voice** and say *you* like you would in a normal conversation.

| ✅ **Use**              | ❌ **Avoid**                        |
| ---------------------- | ---------------------------------- |
| Upload your data file. | The user can upload the data file. |

### Communicate clearly

- Be concise and stay focused on the document’s goal.
- Tailor content to its type and audience.
- Follow a logical flow, and describe *what* before *how*.
- Be positive (*do*, rather than *do not*).

| ✅ **Use**                             | ❌ **Avoid**                        |
| ------------------------------------- | ---------------------------------- |
| Connect the device to a power source. | Do not leave the device uncharged. |

### Use inclusive and bias-free language

- Use inclusive terms. Check out the [Inclusive Naming initiative](https://inclusivenaming.org/word-lists/) for more information on harmful and exclusionary language.
- Avoid gendered pronouns. Use *they*, *their* instead of *she*, *her*, *he*, *him*.

## Formatting

| Element                      | Formatting                                   | Example                                                     |
| ---------------------------- | -------------------------------------------- | ----------------------------------------------------------- |
| **Headings and titles**      | #, ##, ###, sentence style                   | Deployment and release conventions                          |
| **Command-line tools**       | `Code style`                                 | `kubectl`, `git`, `docker`                                  |
| **Inline code and commands** | `Code style`                                 | To view your managed resources, run `kubectl get managed`.  |
| **Code and CLI blocks**      | Fenced code blocks (```)                     |                                                             |
| **CRDs**                     | UpperCamelCase, `code style`                 | With the `VectorActivation` custom resource, you can [...]. |
| **Folder, file names, directories, paths**    | `Code style`                                 | You can find the `config` file in the `~/.kube` folder.     |
| **Keyboard shortcuts**       | `Code style`, plus (+) sign, no spaces       | Press `Cmd`+`S`.                                            |
| **User-interface elements**  | **Bold**                                     | Choose **Create**.                                          |
| **Text input**               | `Code style`                                 | In the **Search** field, type `hello`.                      |
| **Placeholders**             | Angle brackets (`<>`), hyphens between words | `<workspace-name>`                                          |  |
| **Emphasis**                 | **Bold**                                     | In your document, focus on a **single** topic.              |

### Make the content scannable

- Use lists for clarity.
- Write short paragraphs.

## Diagrams

Use diagrams to clarify complex relationships, workflows, or architecture. Choose the format that best suits your content and audience. Prefer lightweight, maintainable formats that render well in Markdown-based documentation.

### Embedding diagrams from draw.io

The Konfidence documentation supports embedding `.drawio` files directly. A custom Vue component renders the diagram inline using the diagrams.net viewer.

To embed a draw.io diagram:

1. Place the `.drawio` file in the topic-specific subfolder under `public/assets/diagrams/`.
2. Use the `DrawioDiagram` component in your Markdown file:

```md
<DrawioDiagram src="/assets/diagrams/example-file.drawio" />
```

## Links and references

### Use descriptive link texts

- For link texts, use either the exact page title or a descriptive phrase.
- Don't use link texts such as *here*, *this*, *this guide*, *this website*.

### Use relative links:

`[Getting started](./getting-started.md)`

Always verify that internal links work before submitting a pull request.

## Best practices

- Don't use unnecessary capitalization. Before you capitalize a word, think about why (and whether) it should be capitalized.
- Use Oxford commas in lists.
    > The system supports models, pipelines, and integrations.
- Spell out numbers from one to nine; use numerals for 10 and above.
    > Two configurations are available. The model supports up to 12 input types.
- Use headings and titles to indicate whether the content is conceptual or task-based. Be consistent. Make sure the heading in the sidebar exactly matches the title in the corresponding content section.
