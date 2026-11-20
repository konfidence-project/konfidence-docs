# Documentation navigation preview

From the repository root, run `pnpm dev:navigation`. Open the local address ending in `/platforms/` that VitePress prints. The preview reloads as you edit. Use `pnpm build:navigation` to check the complete site.

Open **Deployers** to choose Kubernetes, S3, or Cloud Foundry. The sidebar groups under **Konfidence core** expand to show their guides. **Community** groups the existing pages under **Contribute**, **Write documentation**, and **Architecture**. Section headings only expand and collapse; they do not open separate pages.

- Edit the [deployer directory](./pages/deployers/index.md) or the [Helm guide](./pages/deployers/kubernetes/helm.md) to change what readers see.
- Edit the [sidebar](./.vitepress/navigation.mts) or the [site configuration](./.vitepress/config.mts) to change navigation.
- [Inherited pages](./inherited.json) and architecture decision records use the maintained [documentation sources](../../src/docs/). The [route map](./routes.json) resolves links to their locations in the preview.
