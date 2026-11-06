[![REUSE status](https://api.reuse.software/badge/github.com/konfidence-project/konfidence-docs)](https://api.reuse.software/info/github.com/konfidence-project/konfidence-docs)

# Konfidence Docs

This is the official documentation for the Konfidence project, built with [VitePress](https://vitepress.dev/).

## Requirements

### Prerequisites

- Node.js (v24 or higher)
- pnpm

## Download and Installation

### Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/konfidence-project/konfidence-docs.git
   cd konfidence-docs
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

   The docs will be available at `http://localhost:5173`

## Check documentation prose

[Vale](https://docs.vale.sh/topics/quickstart) checks spelling, terminology, and selected rules from our style guide. Install it separately from the Node.js dependencies. On macOS:

```bash
brew install vale
vale --version
```

CI uses Vale **3.25.1**. For matching local results, use the same version from the [official releases](https://github.com/vale-cli/vale/releases/tag/v3.25.1); Homebrew may provide a newer version.

Run these commands from the repository root:

```bash
pnpm lint:prose
pnpm test:prose
```

The first command checks authored Markdown in `src/`, this README, and `CONTRIBUTING.md`. The second tests the Vale configuration against valid and invalid examples. The rules and vocabulary are included in the repository, so no `vale sync` or external style package is needed. See the [contribution guide](https://github.com/konfidence-project/konfidence-docs/blob/main/CONTRIBUTING.md#prose-checks-with-vale) for findings, exceptions, and rule maintenance.

## Markdown structure checks

[markdownlint-cli2](https://github.com/DavidAnson/markdownlint-cli2) is included in the development dependencies. After `pnpm install`, run:

```bash
pnpm lint:markdown
pnpm test:markdown
```

The first command checks heading levels, list indentation, code block language labels, image alternative text, reference links, and table columns. The second tests the configuration with valid and invalid examples, including VitePress syntax. These checks complement Vale's prose checks. Findings are warnings during rollout; the commands do not rewrite files. See the [contribution guide](https://github.com/konfidence-project/konfidence-docs/blob/main/CONTRIBUTING.md#markdown-structure-checks) for single-page checks, pull request annotations, and maintenance.

## Link checks with lychee

[lychee](https://lychee.cli.rs/guides/getting-started/) checks links, heading fragments, and static assets in the built website. Install it separately from the Node.js dependencies. On macOS:

```bash
brew install lychee
lychee --version
```

CI uses lychee **0.24.2**. For matching local results, use the same version from the [official releases](https://github.com/lycheeverse/lychee/releases/tag/lychee-v0.24.2); Homebrew may provide a newer version.

Build the current content before checking links:

```bash
pnpm build
pnpm lint:links
pnpm test:links
```

The link check runs without network access. To check external URLs as well, run `pnpm lint:links:external` after building. GitHub checks internal targets on pull requests and checks external availability on weekly and manual runs. See the [contribution guide](https://github.com/konfidence-project/konfidence-docs/blob/main/CONTRIBUTING.md#link-checks-with-lychee) for reports, exceptions, and maintenance.

## Pre-release mode

The site builds in pre-release mode by default. It shows a fixed "pre-release software" banner on every page (`.vitepress/theme/components/PreReleaseBanner.vue`) and a `pre-alpha` badge next to the navbar logo.

To hide both, build with the flag off:

```bash
KONFIDENCE_PRERELEASE=false pnpm build
```

Independently of the flag, `srcExclude` in `.vitepress/config.mts` lists unfinished pages that are excluded from the build.

## Support, Feedback, Contributing

This project is open to feature requests/suggestions, bug reports etc. via [GitHub issues](https://github.com/konfidence-project/konfidence-docs/issues).
Contribution and feedback are encouraged and always welcome.
For more information about how to contribute see our [Contribution Guidelines](https://github.com/konfidence-project/.github/blob/main/CONTRIBUTING.md).

## Security / Disclosure

If you find any bug that may be a security problem, please follow our instructions at [in our security policy](https://github.com/konfidence-project/.github/blob/main/SECURITY.md) on how to report it. Please do not create GitHub issues for security-related doubts or problems.

## Code of Conduct

We as members, contributors, and leaders pledge to make participation in our community a harassment-free experience for everyone. By participating in this project, you agree to abide by its [Code of Conduct](https://github.com/konfidence-project/.github/blob/main/CODE_OF_CONDUCT.md) at all times.

## Licensing

Copyright 2026 SAP SE or an SAP affiliate company and konfidence-project contributors.
Please see our [LICENSES](LICENSES) for copyright and license information.
Detailed information including third-party components and their licensing/copyright information is available [via the REUSE tool](https://api.reuse.software/info/github.com/konfidence-project/konfidence-docs).
