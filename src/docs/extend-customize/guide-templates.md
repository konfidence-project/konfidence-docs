---
title: "Guide templates"
description: "Choose and use a template for Konfidence documentation"
---

# Guide templates

Use this page to plan a user-focused documentation page and copy the template that matches the reader's goal. The templates provide the structure; the [style guide](./styleguide.md) explains how to write and format the content.

## Start writing in three steps

Before you copy a template, identify the primary audience, describe what they need, and choose the content type that supports that need.

### 1. Choose the primary audience

Choose the person who must use the documentation successfully. This might not be the person who developed the feature.

| User cluster | Typical goals |
| --- | --- |
| **Application Development** | Develop, test, and integrate applications with fast feedback and minimal infrastructure overhead. |
| **Product and Program Management** | Plan releases, track feature and quality status, and make release or demo decisions. |
| **DevOps** | Install and operate Konfidence, manage landscapes and access, and troubleshoot operational problems. |
| **Open Source and Extension Development** | Contribute to Konfidence, build extensions, and adapt Konfidence to additional technical workflows. |

If a page seems to address multiple audiences, choose the audience with the primary user job. Include another perspective only when it supports the same job. Otherwise, create separate pages and connect them with descriptive links.

The audience does not determine where a page appears in the navigation. If no existing section supports the user job, discuss the placement with a maintainer before writing a new page.

### 2. Describe the user job

Complete this sentence before you start writing:

> For [primary audience] who wants to [user job], this page helps them [expected outcome].

Use one specific job and an outcome the reader can recognize. For example:

> For an application developer who wants to publish a build result, this page helps them make the artifact available for use in a Konfidence vector.

### 3. Choose the content type

Choose the type based on why the reader opens the page, not on the feature or tool being documented.

