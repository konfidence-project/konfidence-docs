# Documentation navigation preview

This working draft incorporates feedback on the first navigation proposal. Page assignments, section boundaries, and the separation of Core and deployer content still need team review.

From the repository root, run `pnpm dev:navigation`. Open the local address ending in `/platforms/` that VitePress prints. The preview reloads as you edit. Use `pnpm build:navigation` to check the complete site.

Open **Deployers** to choose Kubernetes, S3, or Cloud Foundry. Kubernetes provides the documented workflows. S3 and Cloud Foundry open clearly labeled dummy pages that demonstrate navigation only. **Konfidence core** groups tasks under **Develop & Integrate**, **Deploy & Operate**, and **Observe & Deliver**, alongside Getting started, Core concepts, and Reference. Guides sit directly under these sections, without nested subgroups. **Community** groups the existing pages under **Contribute**, **Write documentation**, and **Architecture**. Section headings only expand and collapse; they do not open separate pages.

- The preview imports pages from the maintained [documentation sources](../../src/docs/), including architecture decision records and the contribution guide. Explicit editorial drafts in [content](./content/) split shared Core explanations from Kubernetes procedures. Existing page titles are preserved; original source files are unchanged.
- Edit the [sidebar](./.vitepress/navigation.mts) or the [site configuration](./.vitepress/config.mts) to change navigation. Each guide has one canonical location. Existing overview pages remain available through their original content links; sidebar section headings have no page links.
- The [deployer directory](./pages/deployers/index.md) and platform entry pages live in `pages/`. The [deployer list](./.vitepress/deployers.mts) controls the cards and sidebar selector.
- The [route map](./routes.json) assigns one location to each guide. The [fragment map](./fragments.json) sends source links to moved sections to their new locations.

The [content review](./CONTENT-REVIEW.md) records section moves, retained information, and questions for feature owners. It is a writer-facing working document and is not published in the preview. Read it before treating the draft as complete product documentation.
