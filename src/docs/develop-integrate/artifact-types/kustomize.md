---
title: "Author a Kustomize artifact"
description: "Package a container image and a Kustomize bundle as one artifact that the Kubernetes deployer renders into a landscape."
outline: deep
editLink: true
lastUpdated: true
---

# Author a Kustomize artifact

After this guide, your service deploys onto Kubernetes as one Kustomize artifact of a vector. The [Kubernetes deployer](../../deploy-operate/deployer/kubernetes.md) renders the bundle once per vector into the landscape.

The examples build a service named `my-service` and push everything to `registry.example.com/my-org`.

## Prerequisites

Before you begin, make sure you have:

- A container build tool such as `docker` and the `flux` command-line tool for pushing Open Container Initiative (OCI) artifacts.
- Push access to an OCI registry for the image, the bundle, and the artifact.
- The `kden` command-line tool. See [Publish artifacts](./publish-artifacts.md).
- A landscape with a ready `kustomize.konfidence.cloud` target. See [Managing Deployment Targets](../../deploy-operate/deployment-targets.md).
- A service that reads and forwards `X-Vector-ID`. See [Prepare your application](../prepare-your-application.md).

## Build and push the container image

1. Create a `Dockerfile` in your service directory. The following example copies a prebuilt binary into a small base image. Replace the build with your own toolchain.

   ```dockerfile
   FROM alpine:3.20
   COPY my-service /usr/local/bin/my-service
   EXPOSE 8080
   ENTRYPOINT ["my-service"]
   ```

2. Build and push the image with the version you plan to release:

   ```bash
   docker build -t registry.example.com/my-org/my-service:1.0.0 .
   docker push registry.example.com/my-org/my-service:1.0.0
   ```

The registry lists `my-service:1.0.0` afterward.

## Create a minimal bundle

Create a directory `manifests/` with a `kustomization.yaml` at its root and the manifests it lists.

1. Create `manifests/kustomization.yaml`:

   ```yaml
   apiVersion: kustomize.config.k8s.io/v1beta1
   kind: Kustomization
   resources:
     - deployment.yaml
     - service.yaml
   ```

2. Create `manifests/deployment.yaml`:

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: my-service
   spec:
     replicas: 1
     selector:
       matchLabels:
         app: my-service
     template:
       metadata:
         labels:
           app: my-service
       spec:
         containers:
           - name: my-service
             image: registry.example.com/my-org/my-service:1.0.0
             ports:
               - containerPort: 8080
   ```

3. Create `manifests/service.yaml`:

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: my-service
   spec:
     selector:
       app: my-service
     ports:
       - port: 80
         targetPort: 8080
   ```

The bundle renders one Deployment and one Service.

<!-- TODO(fkasper): verify how Service selectors stay unique per instance. The deployer suffixes names, not labels, so two instances in one namespace share the selector `app: my-service`. -->

## Package and push the bundle

Push the `manifests/` directory as a Flux-compatible OCI artifact:

```bash
flux push artifact oci://registry.example.com/my-org/my-service-manifests:1.0.0 \
  --path=./manifests \
  --source=https://github.com/my-org/my-service \
  --revision=1.0.0
```

The bundle is available as `registry.example.com/my-org/my-service-manifests:1.0.0`.

## Reference the bundle from the artifact component

1. Create `manifest.json` with the Kustomize type:

   ```json
   {
     "type": "kustomize.konfidence.cloud",
     "allowReuse": false
   }
   ```

   Set `allowReuse` to `true` only when one running instance can serve several vectors.

2. Create `component-constructor.yaml` with the manifest and the bundle as resources:

   ```yaml
   components:
     - name: github.com/my-org/my-service
       version: 1.0.0
       provider:
         name: my-org
       resources:
         - name: my-service-manifest
           type: cloud.konfidence.artifact.manifest
           version: 1.0.0
           relation: local
           input:
             type: file/v1
             path: ./manifest.json
         - name: my-service-manifests
           type: kustomize
           version: 1.0.0
           relation: external
           access:
             type: ociArtifact
             imageReference: registry.example.com/my-org/my-service-manifests:1.0.0
   ```

   The component carries exactly one resource of type `kustomize`.

3. Validate and publish the artifact as described in [Publish artifacts](./publish-artifacts.md).

## Expect a suffix on every resource name

Several vectors deploy the same bundle into one landscape namespace. The deployer appends a suffix to every resource name so the instances coexist. The final name follows this pattern:

```text
<name-in-your-manifest>-<artifact-version>-<hash>
```

For the Service `my-service` in artifact version `v1.0.0` with hash `abc12345`, the applied Service is named `my-service-v1-0-0-abc12345`. Kustomize updates references between resources in the bundle, so a Deployment that mounts a ConfigMap by name keeps working.

The suffix changes the DNS name of your Service. Do not hard-code the names of other Services in your code. Read them at runtime as described in [Add deployment results to an artifact](../vector-data/deployment-results.md).

Do not set `nameSuffix` or `namespace` in your `kustomization.yaml`. The deployer overwrites both before it renders the bundle and discards your values.

The deployer owns the rendered instance: its name suffix, its namespace, and its labels. Everything in the bundle is duplicated per instance. Deliver resources that must exist once per cluster, such as a `CustomResourceDefinition`, through a separate delivery path.

::: details Fields the deployer sets on the Kustomization

The deployer creates one Flux `Kustomization` per artifact instance and sets these fields. Your bundle cannot override them.

| Field | Value |
| --- | --- |
| `metadata.name` | The `ArtifactDeployment` name |
| `spec.sourceRef` | The `OCIRepository` with the same name |
| `spec.targetNamespace` | The landscape namespace |
| `spec.nameSuffix` | `-<sanitized-artifact-version>-<hash>`, derived from the artifact version and hash |
| `spec.commonMetadata.labels` | `konfidence.cloud/artifact-deployment=<artifact-deployment-name>` |

:::

## Verify the result

Render the bundle locally and confirm that it contains no field the deployer owns:

```bash
kubectl kustomize ./manifests
grep -E 'nameSuffix|namespace' ./manifests/kustomization.yaml
```

The first command prints the Deployment and the Service. The second command prints nothing.

## Next steps

Use the following guides to publish your artifact and expose its Service:

- [Publish artifacts](./publish-artifacts.md) to validate, sign, and push the artifact.
- [Add deployment results to an artifact](../vector-data/deployment-results.md) to expose the Service to other services in the vector.
- Read [Kubernetes deployer](../../deploy-operate/deployer/kubernetes.md) for supported manifest types and deployment-result behavior.