| Reader's need | Content type | Use it to |
| --- | --- | --- |
| "Teach me by guiding me through a working example." | [**Tutorial**](#tutorial-template) | Help a new user gain knowledge and confidence by doing. |
| "Help me complete this specific task." | [**How-to guide**](#how-to-guide-template) | Guide a capable user towards a practical result. |
| "Help me understand how or why this works." | [**Concept guide**](#concept-guide-template) | Explain context, relationships, reasons, or trade-offs. |
| "Give me the exact field, option, or value." | **Reference** | Provide accurate information that a user looks up while working. |

Keep one primary user job and content type per page:

- Keep tutorials linear. Link to alternatives instead of interrupting the learning path.
- Keep how-to guides focused on the task. Link to concepts and reference details.
- Keep concept guides focused on understanding. Link to complete procedures.
- Split independent user jobs into separate pages and link them into a useful journey.
- Do not use a template for generated CRD or API reference content. Update its technical source of truth instead.

After copying a template, replace every placeholder and remove every instructional comment that is no longer useful.

## How-to guide template

Use a how-to guide for a real task that the reader already knows they need to complete. A how-to can include decisions or branches when the real workflow requires them.

````md
---
title: "[Action-focused title]"
description: "[What the reader can accomplish and when this guide applies]"
outline: deep
editLink: true
lastUpdated: true
---

<!--
Primary audience: [User cluster]
User job: For [audience] who wants to [job], this page helps them [outcome].
Expected outcome: [Observable result]
Content type: How-to
-->

# [Action-focused title]

[In one or two sentences, state what the reader will accomplish and when this guide applies.]

## Prerequisites

<!-- Remove this section if the task has no prerequisites. -->

Before you begin, make sure you have:

- [Required access or permission]
- [Required tool and supported version]
- [Required resource, configuration, or decision]

## [Complete the first action]

[Explain the purpose of this part of the task when it is not clear from the heading.]

1. [Describe one action.]
2. [Describe the next action.]

   ```bash
   command --option <value>
   ```

The command returns [expected result or output].

## [Complete the next action]

1. [Describe one action.]
2. [Describe the next action.]

## Verify the result

[Provide a command or observation that confirms the task succeeded.]

```bash
verification-command <resource-name>
```

The output shows [success condition].

## Troubleshooting

<!-- Include only known problems relevant to this task. Remove this section otherwise. -->

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| [What the reader observes] | [Why it happens] | [How to recover] |

## Next steps

- [Descriptive link to the next task](../path/to/page.md)
- [Descriptive link to a relevant concept](../path/to/page.md)
````

## Tutorial template

Use a tutorial to give a new user a safe, reliable learning experience. Provide one path through a meaningful Konfidence example and show visible results early and often.

````md
---
title: "[Title that describes what the reader builds]"
description: "[Working result the reader creates and the experience needed]"
outline: deep
editLink: true
lastUpdated: true
---

<!--
Primary audience: [User cluster]
User job: For [audience] who wants to learn [skill], this tutorial helps them build [result].
Learning outcome: [Knowledge or skill the completed experience develops]
Content type: Tutorial
-->

# [Title that describes what the reader builds]

In this tutorial, you build [visible, meaningful result]. Along the way, you use [important Konfidence concepts or tools the reader encounters].

## What you will build

[Describe the completed result in concrete terms. If possible, show a small example of the final state.]

## Prerequisites

Before you begin, make sure you have:

- [Required access or permission]
- [Required tool and supported version]
- [Required starting resource]

## What you will do

You will:

1. [First meaningful part of the learning path.]
2. [Second meaningful part.]
3. [Final meaningful part.]

## 1. [Create the first result]

[Give the minimum context needed to perform this step.]

1. [Describe one action.]
2. [Describe the next action.]

   ```bash
   command --option <value>
   ```

**Checkpoint:** [Describe the visible result and what the reader should notice.]

## 2. [Build on the result]

1. [Describe one action.]
2. [Describe the next action.]

**Checkpoint:** [Describe the next visible result. If a common error is likely, explain how the reader can return to the expected path.]

## 3. [Complete the working example]

[Guide the reader to the promised result without introducing optional alternatives.]

## Verify what you built

[Provide a final command or observation that proves the example works.]

```bash
verification-command <resource-name>
```

The output shows [success condition].

## What you learned

You have:

- [Knowledge or skill demonstrated by the first result.]
- [Knowledge or skill demonstrated by the completed example.]

## Clean up

<!-- Include this section when the tutorial creates resources the reader might not want to keep. -->

[Explain how to remove the tutorial resources safely.]

## Next steps

- [Descriptive link to a related how-to guide](../path/to/page.md)
- [Descriptive link to a concept guide](../path/to/page.md)
````

## Concept guide template

Use a concept guide when the reader needs to understand a Konfidence idea, relationship, design choice, or trade-off. In Diátaxis, this content type is called *explanation*.

````md
---
title: "[Concept name]"
description: "[What the page explains and why that understanding matters]"
outline: deep
editLink: true
lastUpdated: true
---

<!--
Primary audience: [User cluster]
User job: For [audience] who wants to understand [question], this page explains [expected understanding].
Reader question: [How or why does this work?]
Content type: Concept (Diátaxis: Explanation)
-->

# [Concept name]

[In one or two sentences, identify the concept and explain why it matters to the reader.]

## Overview

[Provide the context and mental model the reader needs. Define the scope of this page.]

## How [concept] works

[Explain the important relationships, sequence, or behavior. Focus on why the parts work together rather than listing implementation details.]

## Key components

### [Component or aspect]

[Explain its role and relationship to the overall concept.]

### [Component or aspect]

[Explain its role and relationship to the overall concept.]

## Example

[Use one concrete example to make the concept easier to understand. Do not turn the example into a complete procedure.]

## Considerations and trade-offs

[Describe relevant limitations, consequences, alternatives, or design decisions. Remove this section if it does not help the reader.]

## Related information

- [Descriptive link to an applicable how-to guide](../path/to/page.md)
- [Descriptive link to reference information](../path/to/page.md)
````
