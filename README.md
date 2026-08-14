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

The site currently builds in pre-release mode (the default). It:

- shows a fixed "pre-release software" banner on every page (`.vitepress/theme/components/PreReleaseBanner.vue`)
- shows a `pre-alpha` badge next to the navbar logo
- adds a `<meta name="robots" content="noindex">` tag so search engines do not index the site
- hides the nav menu and search on the landing page and removes all landing-page links into the docs (hero buttons, final CTA points to GitHub instead); the docs remain reachable via direct URL

All of this is controlled by a single build-time flag in `.vitepress/config.mts`.

**On release**, build with the flag off to restore the full site:

```bash
KONFIDENCE_PRERELEASE=false pnpm build
```

or flip the default in `.vitepress/config.mts` (`const prerelease = ...`) and delete this section. No other changes are needed — the hero buttons, docs CTA, nav, search and indexing all come back with the flag.

Independently of the flag, `srcExclude` in `.vitepress/config.mts` lists unfinished pages that are excluded from the build; review that list on release as well.

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
