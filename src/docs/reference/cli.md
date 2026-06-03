---
title: CLI
description: Konfidence command-line interface reference and command documentation.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# CLI

Complete reference for the Konfidence command-line interface (CLI).

## Overview

The Konfidence CLI is the primary tool for interacting with Galaxy and managing deployments.

## Installation

Install the Konfidence CLI using your package manager or download binary releases.

## Global options

Global flags available for all commands:

- `--config` - Path to configuration file
- `--verbose` - Enable verbose output
- `--quiet` - Suppress non-essential output
- `--help` - Display help information

## Command categories

### Galaxy management

Commands for managing the Galaxy control plane:

- `galaxy install` - Install Galaxy
- `galaxy configure` - Configure Galaxy settings
- `galaxy status` - Check Galaxy status

### Vector management

Commands for managing vectors:

- `vector create` - Create a new vector
- `vector list` - List available vectors
- `vector inspect` - View vector details
- `vector delete` - Delete a vector

### Stage management

Commands for managing stages and promotions:

- `stage list` - List available stages
- `stage create` - Create a new stage
- `promotion list` - List active promotions
- `promotion approve` - Approve a promotion

### Artifact management

Commands for working with artifacts:

- `artifact register` - Register a new artifact
- `artifact list` - List artifacts
- `artifact inspect` - View artifact details

### Deployment tracking

Commands for monitoring deployments:

- `deployment list` - List recent deployments
- `deployment status` - Check deployment status
- `deployment logs` - View deployment logs

## Authentication

Authenticate with Galaxy:

```bash
konfidence login --galaxy <galaxy-url>
```

## Configuration

Configure default options in `~/.konfidence/config.yaml`:

```yaml
galaxy:
  url: https://galaxy.example.com
  timeout: 30s
deployment:
  namespace: konfidence-system
```

## Exit codes

- `0` - Success
- `1` - General error
- `2` - Command syntax error
- `3` - Authentication error

## See also

- [CRD reference](/docs/reference/crd) - Custom resource definitions
- [Glossary](/docs/reference/glossary) - Terminology reference

