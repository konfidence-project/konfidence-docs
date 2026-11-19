export const deployers = [
  {
    slug: 'kubernetes',
    name: 'Kubernetes',
    entry: '/deployers/kubernetes/prepare-your-application',
    status: 'Documented workflow',
    description: 'Deploy Helm charts and Kustomize bundles with the Kubernetes landscape orchestrator and Flux.',
  },
  {
    slug: 's3',
    name: 'S3',
    entry: '/deployers/s3/artifacts',
    status: 'In development',
    description: 'Explore the design for deploying static files to S3-compatible storage.',
  },
  {
    slug: 'cloud-foundry',
    name: 'Cloud Foundry',
    entry: '/deployers/cloud-foundry/index',
    status: 'Proof of concept',
    description: 'Explore the prototype for deploying multi-target applications to Cloud Foundry.',
  },
]
