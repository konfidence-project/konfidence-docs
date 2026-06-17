---
title: Delivery Flow
description: Understand how Konfidence orchestrates the complete software delivery process from build to production.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Delivery Flow

Konfidence makes software delivery safe, consistent, and scalable. It manages complexity by breaking the deployment process into clear, distinct parts.

## Step-by-step workflow

Here is how a deployment flows through Konfidence:

1.  **Build:** Your CI pipeline builds code and publishes **artifacts**.
2.  **Assemble:** Konfidence groups these artifacts into a new **vector**.
3.  **Assign:** You assign the vector to a stage for deployment. 
4.  **Promote:** You propagate changes across your environments, moving the application towards production.

<!-- 
  Content type (Diátaxis): Explanation — addresses "how does it work?" Background, no instructions.
  TW will structure this page as: narrative prose describing each step, with a visual flow diagram.

  Dev input needed:
  - Is there already a "delivery dashboard"? -> not yet
  - Is the flow above complete, or are there parallel paths (e.g., simultaneous deployers)? -> complete; Deployers are not part of the vector delivery flow as far as I understand it. My understanding is that the vector delivery flow ends at the border of the galaxy, which is the GalaxySync resource created by the stage-configuration-controller (omitted in this documentation section to not go too much into technical details).

  Ticket: already exists https://github.com/konfidence-project/konfidence-project/issues/613
-->

This structured approach ensures that every deployment is auditable, reproducible, and safe, regardless of the complexity of your application.

### Build
Build your application and publish it. Konfidence doesn't impose any restrictions on how you build your application as long as it is accessible in an OCM-compliant repository and has an alias set that is not a semantic version. These are the prerequisites for the following steps of the delivery flow to be able to use your artifacts.

### Assemble
Once you have the necessary parts of your application available in the repository, you can assemble them into a vector. This is done by configuring the `VectorTemplate` custom resource, which looks like this:

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: example-vector
  namespace: default
spec:
  uploadTarget: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  components:
    - name: https://registry.kdenv.lab/sample-project//konfidence.project/sample-vector/service1:latest
    - name: https://registry.example.com/sample-project//example.tools/dev/service2:latest
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

Here the most relevant configuration is the `uploadTarget` and the `components`. `uploadTarget` defines where your assembled vector will be stored in the registry, while `components` defines which previously built artifacts will be part of the vector. Note that both the `uploadTarget` as well as all artifacts specify an alias which is necessary to be able to fetch the resource from the registry. Furthermore, the different entries under `components` do not have to be located in the same registry. As can be seen above *service2* is in a different registry than the `uploadTarget` and *service1* specify. Artifacts from different registries will be copied into the target registry specified in `uploadTarget`. Using the `config` array you can define credentials that are used to access the registry.\
There is another optional property `base` that can be used to specify an already existing vector which this new vector should build upon. This way all artifacts that are already part of the base vector will be part of the new vector in addition to the ones that are specified under `components` for the new one.

### Assign
When your vector is assembled you can use it by assigning it to a stage. You can achieve this by using the `StageConfiguration` custom resource.

```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: StageConfiguration
metadata:
  name: stage-configuration-example
  namespace: default
spec:
  name: example-stage
  vector: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  targetWorkspace: root:sample-organization
  targetNamespace: dev-eu10
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

In this example `StageConfiguration` you can see that the `vector` property references the component that was configured as the `uploadTarget` of the `VectorTemplate`. Thus, we are assigning this vector to the stage *example-stage*. This stage is to be created in the Kubernetes namespace `dev-eu10` inside the KCP workspace `root:sample-organization`.\
Again, `config` is used to ensure the vector can be fetched from the registry.
<!-- Since there is an ongoing discussion about uniting the Galaxy and Star into a single cluster, KCP might be discarded alltogether. Thus, the targetWorkspace property could be obsolete soon.-->

### Promote
You might want to make your vector available in different registries or at different paths inside the same registry. This is what promotions are for. To execute a promotion two custom resources are necessary. On the one hand, there is the `VectorPromotionConfig`, which configures the promotion. On the other hand, the `VectorPromotion` triggers a one-time execution of the promotion.

__VectorPromotionConfig__
```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotionConfig
metadata:
  name: example-vector-promotion-config
  namespace: default
spec:
  source: https://registry.kdenv.lab/sample-project//konfidence.project/constructed-vector:latest
  target: https://registry.example.com/sample-project//example.tools/constructed-vector:promoted
  config:
    - kind: Secret
      apiVersion: v1
      name: registry-credentials
```

The `VectorPromotionConfig` defines the `source` of the vector as well as its `target` and the necessary `config` to access the referenced registries.

__VectorPromotion__
```yaml
apiVersion: galaxy.konfidence.cloud/v1alpha1
kind: VectorPromotion
metadata:
  name: example-vector-promotion
  namespace: default
spec:
  vectorPromotionConfigRef: example-vector-promotion-config
  ttlAfterFinished: 1h
```

The `VectorPromotion` references the `VectorPromotionConfig` to use and triggers an execution of the promotion. It is strictly executed only once, no matter if the promotion succeeds or not. By executing promotions only when manually triggered, accidentally overwriting aliases of vectors is prevented. The `ttlAfterFinished` defines how long the `VectorPromotion` resource will remain after the promotion was executed, regardless of success. After the TTL has expired, the `VectorPromotion` is cleaned up.\
The status of the `VectorPromotion` is reflected on the `VectorPromotionConfig` it references. The `VectorPromotionConfig` exposes both the status of the overall last `VectorPromotion` using this `VectorPromotionConfig` as well as the last successful `VectorPromotion` using it. If the last promotion was successful both show the same status.
