---
title: [Reference topic: Component, command, or configuration name]
description: Reference documentation for [subject]. Covers [parameters/options/fields] with types, defaults, and behavior.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# [Component/command/configuration name]

One sentence describing what this is and its role in Konfidence.

## Syntax

```shell
konfidence [command] [subcommand] [flags]
```

## Description

A short paragraph describing the subject precisely: what it is, what it does, and where it fits in
the delivery lifecycle. Avoid instructional language — describe, don't guide.

## Parameters

| Name          | Type      | Required | Default   | Description                        |
| ------------- | --------- | -------- | --------- | ---------------------------------- |
| `param-name`  | `string`  | Yes      | —         | What the parameter controls.       |
| `param-name`  | `boolean` | No       | `false`   | What the flag enables or disables. |

## Options / Flags

| Flag          | Short | Type      | Default | Description           |
| ------------- | ----- | --------- | ------- | --------------------- |
| `--flag-name` | `-f`  | `string`  | —       | What the option does. |
| `--flag-name` | —     | `boolean` | `false` | What the option does. |

## Configuration fields

| Field        | Type       | Required | Default | Description               |
| ------------ | ---------- | -------- | ------- | ------------------------- |
| `field.name` | `string`   | Yes      | —       | What the field specifies. |
| `field.name` | `[]string` | No       | `[]`    | What the field specifies. |

## Output

Description of what the command or component returns. Include exit codes if applicable.

| Exit code | Meaning                     |
| --------- | --------------------------- |
| `0`       | Success.                    |
| `1`       | [Specific error condition]. |

## Constraints and behavior

- Any non-obvious rule or invariant about this component.
- Edge cases or limits (e.g., maximum values, immutability rules).
- Ordering or dependency constraints.

## Related

- Link to how-to guides that use this component
- Link to tutorials that introduce this component
- Link to related reference entries
