import type { DefaultTheme } from 'vitepress'

const core: DefaultTheme.SidebarItem[] = [
  {
    text: "Getting started",
    collapsed: false,
    items: [
      { text: "Quickstart", link: "/start/quickstart" },
      { text: "Deliver an application", link: "/start/deliver-an-application" },
    ],
  },
  {
    text: "Concepts",
    collapsed: true,
    items: [
      { text: "Artifacts and vectors", link: "/core/artifacts-and-vectors" },
      { text: "Landscapes and stages", link: "/core/landscapes-and-stages" },
      { text: "Delivery flow", link: "/core/delivery-flow" },
      { text: "Deployment model", link: "/core/deployment-model" },
      { text: "Vector data", link: "/core/vector-data" },
      { text: "Deployment results", link: "/core/deployment-results" },
    ],
  },
  {
    text: "Build",
    collapsed: true,
    items: [
      { text: "Types of artifacts", link: "/core/artifact-types" },
      { text: "Publish artifacts", link: "/core/publish-artifacts" },
    ],
  },
  {
    text: "Assemble",
    collapsed: true,
    items: [
      { text: "Create a project", link: "/core/projects" },
      { text: "Team access", link: "/core/team-access" },
      { text: "Assemble a vector", link: "/core/build-vectors" },
      { text: "Add configuration to a vector", link: "/core/vector-configuration" },
      { text: "Configure signing and verification", link: "/core/signing" },
    ],
  },
  {
    text: "Deploy",
    collapsed: true,
    items: [
      { text: "Create a stage", link: "/core/stages" },
      { text: "Create a landscape", link: "/core/landscapes" },
      { text: "Deployment targets", link: "/core/deployment-targets" },
      { text: "System architecture", link: "/core/system-architecture" },
      { text: "Plan for high availability", link: "/core/high-availability" },
      { text: "Install Konfidence", link: "/core/install" },
      { text: "Dashboard and API access", link: "/core/dashboard-and-api" },
      { text: "Connect artifact registries", link: "/core/connect-registries" },
    ],
  },
  {
    text: "Promote",
    collapsed: true,
    items: [
      { text: "Set up promotion flows", link: "/core/promotion-flows" },
      { text: "Approve a promotion", link: "/core/approve-a-promotion" },
      { text: "CI access", link: "/core/ci-access" },
    ],
  },
  {
    text: "Reference",
    collapsed: true,
    items: [
      { text: "Glossary", link: "/reference/glossary" },
      { text: "Install the CLI", link: "/start/install-cli" },
      { text: "kden CLI", link: "/reference/cli" },
      { text: "API", link: "/reference/api" },
      { text: "Custom resources", link: "/reference/crd" },
      { text: "Konfidence Helm values", link: "/reference/helm-values-konfidence" },
    ],
  },
]

const kubernetes: DefaultTheme.SidebarItem[] = [
  {
    text: "Artifacts",
    collapsed: false,
    items: [
      { text: "Prepare your application", link: "/deployers/kubernetes/prepare-your-application" },
      { text: "Author a Helm artifact", link: "/deployers/kubernetes/helm" },
      { text: "Author a Kustomize artifact", link: "/deployers/kubernetes/kustomize" },
      { text: "Artifact types", link: "/deployers/kubernetes/artifact-types" },
      { text: "Share an artifact instance", link: "/deployers/kubernetes/artifact-reuse" },
    ],
  },
  {
    text: "Application runtime",
    collapsed: true,
    items: [
      { text: "Vector data on Kubernetes", link: "/deployers/kubernetes/vector-data" },
      { text: "Read vector data", link: "/deployers/kubernetes/access-vector-data" },
      { text: "Read feature flags", link: "/deployers/kubernetes/feature-flags" },
      { text: "Use Kubernetes Service results", link: "/deployers/kubernetes/deployment-results" },
      { text: "Expose a Service", link: "/deployers/kubernetes/expose-service" },
    ],
  },
  {
    text: "Install and configure",
    collapsed: true,
    items: [
      { text: "Kubernetes architecture", link: "/deployers/kubernetes/architecture" },
      { text: "Install the Kubernetes deployer", link: "/deployers/kubernetes/install" },
      { text: "Configure a Kubernetes target", link: "/deployers/kubernetes/configure-target" },
      { text: "Configure registry access", link: "/deployers/kubernetes/registry-access" },
      { text: "Choose landscape services", link: "/deployers/kubernetes/landscape-services" },
      { text: "Install the Vector Data Service", link: "/deployers/kubernetes/vector-data-service" },
      { text: "Gateway routing", link: "/deployers/kubernetes/gateway-routing" },
      { text: "Set up Envoy Gateway", link: "/deployers/kubernetes/envoy-gateway" },
      { text: "Set up Istio", link: "/deployers/kubernetes/istio" },
      { text: "Set up Traefik", link: "/deployers/kubernetes/traefik" },
    ],
  },
  {
    text: "Reference",
    collapsed: true,
    items: [
      { text: "Target parameters", link: "/deployers/kubernetes/target-parameters" },
      { text: "Service results", link: "/deployers/kubernetes/service-results" },
      { text: "KLO Helm values", link: "/deployers/kubernetes/helm-values" },
    ],
  },
]

const s3: DefaultTheme.SidebarItem[] = [
  { text: "Artifact format", link: "/deployers/s3/artifacts" },
  { text: "Target configuration", link: "/deployers/s3/targets" },
  { text: "Deployment and activation", link: "/deployers/s3/runtime" },
]

const cloudFoundry: DefaultTheme.SidebarItem[] = [
  { text: "Prototype capabilities", link: "/deployers/cloud-foundry/index" },
]

const community: DefaultTheme.SidebarItem[] = [
  {
    text: "Contribute",
    collapsed: false,
    items: [
      { text: "Contribution guidelines", link: "/community/contributing" },
      { text: "Local development", link: "/community/local-development" },
      { text: "Deployer contract", link: "/community/deployer-contract" },
    ],
  },
  {
    text: "Write documentation",
    collapsed: true,
    items: [
      { text: "Documentation workflow", link: "/community/documentation" },
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

export const sidebar: DefaultTheme.Sidebar = {
  '/start/': core,
  '/core/': core,
  '/reference/': core,
  // Keep the sidebar slot visible for the selector before a deployer is chosen.
  '/deployers/': [{ items: [] }],
  '/deployers/kubernetes/': kubernetes,
  '/deployers/s3/': s3,
  '/deployers/cloud-foundry/': cloudFoundry,
  '/community/': community,
}
