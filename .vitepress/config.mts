import { defineConfig, type HeadConfig } from "vitepress";

// pre-release mode: adds the banner, pre-alpha badge and noindex tag, and
// strips docs links, nav and search from the landing page; build with
// KONFIDENCE_PRERELEASE=false to restore the normal site
const prerelease = process.env.KONFIDENCE_PRERELEASE !== "false";

const prereleaseHead: HeadConfig[] = prerelease
  ? [["meta", { name: "robots", content: "noindex" }]]
  : [];

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "./src",
  vite: {
    publicDir: "../public",
    define: {
      __PRERELEASE__: JSON.stringify(prerelease),
    },
  },
  head: [
    ...prereleaseHead,
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
    "docs/develop-integrate/observe-improve/paved-road.md",
    "docs/develop-integrate/run-migrations.md",
    "docs/extend-customize/create-deployer.md",
    "docs/reference/deployer-specification.md",
    "docs/reference/releases.md",
  ],
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: "/assets/logo/full/SVG/400_konfidence_logo_light.svg",
      dark: "/assets/logo/full/SVG/400_konfidence_logo_dark.svg",
    },
    siteTitle: false,

    // Navigation bar (hidden on the landing page, see Layout.vue)
    nav: [{ text: "Docs", link: "/docs/" }],

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
              text: "Installing the Kden CLI",
              link: "/docs/getting-started/install-cli",
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
              text: "Vectors and Artifacts",
              link: "/docs/core-concepts/vectors-and-artifacts",
            },
            {
              text: "Landscapes and stages",
              link: "/docs/core-concepts/landscapes-and-stages",
            },
            {
              text: "Deployment model",
              link: "/docs/core-concepts/deployment-model",
            },
            {
              text: "Promotions and Delivery Flow",
              link: "/docs/core-concepts/delivery-flow",
            },
          ],
        },
        {
          text: "Develop & Integrate",
          collapsed: true,
          items: [
            {
              text: "Your application in Konfidence",
              link: "/docs/develop-integrate/prepare-your-application",
            },
            {
              text: "Artifacts",
              link: "/docs/develop-integrate/artifact-types/",
              items: [
                {
                  text: "Types of artifacts",
                  link: "/docs/develop-integrate/artifact-types/",
                },
                {
                  text: "Kustomize",
                  link: "/docs/develop-integrate/artifact-types/kustomize",
                },
                {
                  text: "Helm",
                  link: "/docs/develop-integrate/artifact-types/helm",
                },
                {
                  text: "Publish artifacts",
                  link: "/docs/develop-integrate/artifact-types/publish-artifacts",
                },
              ],
            },
            {
              text: "Build vectors",
              link: "/docs/develop-integrate/observe-improve/build-vectors",
            },
            {
                text: "Advanced features",
                link: "/docs/develop-integrate/advanced-features/",
                items: [
                    {
                        text: "Read feature flags in your application",
                        link: "/docs/develop-integrate/advanced-features/feature-flags",
                    },
                    {
                        text: "Configure signing and verification",
                        link: "/docs/develop-integrate/advanced-features/configure-signing-and-verification",
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
                ],
            },
          ],
        },
        {
          text: "Deploy & Operate",
          collapsed: true,
          items: [
            {
              text: "Prepare",
              items: [
                {
                  text: "System architecture",
                  link: "/docs/deploy-operate/plan/system-architecture",
                },
                {
                  text: "Plan for high availability",
                  link: "/docs/deploy-operate/plan/high-availability",
                },
              ],
            },
            {
              text: "Install the platform",
              items: [
                {
                  text: "Install Konfidence",
                  link: "/docs/deploy-operate/install/konfidence-installation",
                },
                {
                  text: "Give teams access to the dashboard and API",
                  link: "/docs/deploy-operate/install/expose-api",
                },
                {
                  text: "Choose and install deployers",
                  collapsed: true,
                  items: [
                    {
                      text: "Choose a deployer",
                      link: "/docs/deploy-operate/install/deployer/overview",
                    },
                    {
                      text: "Install the Kubernetes deployer",
                      link: "/docs/deploy-operate/install/deployer/kubernetes",
                    },
                  ],
                },
                {
                  text: "Connect artifact registries",
                  link: "/docs/deploy-operate/install/connect-registries",
                },
              ],
            },
            {
              text: "Administer projects and access",
              items: [
                {
                  text: "Create a project",
                  link: "/docs/deploy-operate/control-access/projects",
                },
                {
                  text: "Grant teams access to a project",
                  link: "/docs/deploy-operate/control-access/access-control",
                },
                {
                  text: "Grant CI pipelines access",
                  link: "/docs/deploy-operate/control-access/grant-ci-access",
                },
              ],
            },
            {
              text: "Prepare delivery environments",
              items: [
                {
                  text: "Create a landscape",
                  link: "/docs/deploy-operate/manage-delivery/landscapes",
                },
                {
                  text: "Configure deployment targets for a landscape",
                  link: "/docs/deploy-operate/manage-delivery/deployment-targets",
                },
                {
                  text: "Configure landscape services",
                  collapsed: true,
                  items: [
                    {
                      text: "Choose landscape services",
                      link: "/docs/deploy-operate/install/runtime-components/overview",
                    },
                    {
                      text: "Install the Vector Data Service",
                      link: "/docs/deploy-operate/install/runtime-components/vector-data-service",
                    },
                  ],
                },
              ],
            },
            {
              text: "Run delivery",
              items: [
                {
                  text: "Create a stage",
                  link: "/docs/deploy-operate/manage-delivery/stages",
                },
                {
                  text: "Set up and run promotion flows",
                  link: "/docs/deploy-operate/manage-delivery/promote-vectors",
                },
              ],
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
              text: "Local development",
              link: "/docs/extend-customize/local-development",
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
            { text: "CLI", link: "/docs/reference/cli" },
            { text: "API", link: "/docs/reference/api" },
            { text: "Helm values: konfidence", link: "/docs/reference/helm-values-konfidence" },
            { text: "Helm values: orchestrator", link: "/docs/reference/helm-values-orchestrator" },
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
