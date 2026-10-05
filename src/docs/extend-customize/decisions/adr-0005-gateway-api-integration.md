---
id: ADR-0005
title: "Gateway API integration"
description: "Integration strategy for Kubernetes Gateway API as routing and ingress solution"
status: accepted
date_approved: 2025-08-27
authors: [AnsgarH1, clang-sap]
category: Technology Stack
impact: Medium
dependencies: []
pageClass: adr
outline: deep
---
# ADR-0005: Gateway API integration

<AdrHeader />

## Context

Konfidence needs a routing component that routes incoming traffic to specific services based on HTTP headers.

## Considered solutions

The first solution we tried was using Istio with the standard sidecar mode. The routing configuration worked in principle but this solution has several disadvantages. First each pod needs a sidecar container with an envoy proxy.
This has implications for the utilization of resources (cpu and memory) and increases the latency compared to ambient mode. Second, the routing configuration uses Istio specific components (e.g. virtual service in combination with destination rules) that are not re-usable across different mesh implementations.  
As an alternative we looked into the [Gateway API](https://gateway-api.sigs.k8s.io). The Gateway API is an official kubernetes project focused on L4 and L7 routing in Kubernetes 
that provides advanced routing capabilities for both Ingress and Mesh. The API is supported in several existing [gateway controller or service mesh solutions](https://gateway-api.sigs.k8s.io/implementations/) like [Istio](https://istio.io/), [cillium](https://cilium.io) or [Contour](https://projectcontour.io/).  
  
For our proof of concept we used Istio in ambient mode which implements the service mesh Gateway API.

## Decision

The Gateway API Specification will be used to implement the routing functionality.

## Consequences

The Gateway API offers several benefits:

- Choice between open-source and commercial API implementations
- Same configuration classes can be used across different implementations
- Same configuration can be used for north/south and east/west traffic routing
- Allows routing by matching HTTP path or HTTP headers


## Example Gateway API integration with Istio service mesh

This is a simple example using the Istio service mesh illustrating how to route traffic (north/south and east/west) to specific services using the Gateway API classes.
The routing is controlled using a specific HTTP header.

### Prerequisites


- Istio is installed with ambient mode inside the cluster (see [Istio Getting Started](https://istio.io/latest/docs/ambient/getting-started/))
- Make sure the Gateway API CRDs are installed inside the cluster (see [Gateway API CRDs](https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.3.0/))


### Example Gateway API Configuration

For this proof of concept we installed two nginx deployments that will be used as the backend services and a netshoot pod to generate internal traffic.

#### Namespace

```yaml
# Namespace for the demo application
apiVersion: v1
kind: Namespace
metadata:
  name: demoapp
  labels:
    istio.io/dataplane-mode: ambient # all pods in this namespace will be part of the service mesh
    istio.io/use-waypoint: demo-app-svc-gateway # all pods will use the demo-app-svc-gateway waypoint as L7 proxy
```

#### Sample Application

```yaml
# First Nginx deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginxdemo-hello-v1
  namespace: demoapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginxdemo-hello
      version: v1
  template:
    metadata:
      labels:
        app: nginxdemo-hello
        version: v1
    spec:
      containers:
        - name: nginxdemo-hello
          image: nginxdemos/hello:plain-text
          ports:
            - containerPort: 80
```

```yaml
# Service for the first Nginx deployment    
apiVersion: v1
kind: Service
metadata:
  name: nginxdemo-hello-v1
  namespace: demoapp
spec:
  selector:
    app: nginxdemo-hello
    version: v1
  ports:
    - name: http
      port: 80
```



```yaml
#  Nginx deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginxdemo-hello-v2
  namespace: demoapp
spec:
  replicas: 1
  selector:
    matchLabels:
      app: nginxdemo-hello
      version: v2
  template:
    metadata:
      labels:
        app: nginxdemo-hello
        version: v2
    spec:
      containers:
        - name: nginxdemo-hello
          image: nginxdemos/hello:plain-text
          ports:
            - containerPort: 80
```

```yaml
# Service for the second Nginx deployment
apiVersion: v1
kind: Service
metadata:
  name: nginxdemo-hello-v2
  namespace: demoapp
spec:
  selector:
    app: nginxdemo-hello
    version: v2
  ports:
    - name: http
      port: 80
```


```yaml
# Service which will be used to route traffic through the gateway
apiVersion: v1
kind: Service
metadata:
  name: nginxdemo-hello
  namespace: demoapp
spec:
  ports:
    - name: http
      port: 80
```

#### Gateway

```yaml
# Waypoint Gateway for internal traffic
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: demo-app-svc-gateway
  namespace: demoapp
  labels:
    istio.io/waypoint-for: all
spec:
  gatewayClassName: istio-waypoint
  listeners:
    - name: default
      port: 80
      protocol: HTTP
    - name: mesh
      port: 15008
      protocol: HBONE
```

```yaml
# Gateway for external ingress traffic  
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ingress-gateway
  namespace: istio-system
  annotations:
    networking.istio.io/service-type: NodePort
spec:
  gatewayClassName: istio
  listeners:
    - name: http
      port: 80
      protocol: HTTP
      allowedRoutes:
        namespaces:
          from: All
```
> Gateways will automatically create a service for the Gateway. For Istio this will be a LoadBalancer service,
> which will be configured by the cloud provider. In our case we override this with a NodePort, 
> [which has its own implications](https://ryandeangraham.medium.com/istio-gateway-api-nodeport-c598a21c4c95).
>
> see [Istio > Ingress > Gateway API](https://istio.io/latest/docs/tasks/traffic-management/ingress/gateway-api/)

#### HTTP Route

This routing configuration will route traffic based on the HTTP header `X-Vector-ID`. 
When defined, it will route to the specific backend service based on the value of the header, otherwise
it will take the second backend service as a default.

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: demo-app-vector-based-http
  namespace: demoapp
spec:
  parentRefs:
    - name: nginxdemo-hello
      kind: Service
      group: ""
    - name: ingress-gateway
  rules:
    - matches:
        - headers:
            - name: "X-Vector-ID"
              value: "1"
      backendRefs:
        - name: nginxdemo-hello-v1
          port: 80
    - matches:
        - headers:
            - name: "X-Vector-ID"
              value: "2"
      backendRefs:
        - name: nginxdemo-hello-v2
          port: 80
    - backendRefs:
        - name: nginxdemo-hello-v2
          port: 80
```



