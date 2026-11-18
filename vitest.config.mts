import { defineConfig } from "vitest/config";

// kept apart from the VitePress config, which would otherwise load it as its
// Vite config
export default defineConfig({
  test: {
    environment: "node",
    // tests sit next to the script or configuration they cover
    include: ["**/*.test.{ts,mjs}"],
    exclude: ["node_modules/**", ".vitepress/cache/**", ".vitepress/dist/**"],
    // the link and Markdown tests start the lychee and markdownlint CLIs
    testTimeout: 30_000,
  },
});
