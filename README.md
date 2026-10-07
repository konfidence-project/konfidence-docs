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

## Pre-release mode

The site builds in pre-release mode by default. It shows a fixed "pre-release software" banner on every page (`.vitepress/theme/components/PreReleaseBanner.vue`) and a `pre-alpha` badge next to the navbar logo.

To hide both, build with the flag off:

```bash
KONFIDENCE_PRERELEASE=false pnpm build
```

Independently of the flag, `srcExclude` in `.vitepress/config.mts` lists unfinished pages that are excluded from the build.

## AI crawler files

`pnpm build` generates `/llms.txt`, `/llms-full.txt`, and Markdown versions of published pages in `.vitepress/dist`. The `llms.txt` index uses `https://konfidence.cloud` URLs. The plugin shares the `srcExclude` list in `.vitepress/config.mts`, so unfinished pages are omitted from the crawler files as well as the site. Check these generated files when adding or excluding pages; they are not committed to the repository.

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
