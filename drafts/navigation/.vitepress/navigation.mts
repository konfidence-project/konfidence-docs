import type { DefaultTheme } from 'vitepress'

const core: DefaultTheme.SidebarItem[] = [
  {
    text: "Getting started",
    collapsed: false,
    items: [
      { text: "Quickstart", link: "/start/quickstart" },
      { text: "Deliver an application", link: "/start/deliver-an-application" },
      { text: "Install the CLI", link: "/start/install-cli" },
    ],
  },
  {
    text: "Core concepts",
    collapsed: true,
    items: [
      { text: "Artifacts and vectors", link: "/core/artifacts-and-vectors" },
      { text: "Landscapes and stages", link: "/core/landscapes-and-stages" },
      { text: "Deployment model", link: "/core/deployment-model" },
      { text: "Delivery flow", link: "/core/delivery-flow" },
      { text: "Vector data", link: "/core/vector-data" },
    ],
  },
  {
    text: "Develop & Integrate",
    collapsed: true,
    items: [
      { text: "Prepare your application", link: "/core/prepare-your-application" },
      { text: "Publish artifacts", link: "/core/publish-artifacts" },
      { text: "Build vectors", link: "/core/build-vectors" },
      { text: "Add configuration to a vector", link: "/core/vector-configuration" },
      { text: "Configure signing and verification", link: "/core/signing" },
    ],
  },
  {
    text: "Deploy & Operate",
    collapsed: true,
    items: [
      { text: "System architecture", link: "/core/system-architecture" },
      { text: "Plan for high availability", link: "/core/high-availability" },
      { text: "Install Konfidence", link: "/core/install" },
      { text: "Give teams access to the dashboard and API", link: "/core/dashboard-and-api" },
      { text: "Choose a deployer", link: "/core/choose-deployer" },
      { text: "Connect artifact registries", link: "/core/connect-registries" },
      { text: "Create a landscape", link: "/core/landscapes" },
      { text: "Configure deployment targets for a landscape", link: "/core/deployment-targets" },
    ],
  },
  {
    text: "Observe & Deliver",
    collapsed: true,
    items: [
      { text: "Create a project", link: "/core/projects" },
      { text: "Grant teams access to a project", link: "/core/team-access" },
      { text: "Grant CI pipelines access", link: "/core/ci-access" },
      { text: "Create a stage", link: "/core/stages" },
      { text: "Set up and run promotion flows", link: "/core/promotion-flows" },
    ],
  },
  {
    text: "Reference",
    collapsed: true,
    items: [
      { text: "Glossary", link: "/reference/glossary" },
      { text: "kden CLI", link: "/reference/cli" },
      { text: "API", link: "/reference/api" },
      { text: "Custom resources", link: "/reference/crd" },
      { text: "Konfidence Helm values", link: "/reference/helm-values-konfidence" },
    ],
  },
]

const kubernetes: DefaultTheme.SidebarItem[] = [
  {
    text: "Getting started",
    collapsed: false,
    items: [{ text: "Kubernetes", link: "/deployers/kubernetes/" }],
  },
  {
    text: "Install and configure",
    collapsed: true,
    items: [
      { text: "Install the Kubernetes deployer", link: "/deployers/kubernetes/install" },
      { text: "Configure a Kubernetes deployment target", link: "/deployers/kubernetes/configure-target" },
      { text: "Configure registry access", link: "/deployers/kubernetes/registry-access" },
      { text: "Choose landscape services", link: "/deployers/kubernetes/landscape-services" },
      { text: "Install the Vector Data Service", link: "/deployers/kubernetes/vector-data-service" },
    ],
  },
  {
    text: "Gateway setup",
    collapsed: true,
    items: [
      { text: "Gateway routing", link: "/deployers/kubernetes/gateway-routing" },
      { text: "Set up Envoy Gateway", link: "/deployers/kubernetes/envoy-gateway" },
      { text: "Set up Istio", link: "/deployers/kubernetes/istio" },
      { text: "Set up Traefik", link: "/deployers/kubernetes/traefik" },
    ],
  },
  {
    text: "Develop & Integrate",
    collapsed: true,
    items: [
      { text: "Types of artifacts", link: "/deployers/kubernetes/artifact-types" },
      { text: "Author a Helm artifact", link: "/deployers/kubernetes/helm" },
      { text: "Author a Kustomize artifact", link: "/deployers/kubernetes/kustomize" },
    ],
  },
  {
    text: "Application runtime",
    collapsed: true,
    items: [
      { text: "Vector data on Kubernetes", link: "/deployers/kubernetes/vector-data" },
      { text: "Access vector data in your application", link: "/deployers/kubernetes/access-vector-data" },
      { text: "Read feature flags in your application", link: "/deployers/kubernetes/feature-flags" },
      { text: "Use deployment results", link: "/deployers/kubernetes/deployment-results" },
      { text: "Expose a Service through stage ingress", link: "/deployers/kubernetes/expose-service" },
    ],
  },
  {
    text: "Reference",
    collapsed: true,
    items: [
      { text: "KLO Helm values", link: "/deployers/kubernetes/helm-values" },
    ],
  },
]

const community: DefaultTheme.SidebarItem[] = [
  {
    text: "Contribute",
    collapsed: false,
    items: [
      { text: "Contributing", link: "/community/contributing" },
      { text: "Local development", link: "/community/local-development" },
    ],
  },
  {
    text: "Write documentation",
    collapsed: true,
    items: [
      { text: "Style guide", link: "/community/style-guide" },
      { text: "Guide templates", link: "/community/guide-templates" },
    ],
  },
  {
    text: "Architecture",
    collapsed: true,
    items: [
      { text: "Architecture decisions", link: "/community/decisions/index" },
    ],
  },
]

function prototypeSidebar(name: string, slug: string): DefaultTheme.SidebarItem[] {
  return [{
    text: "Getting started",
    collapsed: false,
    items: [{ text: name, link: `/deployers/${slug}/` }],
  }]
}

export const sidebar: DefaultTheme.Sidebar = {
  '/start/': core,
  '/core/': core,
  '/reference/': core,
  // Keep the sidebar slot visible for the selector before a deployer is chosen.
  '/deployers/': [{ items: [] }],
  '/deployers/kubernetes/': kubernetes,
  '/deployers/s3/': prototypeSidebar('S3', 's3'),
  '/deployers/cloud-foundry/': prototypeSidebar('Cloud Foundry', 'cloud-foundry'),
  '/community/': community,
}
