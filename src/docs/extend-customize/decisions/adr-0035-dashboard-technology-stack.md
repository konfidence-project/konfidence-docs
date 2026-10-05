---
id: ADR-0035
title: "Dashboard technology stack"
description: "Selects the runtime, package manager, frontend framework, OpenAPI schema tooling, testing, linting, formatting, and validation technologies for the Konfidence dashboard"
status: accepted
date_approved: 2026-08-04
authors: [AnsgarH1]
category: Architecture Pattern
impact: High
dependencies: [ADR-0023, ADR-0029]
pageClass: adr
outline: deep
---
# ADR-0035: Dashboard technology stack

<AdrHeader />

## Context

Konfidence needs a consistent technology stack for building, testing, and running its dashboard. A prototype exists in `apps/konfidence-ui-prototype` and provides the implementation experience behind this decision. The prototype is part of the Konfidence monorepo, whose core structure was established by [ADR-0023](./adr-0023-repo-structure.md). It consumes the OpenAPI contract defined by [ADR-0029](./adr-0029-api-gateway.md) and is intended to run as a standalone application in a containerized [Kubernetes](https://kubernetes.io/) environment.

## Considered Solutions

### Frontend Meta-Framework

#### [SvelteKit](https://svelte.dev/docs/kit) (selected)

SvelteKit is mature at more than five years old and has one of the highest satisfaction ratings alongside [SolidJS](https://www.solidjs.com/). It also supports the team's goal of gaining experience with a technology other than React or Vue.js.

SvelteKit includes the application capabilities the dashboard needs, including routing, environment handling, state management, RPC-style remote functions, and straightforward deployment options. It has good support for vanilla JavaScript libraries and a sufficiently mature ecosystem. The prototype confirms these capabilities and uses SvelteKit with Vite and the Node adapter. Its current use of remote functions requires SvelteKit's experimental `remoteFunctions` setting.

Selecting SvelteKit commits the dashboard to SvelteKit conventions and the standard [Svelte](https://svelte.dev/docs/svelte/) ecosystem. It also establishes Vite as the foundation of the build toolchain.

#### [React](https://react.dev/) with [TanStack Start](https://tanstack.com/start/latest)

React is already familiar, but does not meet the goal of trying a technology outside React and Vue.js. TanStack Start was considered to provide the desired meta-framework capabilities.

#### [Vue.js](https://vuejs.org/)

Vue.js was considered but does not meet the goal of trying a technology outside React and Vue.js.

### Build Tool

#### [Vite](https://vite.dev/) (selected)

SvelteKit is designed around Vite, so replacing it would require reimplementing parts of the framework integration. Vite is also an established frontend build tool and would remain a strong candidate for other meta-frameworks, including [Nuxt](https://nuxt.com/) and TanStack Start. Using it as the dashboard's core build tool also makes other tools from the Vite ecosystem natural choices.

#### [Webpack](https://webpack.js.org/)

Webpack has no official SvelteKit integration, provides a slower development experience, and requires significantly more configuration.

#### [Rsbuild](https://rsbuild.rs/) and [Rspack](https://rspack.rs/)

Rsbuild and Rspack are fast, but lack mature, first-class SvelteKit support and the same degree of ecosystem compatibility.

#### [Turbopack](https://nextjs.org/docs/app/api-reference/turbopack)

Turbopack primarily targets [Next.js](https://nextjs.org/) and has no official Svelte or SvelteKit integration.

#### [Bun Bundler](https://bun.sh/docs/bundler)

Bun's bundler does not provide complete SvelteKit integration. Bun is better suited to complementing Vite as a runtime or package manager than replacing it as the dashboard's build tool.

### Runtime

#### Static Hosting as a Single-Page Application

SvelteKit can bundle the dashboard as a single-page application that the API server could serve directly. This would simplify deployment, but would give up server-side routing, shared server and client context, security features such as HTTP-only cookies, and some performance and user-experience benefits.

#### [Node.js](https://nodejs.org/) (selected)

The dashboard uses Node.js and [`@sveltejs/adapter-node`](https://svelte.dev/docs/kit/adapter-node) with its default configuration to produce a standalone application for [Docker](https://docs.docker.com/) and Kubernetes deployments.

#### [Bun](https://bun.sh/)

Bun does not provide features the dashboard currently needs beyond those available in the Node.js ecosystem. It would be more compelling if the complete project used the Bun ecosystem. Its acquisition by Anthropic and rewrite to Rust also create uncertainty about its future direction, so we do not introduce that dependency for either the runtime or package management.

### Package Manager

#### [pnpm](https://pnpm.io/) (selected)

pnpm provides strong monorepo support, efficient disk usage, good performance, and sufficient maturity. Although contributors need an additional binary beyond Node.js, the project's [Hermit](https://cashapp.github.io/hermit/) environment mitigates that requirement.

#### [npm](https://docs.npmjs.com/)

npm's main advantage is that it ships with Node.js. It has lower performance and more limited monorepo support than the alternatives considered.

#### [Bun](https://bun.sh/)

Bun offers the fastest package installation and good monorepo support, but was not selected for the reasons described in the runtime evaluation. pnpm's monorepo advantages will become more significant if the repository gains additional Node.js or TypeScript projects.

### UI Component Library

The prototype used [UI5 Web Components](https://ui5.github.io/webcomponents/) with [Fiori components](https://ui5.github.io/webcomponents/components/fiori/). [ADR-0036](./adr-0036-dashboard-ui-library.md) selects the component library.

UI5 works with Svelte. However, the prototype disables server-side rendering while using it, native Svelte behavior such as link navigation and events must be wired manually, theming is not intuitive and feels like a workaround, and icon bundling is cumbersome.

The alternatives still to be evaluated are [Skeleton](https://www.skeleton.dev/) and [shadcn-svelte](https://www.shadcn-svelte.com/). UI5 was the prototype choice, but this ADR does not select the final dashboard component library.

### CSS Library

The selection remains open. [Tailwind CSS](https://tailwindcss.com/) is a possible option. The prototype does not currently use a general CSS library.

### OpenAPI Schema Generation and API Client

#### [OpenAPI TypeScript](https://openapi-ts.dev/) (selected)

`openapi-typescript` generates TypeScript schema types from the Konfidence OpenAPI contract and is straightforward to use. The same maintainer provides [`openapi-fetch`](https://openapi-ts.dev/openapi-fetch/), which creates a typed Fetch API client. Its fetch implementation can be replaced to inject an authenticated client.

#### [Orval](https://orval.dev/)

Orval appears more focused on browser-based fetching clients and is heavier than needed for the dashboard.

### Testing

The testing strategy follows common frontend practice: static checks cover types, linting, and formatting; fast unit tests cover business logic and utilities; component and integration tests form the largest UI testing layer; and real-browser tests cover components that need browser fidelity and critical end-to-end journeys. Accessibility and visual regression tests are added where they provide specific value.

#### Unit Tests

##### [Vitest](https://vitest.dev/) (selected)

Vitest is a common test runner for greenfield frontend projects. Its Vite integration provides a consistent and performant test environment for the dashboard.

##### [Jest](https://jestjs.io/)

Jest established many of the testing APIs now common across the frontend ecosystem. However, it requires additional bundler integration and is not directly compatible with Vite.

#### Component and Integration Tests

##### [Vitest Browser Mode](https://vitest.dev/guide/browser/) (selected)

Vitest browser mode integrates with the unit test runner and executes tests in a real browser through Playwright or [WebdriverIO](https://webdriver.io/). It avoids the additional setup and limitations of a simulated DOM environment.

##### [jsdom](https://github.com/jsdom/jsdom) and [happy-dom](https://github.com/capricorn86/happy-dom)

jsdom and happy-dom require additional configuration and provide only a simulated browser environment.

##### [Playwright Component Testing](https://playwright.dev/docs/test-components)

Playwright component testing requires a separate development server and a more complex setup. Its documentation and integration still feel less mature and more experimental than Vitest browser mode.

#### Browser Tests

##### [Playwright](https://playwright.dev/) (selected)

Playwright is an established browser-testing tool with which the team is already familiar. It can also support future performance, accessibility, and visual regression tests.

##### [Cypress](https://www.cypress.io/)

Cypress was not evaluated in depth because the team lacks experience with it and its reported satisfaction has declined in recent State of JavaScript surveys.

#### Test Organization

##### Colocated Tests Distinguished by File Name (selected)

Tests are colocated with the modules or components they cover, and file-name patterns identify the required runtime and setup. Using file names to express runtime and bundling concerns is common in the frontend ecosystem, including configuration files and SvelteKit's file-based routing conventions.

- `*.test.ts` identifies unit tests run with Vitest.
- `*.svelte.test.ts` identifies component tests run with Vitest browser mode.
- `*.test-e2e.ts` identifies colocated browser tests run with Playwright.
- `e2e/` contains Playwright tests for complete user journeys across multiple pages.

End-to-end tests that span multiple pages are the only exception to colocation because they do not belong to a single page or component.

##### Dedicated Test Directories

Dedicated directories such as `test_unit/` or `test_component/` could also identify test environments, but would separate tests from the features they cover.

### Type Checking, Linting, and Formatting

#### Type Checking

The [TypeScript](https://www.typescriptlang.org/) compiler performs type checking with `tsc --noEmit`; build tools only remove type annotations and do not validate them. The dashboard uses TypeScript 6 where compatibility requires it and adopts the Go-based TypeScript 7 implementation where the surrounding tooling already supports it.

#### Linting

##### [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) (selected)

Oxlint is a Rust-based linter in the [Oxc](https://oxc.rs/) toolchain, maintained by VoidZero, the team behind Vite. It has been generally available since December 2023 and stable since version 1 in June 2025. It runs across all available threads and is substantially faster than ESLint. Its plugin API is ESLint-compatible, but it does not yet support linting Svelte templates.

##### [ESLint](https://eslint.org/) (partially selected)

ESLint remains the most widely adopted and compatible frontend linter, although it can become slow in large codebases. The dashboard retains it specifically for Svelte template linting, which Oxlint does not yet support.

##### [Biome](https://biomejs.dev/)

Biome is another Rust-based alternative that aims to replace both ESLint and Prettier. It provides a more curated set of linting rules, but does not offer a compelling advantage over the selected Oxc tooling for this project.

#### Formatting

##### [Oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) (selected)

Oxfmt is the Rust-based formatter from the Oxc toolchain and is also maintained by VoidZero. It aims to provide Prettier-compatible formatting with much faster execution, but is still in beta.

##### [Prettier](https://prettier.io/)

Prettier is the established formatter with the broadest adoption and compatibility, but it can become slower in large codebases.

### Validation

#### [Valibot](https://valibot.dev/) (selected)

SvelteKit accepts standard schema libraries in places such as form handlers and environment setup. Valibot is the most minimal and fastest suitable option we evaluated while being mature enough for the dashboard. Its tree shaking and code splitting are advantages over Zod. The prototype uses Valibot for environment variables and SvelteKit remote function inputs.

#### [Zod](https://zod.dev/)

Zod was considered but does not provide the tree-shaking and code-splitting advantages that led us to select Valibot.

## Decision

The dashboard uses SvelteKit as its frontend meta-framework, Vite as its build tool, Node.js as its runtime, and pnpm as its package manager. It is deployed as a standalone application by using `@sveltejs/adapter-node` rather than being bundled as a static single-page application.

The dashboard generates TypeScript schemas with `openapi-typescript` and uses `openapi-fetch` as its typed API client. Valibot provides runtime schema validation. The UI component library and general CSS library remain open decisions; UI5 Web Components were a prototype choice only (see ADR-0036).

Vitest runs unit tests, Vitest browser mode runs component and integration tests, and Playwright runs browser and end-to-end tests. Tests are colocated with their subject and distinguished by file-name patterns, except for multi-page journeys in `e2e/`.

The TypeScript compiler performs static type checking. Oxlint is the primary linter, with ESLint retained for Svelte templates, and Oxfmt formats the source code.

## Consequences

The selected stack provides an integrated SvelteKit and Vite development experience, a typed client generated from the API contract, and explicit test layers that use real browsers where browser fidelity matters. pnpm and the Oxc toolchain also keep dependency installation and local checks efficient.

The dashboard must be deployed to a supported Konfidence runtime. The prototype will run as a Kubernetes Deployment when enabled through a [Helm](https://helm.sh/) chart option. Integration into other dashboards or portals must therefore happen at runtime through an approach such as an iframe or micro-frontend, rather than through a library or bundled static assets.

The choice of SvelteKit creates framework and ecosystem lock-in, while using `openapi-typescript` and `openapi-fetch` together introduces some tooling lock-in. pnpm adds a contributor prerequisite, although Hermit supplies the binary for this project.

The Oxc toolchain has a shorter adoption history than ESLint and Prettier, Oxfmt remains in beta, and Oxlint cannot yet lint Svelte templates. VoidZero's acquisition by Cloudflare introduces additional uncertainty about the toolchain's direction. If necessary, the dashboard can replace Oxlint and Oxfmt with ESLint and Prettier without changing its application architecture.

The component and CSS library choices remain unresolved and require separate evaluation before the prototype stack becomes the final visual foundation of the dashboard.

## Related ADRs

- **Related to**: [ADR-0023](./adr-0023-repo-structure.md) - Establishes the Konfidence monorepo and leaves the dashboard location open; the prototype currently places it in that monorepo.
- **Depends on**: [ADR-0029](./adr-0029-api-gateway.md) - Establishes the OpenAPI contract from which the dashboard generates its TypeScript schema.
