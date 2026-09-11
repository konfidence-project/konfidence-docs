---
title: "Author a Helm artifact"
description: "Package a container image and a Helm chart as one artifact that the Kubernetes deployer installs into a landscape."
outline: deep
editLink: true
lastUpdated: true
---

# Author a Helm artifact

After this guide, your service deploys onto Kubernetes as one Helm artifact of a vector. The [Kubernetes deployer](../../deploy-operate/deployer/kubernetes.md) installs the chart as one release per vector in the landscape.

The examples build a service named `my-service` and push everything to `registry.example.com/my-org`.

## Prerequisites

Before you begin, make sure you have:

- A container build tool such as `docker` and Helm 3.8 or later with Open Container Initiative (OCI) support.
- Push access to an OCI registry for the image, the chart, and the artifact.
- The `kden` command-line tool. See [Publish artifacts](./publish-artifacts.md).
- A landscape served by the Kubernetes deployer. See [Find out which deployer serves your landscape](../../deploy-operate/deployer/overview.md#find-out-which-deployer-serves-your-landscape).
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

## Create a minimal chart

Create the chart by hand. `helm create` generates a larger chart that follows the same rules.

1. Create `Chart.yaml`:

   ```yaml
   apiVersion: v2
   name: my-service
   version: 1.0.0
   appVersion: "1.0.0"
   ```

2. Create `values.yaml` with the image reference:

   ```yaml
   image:
     repository: registry.example.com/my-org/my-service
     tag: "1.0.0"
   ```

3. Create `templates/deployment.yaml`:

   <div v-pre>

   ```yaml
   apiVersion: apps/v1
   kind: Deployment
   metadata:
     name: {{ .Release.Name }}
   spec:
     replicas: 1
     selector:
       matchLabels:
         app.kubernetes.io/instance: {{ .Release.Name }}
     template:
       metadata:
         labels:
           app.kubernetes.io/instance: {{ .Release.Name }}
       spec:
         containers:
           - name: my-service
             image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
             ports:
               - containerPort: 8080
   ```

   </div>

4. Create `templates/service.yaml`:

   <div v-pre>

   ```yaml
   apiVersion: v1
   kind: Service
   metadata:
     name: {{ .Release.Name }}
   spec:
     selector:
       app.kubernetes.io/instance: {{ .Release.Name }}
     ports:
       - port: 80
         targetPort: 8080
   ```

   </div>

The chart renders one Deployment and one Service, both named after the release.

## Package and push the chart

1. Package the chart directory:

   ```bash
   helm package ./my-service
   ```

2. Push the package to the registry:

   ```bash
   helm push my-service-1.0.0.tgz oci://registry.example.com/my-org
   ```

The chart is available as `registry.example.com/my-org/my-service:1.0.0`.

## Reference the chart from the artifact component

1. Create `manifest.json` with the Helm type:

   ```json
   {
     "type": "cloud.konfidence.flux.helm",
     "allowReuse": false
   }
   ```

   Set `allowReuse` to `true` only when one running instance can serve several vectors.

2. Create `component-constructor.yaml` with the manifest and the chart as resources:

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
         - name: my-service-chart
           type: helmChart
           version: 1.0.0
           relation: external
           access:
             type: ociArtifact
             imageReference: registry.example.com/my-org/my-service:1.0.0
   ```

   The component carries exactly one resource of type `helmChart`.

3. Validate and publish the artifact as described in [Publish artifacts](./publish-artifacts.md).

## Derive every resource name from the release name

Several vectors deploy the same chart into one landscape namespace. The deployer gives each deployment its own release name. Every resource in the chart must derive `metadata.name` from that release name, either directly or through the chart's fullname helper. A hard-coded name collides when a second vector deploys the chart.

<div v-pre>

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ .Release.Name }}-config
```

</div>

The fullname helper that `helm create` generates works as well:

<div v-pre>

```yaml
metadata:
  name: {{ include "my-service.fullname" . }}
```

</div>

Do not hard-code names:

```yaml
metadata:
  name: my-service-config
```

Do not set `metadata.namespace` in templates. The deployer installs every release into the landscape namespace.

The deployer owns the release itself: its name, its namespace, and its labels. Everything in the chart is duplicated per instance. Deliver resources that must exist once per cluster, such as a `CustomResourceDefinition`, through a separate delivery path.

::: details Fields the deployer sets on the HelmRelease

The deployer creates one Flux `HelmRelease` per artifact instance and sets these fields. Your chart cannot override them.

| Field | Value |
| --- | --- |
| `metadata.name` | The `ArtifactDeployment` name |
| `spec.releaseName` | The `ArtifactDeployment` name |
| `spec.chart.spec.sourceRef` | The `HelmRepository` with the same name |
| `spec.targetNamespace` | The landscape namespace |
| `spec.storageNamespace` | The landscape namespace |
| `spec.commonMetadata.labels` | `konfidence.cloud/artifact-deployment=<artifact-deployment-name>` |

The release name is deterministic per component, version, `allowReuse` setting, and `VectorDeployment`.

:::

## Verify the result

Render the chart twice with different release names and compare the resource names. This is the check the deployer relies on.

```bash
helm template vector-a ./my-service | grep '^  name:'
helm template vector-b ./my-service | grep '^  name:'
```

Every name in the first output starts with `vector-a`, and every name in the second output starts with `vector-b`. A name that appears unchanged in both outputs is hard-coded and must derive from the release name.

## Next steps

Use the following guides to publish your artifact and expose its Service:

- [Publish artifacts](./publish-artifacts.md) to validate, sign, and push the artifact.
- [Add deployment results to an artifact](../vector-data/deployment-results.md) to expose the Service to other services in the vector.
- Read [Kubernetes deployer](../../deploy-operate/deployer/kubernetes.md) for supported manifest types and deployment-result behavior.
