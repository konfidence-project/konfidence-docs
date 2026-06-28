import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "./src",
  vite: {
    publicDir: "../public",
  },
  head: [
    ["link", { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    [
      "link",
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
    ],
    [
      "link",
      {
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        rel: "stylesheet",
      },
    ],
  ],
  title: "Konfidence",
  description: "Public Documentation for Project Konfidence",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: "/assets/logo/full/SVG/400_konfidence_logo_light.svg",
      dark: "/assets/logo/full/SVG/400_konfidence_logo_dark.svg",
    },
    siteTitle: false,

    // Navigation bar
    nav: [
      { text: "Docs", link: "/docs/" },
      { text: "Releases", link: "/docs/reference/releases" },
    ],

    socialLinks: [
      { icon: "github", link: "https://github.com/konfidence-project" },
    ],

    // Sidebar navigation
    sidebar: {
      "/docs/": [
        { text: "Home", link: "/docs/" },
        {
          text: "Getting started",
          collapsed: false,
          items: [
            {
              text: "Quickstart",
              link: "/docs/getting-started/quickstart",
            },
            {
              text: "Deliver a sample app",
              link: "/docs/getting-started/deliver-sample-app",
            },
            {
              text: "Create your own app",
              link: "/docs/getting-started/create-vector",
            },
          ],
        },
        {
          text: "Core concepts",
          collapsed: true,
          items: [
            {
              text: "System Architecture",
              link: "/docs/core-concepts/system-architecture",
            },
            {
              text: "Vectors and Artifacts",
              link: "/docs/core-concepts/vectors-and-artifacts",
            },
            {
              text: "Delivery Flow",
              link: "/docs/core-concepts/delivery-flow",
            },
            {
              text: "Vector Deployments",
              link: "/docs/core-concepts/vector-deployments",
            },
          ],
        },
        {
          text: "Develop & Integrate",
          collapsed: true,
          items: [
            {
              text: "Prepare your Application",
              link: "/docs/develop-integrate/prepare-your-application",
            },
            {
              text: "Publish Artifacts",
              link: "/docs/develop-integrate/publish-artifacts",
            },
            {
              text: "Run Migrations",
              link: "/docs/develop-integrate/run-migrations",
            },
            {
              text: "Build vectors",
              link: "/docs/develop-integrate/observe-improve/build-vectors",
            },
            {
              text: "Use Vector-scoped Configuration",
              link: "/docs/develop-integrate/vector-configuration",
            },
            {
              text: "Define promotions",
              link: "/docs/develop-integrate/observe-improve/define-promotions",
            },
            {
              text: "Paved Road",
              link: "/docs/develop-integrate/observe-improve/paved-road",
            },
          ],
        },
        {
          text: "Deploy & Operate",
          collapsed: true,
          items: [
            {
              text: "Installation variants",
              link: "/docs/deploy-operate/installation-variants",
            },
            {
              text: "Galaxy installation",
              link: "/docs/deploy-operate/galaxy-installation",
            },
            {
              text: "Star installation",
              link: "/docs/deploy-operate/star-installation",
            },
            {
              text: "Upgrading Konfidence",
              link: "/docs/deploy-operate/upgrading-konfidence",
            },
          ],
        },
        {
          text: "Extend & Customize",
          collapsed: true,
          items: [
            {
              text: "Contributing",
              link: "/docs/extend-customize/code-of-conduct",
            },
            {
              text: "Create your own deployer",
              link: "/docs/extend-customize/create-deployer",
            },
            { text: "Style guide", link: "/docs/extend-customize/styleguide" },
            {
              text: "Guide templates",
              link: "/docs/extend-customize/guide-templates",
            },
          ],
        },
        {
          text: "Reference",
          collapsed: true,
          items: [
            { text: "CLI", link: "/docs/reference/cli" },
            { text: "CRD", link: "/docs/reference/crd" },
            { text: "Deployer Specification", link: "/docs/reference/deployer-specification" },
            { text: "Glossary", link: "/docs/reference/glossary" },
          ],
        },
      ],
    },

    // Edit link configuration
    editLink: {
      pattern:
        "https://github.com/konfidence-project/konfidence-docs/edit/main/:path",
      text: "Edit this page on GitHub",
    },

    // search configuration
    search: {
      provider: "local",
    },
  },
});
