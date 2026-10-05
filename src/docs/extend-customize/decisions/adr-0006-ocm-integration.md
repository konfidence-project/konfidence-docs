---
id: ADR-0006
title: "OCM integration"
description: "Integration of Open Component Model (OCM) for artifact and component management"
status: draft
authors: [dtomasi, clang-sap]
category: Technology Stack
impact: High
dependencies: []
pageClass: adr
outline: deep
---
# ADR-0006: OCM integration

<AdrHeader />

## Context

In *Konfidence*, a vector is an immutable set of software components (artifacts) that are deployed together in a landscape partition. A vector and its associated artifacts are stored in an OCI registry and processed in a local control plane.  

This document defines the format used to describe the vectors and artifacts stored in an OCI registry.  

## Considered solutions

The [Open Component Model (OCM)](https://ocm.software) open standard for describing software artifacts and their lifecycle metadata in a consistent, technology-agnostic way.  

## Decision

*Konfidence* uses the Open Component Model to describe vectors and artifacts stored in an OCI registry.

## Consequences

Adopting OCM provides the following benefits:

- Validation via the predefined OCM JSON schema

- Vectors modeled as OCM components with [component references](https://github.com/open-component-model/ocm-spec/blob/main/doc/01-model/02-elements-toplevel.md#references).

- Built-in signing and verification of components

- Access to the OCM [Go library](https://github.com/open-component-model/ocm#ocm-library) or programmatic interaction

- Use of the OCM command line interface ([CLI](https://github.com/open-component-model/ocm?tab=readme-ov-file#ocm-cli)) for component creation and CI/CD integration

>**Note**: The provided OCM controller is not used because it does not match the *Konfidence* deployment strategy. Instead, a custom controller is used within the local control plane.

## Example OCM integration

This example shows how to model a vector with two referenced artifacts as OCM component versions and store them in an OCI registry.

### Prerequisites


1. A local OCI registry is available on port `5100`(e.g., [Docker registry](https://hub.docker.com/_/registry)).  
 >**Note**: OCM requires HTTPS for registry access.

2. Install the [OCM CLI](https://ocm.software/docs/getting-started/installation/) 


### Component descriptor files

This example uses the following component descriptor files to create the vector and service artifact component versions:   

#### Service 1
```yaml
# specify a schema to validate the configuration and get auto-completion in your editor
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: example.konfidence.cloud/example-project/service1
  version: 0.0.1            
  provider:                 
    name: konfidence.cloud
  sources: []
  resources:
  - name: service1-image
    version: 0.0.1
    relation: external
    type: ociImage
    access:
      type: ociArtifact
      imageReference: localhost:5100/artifacts/service1:0.0.1 
```

#### Service 2
```yaml
# specify a schema to validate the configuration and get auto-completion in your editor
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: example.konfidence.cloud/example-project/service2
  version: 0.2.0            
  provider:                 
    name: konfidence.cloud
  sources: []
  resources:
  - name: service2-image
    version: 0.2.0
    relation: external
    type: ociImage
    access:
      type: ociArtifact
      imageReference: localhost:5100/artifacts/service2:0.2.0   
```

#### Vector
```yaml
# specify a schema to validate the configuration and get auto-completion in your editor
# yaml-language-server: $schema=https://ocm.software/schemas/configuration-schema.yaml
components:
- name: example.konfidence.cloud/example-project/vector/dev-eu  
  version: 0.1.0            
  provider:                 
    name: konfidence.cloud
  labels:
    - name: konfidence.cloud/vector-id
      value: 01904be8-bae3-ae70-e4d6-78af41d7e0a2
      version: v1  
  componentReferences:      
  - componentName: example.konfidence.cloud/example-project/service1
    name: service1
    version: 0.0.1
  - name: service2
    version: 0.2.0
    componentName:  example.konfidence.cloud/example-project/service2
  sources: []
  resources: [] 
```

### Create component versions

##### 1. Prepare images

First, we pull and tag some images that will be referenced by the service artifacts.  

`docker pull ubuntu`  
`docker pull alpine`   

`docker tag ubuntu localhost:5100/artifacts/service1:0.0.1`  
`docker tag alpine localhost:5100/artifacts/service2:0.2.0`  

##### 2. Push images to local registry

Then we push the images to the artifacts repository in the local registry.  

`docker push localhost:5100/artifacts/service1:0.0.1`  
`docker push localhost:5100/artifacts/service2:0.2.0`  

##### 3. Create common transfer archives (CTF) for component versions
Now we create CTFs from the services and vector component descriptor files.
The archives can later be transfered to the registry.

`ocm add componentversions --create --file ctf1 service1.yaml`  
`ocm add componentversions --create --file ctf2 service2.yaml`  
`ocm add componentversions --create --file ctf3 vector.yaml`  

##### 4. Transfer CTFs to the registry
Then we transfer the archives to the local registry. The service component version will be stored  
in the repository `ocm/artifacts` and the vector component version in `ocm/vector`.  

`ocm transfer ctf ./ctf1 https://localhost:5100/ocm/artifacts`  
`ocm transfer ctf ./ctf2 https://localhost:5100/ocm/artifacts`  
`ocm transfer ctf ./ctf3 https://localhost:5100/ocm/vector`  


##### 5. Verify the registry catalog

`curl https://localhost:5100/v2/_catalog`  

Example output:
```json
{
    "repositories":[
        "artifacts/service1",
        "artifacts/service2",
        "ocm/artifacts/component-descriptors/example.konfidence.cloud/example-project/service1",
        "ocm/artifacts/component-descriptors/example.konfidence.cloud/example-project/service2",
        "ocm/vector/component-descriptors/example.konfidence.cloud/example-project/vector/dev-eu"
    ]
}
```


##### 6. Inspect image manifest of service2

`curl -H "Accept:application/vnd.oci.image.manifest.v1+json" https://localhost:5100/v2/artifacts/service2/manifests/0.2.0`


##### 7. Get service1 component version as YAML

`ocm get cv https://localhost:5100/ocm/artifacts//example.konfidence.cloud/example-project/service1:0.0.1 -o yaml`

Example output:
```yaml
component:
  componentReferences: []
  creationTime: "2025-06-25T11:33:30Z"
  name: example.konfidence.cloud/example-project/service1
  provider: konfidence.cloud
  repositoryContexts:
  - baseUrl: https://localhost:5100
    componentNameMapping: urlPath
    subPath: ocm/artifacts
    type: OCIRegistry
  resources:
  - access:
      imageReference: localhost:5100/artifacts/service1:0.0.1
      type: ociArtifact
    digest:
      hashAlgorithm: SHA-256
      normalisationAlgorithm: ociArtifactDigest/v1
      value: 5e2364e541559f0bc69075aafd660f3957b640668a3954dacb027a0609e252a7
    name: service1-image
    relation: external
    type: ociImage
    version: 0.0.1
  sources: []
  version: 0.0.1
meta:
  schemaVersion: v2
```  

##### 8. Get vector component version as YAML

`ocm get cv https://localhost:5100/ocm/vector//example.konfidence.cloud/example-project/vector/dev-eu:0.1.0 -o yaml`

Example output: 
```yaml
component:
  componentReferences:
  - componentName: example.konfidence.cloud/example-project/service1
    name: service1
    version: 0.0.1
  - componentName: example.konfidence.cloud/example-project/service2
    name: service2
    version: 0.2.0
  creationTime: "2025-06-25T11:33:48Z"
  labels:
  - name: konfidence.cloud/vector-id
    value: 01904be8-bae3-ae70-e4d6-78af41d7e0a2
    version: v1
  name: example.konfidence.cloud/example-project/vector/dev-eu
  provider: konfidence.cloud
  repositoryContexts:
  - baseUrl: https://localhost:5100
    componentNameMapping: urlPath
    subPath: ocm/vector
    type: OCIRegistry
  resources: []
  sources: []
  version: 0.1.0
meta:
  schemaVersion: v2
```  

##### 9. List references of the vector

`ocm get references https://localhost:5100/ocm/vector//example.konfidence.cloud/example-project/vector/dev-eu:0.1.0`   

Expected output:

```
NAME     COMPONENT                          VERSION  
service1 example.konfidence.cloud/example-project/service1 0.0.1  
service2 example.konfidence.cloud/example-project/service2 0.2.0  
```