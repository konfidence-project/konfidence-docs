# Documentation navigation preview

From the repository root, run `pnpm dev:navigation`. Open the local address ending in `/platforms/` that VitePress prints. The preview reloads as you edit. Use `pnpm build:navigation` to check the complete site.

To follow the Helm example, open **Documentation**, then **Build**, and choose **Author a Helm artifact**. You can reach the same guide from **Deployers** under **Kubernetes**.

- Edit the [Build page](./pages/core/build.md), the [deployer directory](./pages/deployers/index.md), or the [Helm guide](./pages/deployers/kubernetes/helm.md) to change what readers see.
- Edit the [sidebar](./.vitepress/navigation.mts) or the [site configuration](./.vitepress/config.mts) to change navigation.
- [Inherited pages](./inherited.json) and architecture decision records use the maintained [documentation sources](../../src/docs/). The [route map](./routes.json) resolves links to their locations in the preview.
