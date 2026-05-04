# Documentation templates

This folder contains templates for writing Konfidence documentation. Each template follows the [Diataxis](https://diataxis.fr) framework, which organizes docs into four distinct types based on what a reader needs.

## When to use which template

| Template | Use when… |
| --- | --- |
| `tutorial-template.md` | Teaching a concept by walking the reader through a hands-on exercise (learning-oriented) |
| `how-to-guide-template.md` | Showing how to accomplish a specific goal, such as promoting a vector or configuring a landscape (task-oriented) |
| `reference-template.md` | Documenting a CLI command, configuration field, or API (lookup-oriented) |

> An explanation template (for articles that describe *why* Konfidence works the way it does, such as the delivery lifecycle or the role of the Global Control Plane) is not yet available. Use the [Diataxis explanation guidance](https://diataxis.fr/explanation/) directly until one is added.

## How to use a template

1. Copy the template file into the appropriate folder under `src/docs/`.
2. Rename it to reflect the topic (for example, `promote-vector.md` or `konfidence-cli.md`).
3. Replace all bracketed placeholders such as `[subject]` or `[specific step 1]` with real content.
4. Remove any sections that do not apply to your topic.

## Further reading

- [Diataxis framework](https://diataxis.fr) — the theory behind the four doc types
- [CONTRIBUTING.md](../../CONTRIBUTING.md) — guidelines for contributing to Konfidence docs
