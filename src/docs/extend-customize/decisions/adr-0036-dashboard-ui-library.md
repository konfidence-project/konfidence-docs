---
id: ADR-0036
title: "Dashboard UI component and CSS library"
description: "Selects Skeleton v5 with Tailwind CSS v4 as the dashboard UI stack and Paraglide 2 for internationalization. Closes the open items left by ADR-0035."
status: accepted
date_approved: 2026-08-04
authors: [robert-ehni]
category: Architecture Pattern
impact: High
dependencies: [ADR-0035]
pageClass: adr
outline: deep
---
# ADR-0036: Dashboard UI component and CSS library

<AdrHeader />

## Context

[ADR-0035](./adr-0035-dashboard-technology-stack.md) selected the core dashboard technology stack.
It deferred two items: the UI component library and the general CSS library.
The prototype behind ADR-0035 used [SAP UI5 Web Components](https://ui5.github.io/webcomponents/) without a general CSS library.
It named [Skeleton](https://www.skeleton.dev/) and [shadcn-svelte](https://www.shadcn-svelte.com/) as the remaining options to evaluate.

Three parallel prototypes were built to make that evaluation concrete.
Each prototype uses the technology stack fixed by ADR-0035.
Each prototype implements the same feature set:

- Authentication against the mock API.
- Project selection.
- Project landscape view.
- Vector deployments table with a master-and-detail view.
- Settings dialog.
- Three themes: a light Konfidence theme, a dark Konfidence theme, and an enterprise-blue theme.
- English and German localization.
- A Playwright end-to-end suite.

The three prototypes are:

- Skeleton v5 with Tailwind CSS v4 (https://github.com/konfidence-project/konfidence/pull/112).
- shadcn-svelte with Tailwind CSS v4 (https://github.com/konfidence-project/konfidence/pull/113)
- SAP UI5 Web Components with a custom Less-based theme derived from `@sap-theming/theming-base-content` (https://github.com/konfidence-project/konfidence/pull/45)

Server-side rendering is not a hard requirement for the dashboard.
An option that requires client-side rendering only is therefore not disqualified.
The dashboard is served as a standalone Node.js application through `@sveltejs/adapter-node`, as decided in ADR-0035.

No external product context imposes UI technology, internationalization or accessibility requirements on the dashboard.
The three prototypes therefore already implement English and German localization and follow common accessibility patterns, but neither area is a hard external requirement that would force a specific choice.

One product-level requirement is already known.
Depending on the use case, Konfidence UIs are expected to be embedded into [OpenMFP](https://openmfp.org/)-based portals.
ADR-0035 already fixed the integration model at the deployment level: integration into other dashboards happens at runtime through an iframe or micro-frontend, not as a library or bundled static assets.
The concrete OpenMFP integration constraints for the Konfidence dashboard are still open and will be confirmed with the OpenMFP maintainers.
That work is a follow-up item and is not resolved by this ADR.

This ADR records the observed advantages and drawbacks of each option and selects the UI component library, the CSS library, and the internationalization library.

## Considered Solutions

### UI Component Library

#### [SAP UI5 Web Components](https://ui5.github.io/webcomponents/) with [Fiori](https://ui5.github.io/webcomponents/components/fiori/)

The prototype uses `@ui5/webcomponents`, `@ui5/webcomponents-fiori`, and `@ui5/webcomponents-icons` together with a custom Less-based theme derived from `@sap-theming/theming-base-content`.
Localization uses the native UI5 i18n mechanism.

Current framework footprint: the dashboard uses UI5 tags directly in Svelte templates alongside the Fiori shell.
Only a small number of custom Svelte components sit on top, mostly for domain-specific views.
Additional dashboard views will primarily be composed from further UI5 tags rather than new custom components.

Advantages:

- Native Fiori design and interaction patterns.
- Ready-to-use shell, side navigation, user menu, and settings dialog.
- Accessibility is implemented and maintained inside each web component.
- Access to the SAP theming pipeline, including `sap_horizon` and custom themes derived from `@sap-theming/theming-base-content`.
- Native internationalization using standard translation files.
- Component upgrades and security fixes arrive as ordinary package updates.

Drawbacks:

- Server-side rendering must be disabled because UI5 web components require a DOM at boot time.
- Native Svelte features such as two-way binding, form actions, and client-side link navigation do not integrate with UI5 controls and must be wired manually.
- The Svelte compiler does not recognize custom elements as interactive, so accessibility lint rules have to be suppressed on UI5 tags.
- Some common customizations require reaching into private UI5 APIs or shadow-DOM internals, which couples the application to specific UI5 versions.
- Icon bundling is cumbersome and slows down component tests.
- The theming pipeline is heavy and does not integrate smoothly with UI5's own runtime theme switching.

#### [Skeleton](https://www.skeleton.dev/) v5 with Tailwind CSS v4

The prototype uses `@skeletonlabs/skeleton` for CSS presets and the theme layer.
It uses `@skeletonlabs/skeleton-svelte` for Svelte components backed by [Zag.js](https://zagjs.com/) state machines.
It uses [Tailwind CSS](https://tailwindcss.com/) v4 through `@tailwindcss/vite`.
Localization uses [`svelte-i18n`](https://github.com/kaisermann/svelte-i18n).

Current framework footprint: Skeleton contributes CSS preset classes plus a small set of Svelte components (`Menu`, `Dialog`, `Tabs`, `Avatar`, `Portal`).
The application frame (header, sidebar, mobile behavior) is hand-rolled on top of native HTML and Tailwind, since Skeleton does not ship an app shell.
Additional dashboard views can pick further Skeleton components from `@skeletonlabs/skeleton-svelte` when needed, without adding vendored code to the repository.

Advantages:

- Most of the UI is regular HTML plus Tailwind utilities, so refactoring stays cheap and design changes touch few files.
- Interactive components are backed by Zag.js state machines with correct keyboard, focus, and screen-reader behavior out of the box.
- Server-side rendering works with the SvelteKit defaults.
- The prototype's accessibility test suite passes across all themes.
- Design tokens can be layered so routes reference application tokens rather than palette names, which keeps themes isolated to a single stylesheet.
- Standard Svelte features (two-way binding, event handlers, ARIA live regions) work as expected.
- No workarounds, private-API dependencies, or lint suppressions are needed to make the components fit into Svelte.
- Internationalization integrates with SvelteKit's server-side rendering.

Drawbacks:

- Skeleton v5 became generally available in 2026, with a smaller community and third-party ecosystem than shadcn-svelte and a release cadence that has not yet stabilized.
- Skeleton does not provide an equivalent of the Fiori shell, so the application frame (header, sidebar, mobile behavior) must be hand-rolled.
- Skeleton's Svelte component set is smaller than shadcn-svelte's or UI5's; most of Skeleton's value is a CSS preset design system rather than a component library.
- Styling variants of Skeleton components requires knowledge of their internal data attributes.
- No Fiori look and feel is delivered by the library itself; the SAP-style theme in the prototype approximates it through CSS variables only.

#### [shadcn-svelte](https://www.shadcn-svelte.com/) with Tailwind CSS v4

The prototype uses shadcn-svelte's registry to copy component sources into the repository.
The primitives are provided by [`bits-ui`](https://bits-ui.com/), a Svelte port of [Radix](https://www.radix-ui.com/).
Localization uses [Paraglide 2](https://inlang.com/m/gerre34r) (Inlang).

Current framework footprint: shadcn-svelte does not ship a runtime component library.
Instead, component sources are copied from the registry into the repository and maintained there.
The dashboard already carries a non-trivial amount of vendored primitive code, and every additional shadcn component adopted for future views adds further vendored code that the project must own and upgrade manually.

Advantages:

- Strong accessibility support through bits-ui, which implements Radix primitives in Svelte and covers keyboard, focus, and ARIA out of the box.
- No library lock-in for the primitives, since the vendored sources live in the repository and can be patched or forked directly.
- Composition ergonomics allow decorating primitives with application components without extra wrappers.
- The prototype's accessibility test suite passes.
- Internationalization is compile-time typed and integrates with SvelteKit's server-side rendering.
- Server-side rendering works with the SvelteKit defaults.
- Design tokens are structured and can be extended with application-specific slots.

Drawbacks:

- Vendored primitive code lives in the repository, and every upgrade requires re-running the shadcn CLI and reconciling patches against divergent local changes.
- Several components common to enterprise dashboards are not adopted or not yet available, so the shell and native controls are hand-rolled; adopting more shadcn components later grows the vendored surface.
- Developers need to understand two abstraction layers: bits-ui primitives and the shadcn wrappers on top of them.
- Small Svelte 5 rune quirks in bits-ui need targeted workarounds.
- No Fiori look and feel is delivered by the library; the SAP-style theme approximates it through design tokens only.
- shadcn-svelte is the newest of the three libraries under consideration, with less certain long-term maintainer commitment than UI5 (SAP) or Skeleton (Skeleton Labs).

### CSS Library

#### [Tailwind CSS](https://tailwindcss.com/) v4

Both the Skeleton and the shadcn-svelte prototypes use Tailwind CSS v4 via `@tailwindcss/vite`.
Configuration lives entirely in a single CSS entry file and no separate JavaScript configuration is needed.

Advantages:

- CSS-first configuration matches the Vite-centric toolchain selected in ADR-0035.
- CSS variables can be exposed as Tailwind utilities, which keeps the design-token layer separate from component code.
- Broad ecosystem, familiar to most frontend developers, and integrates directly with both remaining UI component candidates.
- Tailwind v4 supports arbitrary values in class strings, which reduces the need for custom CSS for one-off sizing.

Drawbacks:

- Class strings in templates can grow long and are sometimes harder to review than named CSS rules.
- Utility-first CSS has a learning curve for developers unfamiliar with it.
- The correspondence between Tailwind utilities and the design intent is implicit in the class list and left to conventions and the token layer.

#### Scoped Svelte styles with [Less](https://lesscss.org/)

The UI5 prototype uses scoped `<style>` blocks per Svelte component and a set of Less files that compile against `@sap-theming/theming-base-content` to produce the two Konfidence themes.
No general CSS library is used.

Advantages:

- Styles are colocated with the components they apply to.
- Less is the SAP theming toolchain's native language and interoperates directly with `@sap-theming/theming-base-content`.

Drawbacks:

- There is no shared utility layer, so common patterns (spacing, typography, responsive breakpoints) are re-implemented in each component's style block.
- The compiled theme CSS is large and needs regeneration on theme changes.
- The approach exists only because it is the least resistant path for UI5-specific theming, not because it is preferred on its own merits.

## Cross-Cutting Evaluation

### Look and Feel

Only UI5 Web Components deliver the Fiori design and interaction patterns natively.
Skeleton and shadcn-svelte can approximate the Fiori look through CSS variables, and both prototypes already ship an `sap_horizon` theme.
Component shapes and interaction details (the shell bar, side navigation, and settings dialog in particular) still need to be re-created with the non-UI5 candidates.

### Accessibility

There is no external accessibility mandate on the dashboard.

Skeleton and shadcn-svelte both provide primitives with strong accessibility semantics and run an accessibility test suite in the prototype.
UI5 Web Components implement accessibility inside each component, but the UI5 prototype has no such test suite and needs accessibility lint suppressions because the Svelte compiler does not recognize custom elements as interactive.

### Internationalization

There is no external internationalization mandate on the dashboard.
The three prototypes support English and German for parity in the evaluation, and each uses a different underlying i18n library.
The i18n technology choice is largely independent of the UI component library.

### OpenMFP Integration

The Konfidence dashboard is expected to be embedded into OpenMFP-based portals.
ADR-0035 already fixed the integration model at the deployment level (iframe or micro-frontend, not a library or bundled static assets).
All three candidates can be embedded in an iframe.
Deeper micro-frontend integration needs to be confirmed with the OpenMFP maintainers and is a follow-up item.

### Maintainability and Upgrade Path

Skeleton and UI5 receive upgrades as ordinary package bumps.
UI5's reliance on private CSS tokens and internal APIs in the prototype additionally couples the application to specific UI5 versions and will need attention on every UI5 upgrade.
shadcn-svelte's primitives are vendored into the repository and require manual reconciliation against upstream changes on every upgrade.
The vendored surface grows as further shadcn components are adopted for future views.

### Testability

Skeleton and shadcn-svelte render into standard DOM and are exercised through Vitest browser mode and Playwright end-to-end tests without special setup.
UI5 renders into shadow roots, which requires extra care in tests, and component tests have additional setup requirements.

### Ease of Use

Skeleton and shadcn-svelte behave as ordinary Svelte components and support the standard SvelteKit patterns (two-way binding, form actions, client-side link navigation).
UI5 controls require manual event wiring for every input and workarounds for some components.

### Server-Side Rendering

Skeleton and shadcn-svelte render server-side by default.
UI5 requires client-side rendering only.
SSR is not a hard requirement, so this does not disqualify UI5, but it does close off a capability that the other two candidates retain.

### Ecosystem Risk

SAP UI5 Web Components are maintained by SAP with an enterprise support model.
Skeleton is maintained by Skeleton Labs; v5 is recent, but the project is established.
shadcn-svelte is the newest of the three and grows quickly, but its long-term maintainer commitment is the least certain.

## Decision

The dashboard adopts **Skeleton v5** as its UI component library, **Tailwind CSS v4** as its general CSS library, and **Paraglide 2** as its internationalization library.

**SAP UI5 Web Components are not selected**.
The largest UI5 advantage is the Fiori shell.
That advantage shrinks once Konfidence UIs are integrated into OpenMFP-based portals, where the parent shell provides the chrome.
The largest UI5 drawbacks are not one-time integration costs.
They are ongoing structural friction: no native Svelte reactivity for UI5 controls, private-API workarounds that couple the application to specific UI5 versions, and accessibility lint suppressions on every UI5 tag.
These costs compound as further dashboard views are added.
No external body mandates Fiori, which removes the main external argument for it.
Konfidence is a developer- and platform-facing tool rather than an end-user business application, and Fiori is optimized for the latter.

**shadcn-svelte is not selected**.
Its main advantage over Skeleton is stronger accessibility parity through bits-ui, a Svelte port of Radix.
Skeleton's Zag.js primitives largely match that parity without introducing vendored code that the project has to own and upgrade manually.
Neither shadcn-svelte nor Skeleton delivers enterprise-shell components (shell, side navigation, settings dialog) out of the box, so those would remain to be manually implemented either way.

**Skeleton v5** keeps the dashboard's code idiomatic Svelte, works with SvelteKit's server-side rendering, and does not require workarounds around the Svelte compiler or web-component boundaries.
It also aligns with the goal stated in ADR-0035 of gaining experience with a technology outside React and Vue.js.
Its interactive components are backed by Zag.js state machines, which provide correct keyboard, focus, and screen-reader behavior out of the box.

**Tailwind CSS v4** pairs cleanly with Skeleton, matches the Vite-centric toolchain selected in ADR-0035, and needs no separate JavaScript configuration.

**Paraglide 2** is selected for internationalization over `svelte-i18n` and UI5's native i18n bundle.
Compile-time typed message keys catch missing or renamed messages at build time, tree-shaking of unused messages scales better than runtime dictionaries as locale content grows, and integration with SvelteKit's server-side rendering is straightforward.
UI5's native i18n bundle was viable only if UI5 was selected.
`svelte-i18n` remains a defensible fallback if the team later decides against a build-step-typed approach.

## Consequences

The Skeleton prototype is promoted to the dashboard's main implementation.
The UI5 and shadcn-svelte prototypes, together with the two unselected stage-card variants used to compare approaches, are removed from the repository.

Follow-up work resulting from this decision:

- Tailwind CSS v4 is to be adapted as the general CSS library.
- Skeleton library is to be adapted as ui framework
- Skeleton theme is to be adapted to match the prototype mock
- Paraglide library is to be adapted for i18n
- Production ready dashboard protoype can be implemented

OpenMFP integration remains a follow-up item.

## Related ADRs

- **Depends on**: [ADR-0035](./adr-0035-dashboard-technology-stack.md) - Selects the meta-framework, build tool, runtime, package manager, API tooling, validation library, and testing and linting stack that this ADR builds on, and leaves the UI component library and CSS library as open items that this ADR closes.
- **Related to**: [ADR-0023](./adr-0023-repo-structure.md) - Establishes the Konfidence monorepo in which the dashboard prototype lives.
