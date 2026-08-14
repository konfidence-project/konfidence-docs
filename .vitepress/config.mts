import { defineConfig } from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "./src",
  vite: {
    publicDir: "../public",
  },
  head: [
    // pre-release: keep the site out of search indexes until APIs stabilize
    ["meta", { name: "robots", content: "noindex" }],
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
  // pages for features that are not part of the initial release; recoverable
  // from git history / re-enabled by removing them here (issue #814)
  srcExclude: [
    "docs/deploy-operate/galaxy-installation.md",
    "docs/deploy-operate/star-installation.md",
    "docs/develop-integrate/observe-improve/paved-road.md",
    "docs/develop-integrate/run-migrations.md",
    "docs/extend-customize/create-deployer.md",
    "docs/reference/deployer-specification.md",
    "docs/reference/cli.md",
    "docs/reference/releases.md",
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: "/assets/logo/full/SVG/400_konfidence_logo_light.svg",
      dark: "/assets/logo/full/SVG/400_konfidence_logo_dark.svg",
    },
    siteTitle: false,


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
              text: "Stages and Promotions",
              link: "/docs/core-concepts/stages-and-promotions",
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
              text: "Deployers",
              collapsed: true,
              items: [
                {
                  text: "Kubernetes Deployer",
                  link: "/docs/develop-integrate/deployers/kubernetes",
                },
              ],
            },
            {
              text: "Configure signing and verification",
              link: "/docs/develop-integrate/configure-signing-and-verification",
            },
            {
              text: "Build vectors",
              link: "/docs/develop-integrate/observe-improve/build-vectors",
            },
            {
                text: "Vector Data / Configuration",
                collapsed: true,
                items: [
                    {
                        text: "Overview",
                        link: "/docs/develop-integrate/vector-data/overview",
                    },
                    {
                        text: "Add configuration to a vector",
                        link: "/docs/develop-integrate/vector-data/vector-configuration",
                    },
                    {
                        text: "Add deployment results to an artifact",
                        link: "/docs/develop-integrate/vector-data/deployment-results",
                    },
                    {
                        text: "Access vector data in your application",
                        link: "/docs/develop-integrate/vector-data/access-vector-data",
                    },
                ],
            },
            {
              text: "Define promotions",
              link: "/docs/develop-integrate/observe-improve/define-promotions",
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
              text: "Installing Konfidence",
              link: "/docs/deploy-operate/konfidence-installation",
            },
            {
              text: "Managing Projects",
              link: "/docs/deploy-operate/projects",
            },
            {
              text: "Managing Landscapes",
              link: "/docs/deploy-operate/landscapes",
            },
            {
              text: "Access Control (RBAC)",
              link: "/docs/deploy-operate/access-control",
            },
            {
              text: "Upgrading Konfidence",
              link: "/docs/deploy-operate/upgrading-konfidence",
            },
            {
                text: "Runtime Components",
                collapsed: true,
                items: [
                    {
                        text: "Overview",
                        link: "/docs/deploy-operate/runtime-components/overview",
                    },
                    {
                        text: "Vector Data Service",
                        link: "/docs/deploy-operate/runtime-components/vector-data-service",
                    },
                ],
            }
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
            { text: "Glossary", link: "/docs/reference/glossary" },
            { text: "CRDs", link: "/docs/reference/crd" },
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
