---
title: Route traffic to stages with Envoy Gateway
description: Install Envoy Gateway, an edge Gateway, and one konfidence-router Gateway per landscape.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Route traffic to stages with Envoy Gateway

Use [Envoy Gateway](https://gateway.envoyproxy.io/) to route external requests to a [stage](../../../../reference/glossary.md#stage) by hostname. You install Envoy Gateway, one edge Gateway, and one `konfidence-router` Gateway per landscape. [Route external traffic to stages](./ingress.md) explains what each part does.

## Prerequisites

Before you begin, make sure you have:

- [Konfidence](../../konfidence-installation.md) and the [Kubernetes deployer](../kubernetes.md) installed.
- At least one [landscape](../../../../reference/glossary.md#landscape) with a stage. `kubectl get stages -A` lists them.
- Helm 3.8 or later and `kubectl` with cluster-admin permissions.
- No other Gateway API implementation that manages the Gateway API CRDs. `kubectl get crd gateways.gateway.networking.k8s.io` shows whether they exist.

The commands use these values. Replace them with your own:

```bash
export ENVOY_GATEWAY_VERSION=v1.9.2
export LANDSCAPE_NAMESPACE=kden-l-dev
export STAGE=dev-eu12
export STAGE_HOSTNAME=dev-eu12.example.kden.local
```

## Install Envoy Gateway

1. Install the Gateway API and Envoy Gateway CRDs. The CRDs exceed the 1 MiB limit of a Helm release, so render them and apply them server-side:

   ```bash
   helm template eg oci://docker.io/envoyproxy/gateway-crds-helm \
     --version "$ENVOY_GATEWAY_VERSION" \
     --set crds.gatewayAPI.enabled=true \
     --set crds.gatewayAPI.channel=standard \
     --set crds.envoyGateway.enabled=true \
     | kubectl apply --server-side -f -
   ```

2. Install the controller in `GatewayNamespace` mode. In this mode, each Gateway's proxy runs in the Gateway's own namespace. The `konfidence-router` Service then lands in the landscape namespace, where your edge routes can reference it.

   ```bash
   helm upgrade --install eg oci://docker.io/envoyproxy/gateway-helm \
     --version "$ENVOY_GATEWAY_VERSION" \
     --namespace envoy-gateway-system \
     --create-namespace \
     --set crds.enabled=false \
     --set config.envoyGateway.provider.kubernetes.deploy.type=GatewayNamespace \
     --wait
   ```

The `helm upgrade` command reports `STATUS: deployed`.

## Create the edge Gateway

The edge Gateway receives external traffic. Envoy Gateway gives it a `LoadBalancer` Service by default.

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass
metadata:
  name: envoy-gateway
spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
---
apiVersion: v1
kind: Namespace
metadata:
  name: edge-gateway
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: edge
  namespace: edge-gateway
spec:
  gatewayClassName: envoy-gateway
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: Same
EOF

kubectl wait gateway/edge -n edge-gateway --for=condition=Programmed --timeout=180s
```

The `kubectl wait` command prints `condition met`.

## Create the konfidence-router Gateway for each landscape

Repeat this step for every landscape namespace. The `EnvoyProxy` resource pins the Service to `ClusterIP` and gives it the stable name `konfidence-router`. The ReferenceGrant lets edge routes in `edge-gateway` use that Service.

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.envoyproxy.io/v1alpha1
kind: EnvoyProxy
metadata:
  name: konfidence-router
  namespace: $LANDSCAPE_NAMESPACE
spec:
  provider:
    type: Kubernetes
    kubernetes:
      envoyService:
        name: konfidence-router
        type: ClusterIP
---
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: konfidence-router
  namespace: $LANDSCAPE_NAMESPACE
spec:
  gatewayClassName: envoy-gateway
  infrastructure:
    parametersRef:
      group: gateway.envoyproxy.io
      kind: EnvoyProxy
      name: konfidence-router
  listeners:
    - name: http
      protocol: HTTP
      port: 80
      allowedRoutes:
        namespaces:
          from: Same
---
apiVersion: gateway.networking.k8s.io/v1
kind: ReferenceGrant
metadata:
  name: edge-gateway
  namespace: $LANDSCAPE_NAMESPACE
spec:
  from:
    - group: gateway.networking.k8s.io
      kind: HTTPRoute
      namespace: edge-gateway
  to:
    - group: ""
      kind: Service
      name: konfidence-router
EOF

kubectl wait gateway/konfidence-router -n "$LANDSCAPE_NAMESPACE" --for=condition=Programmed --timeout=180s
```

`kubectl get service konfidence-router -n "$LANDSCAPE_NAMESPACE"` shows the type `ClusterIP`.

## Route a hostname to each stage

Repeat this step for every stage. The route matches the stage's hostname and sets `x-konfidence-stage`. It then forwards the request to the landscape's `konfidence-router`.

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: $STAGE
  namespace: edge-gateway
spec:
  parentRefs:
    - name: edge
  hostnames:
    - $STAGE_HOSTNAME
  rules:
    - filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            set:
              - name: x-konfidence-stage
                value: $STAGE
      backendRefs:
        - name: konfidence-router
          namespace: $LANDSCAPE_NAMESPACE
          port: 80
EOF
```

## Verify the result

1. Check that the route is accepted and its backend resolves:

   ```bash
   kubectl get httproute "$STAGE" -n edge-gateway \
     -o jsonpath='{range .status.parents[0].conditions[*]}{.type}={.status}{"\n"}{end}'
   ```

   The output shows `Accepted=True` and `ResolvedRefs=True`.

2. Send a request through the edge. `<EDGE_ADDRESS>` is the address that `kubectl get gateway edge -n edge-gateway` shows:

   ```bash
   curl -i -H "Host: $STAGE_HOSTNAME" http://<EDGE_ADDRESS>/
   ```

   Until Konfidence has created the stage's route, `konfidence-router` answers `404`. A `404` here shows that the edge forwarded the request.

## Use in a local kind cluster

The [Quickstart](../../../../getting-started/quickstart.md) cluster has no load balancer. Its script maps `localhost:9090` to NodePort `30080` on the kind node. Give the edge Gateway a NodePort Service on that port.

1. Before you create the edge Gateway, create this `EnvoyProxy`:

   ```bash
   kubectl apply -f - <<EOF
   apiVersion: gateway.envoyproxy.io/v1alpha1
   kind: EnvoyProxy
   metadata:
     name: edge
     namespace: edge-gateway
   spec:
     provider:
       type: Kubernetes
       kubernetes:
         envoyService:
           name: edge
           type: NodePort
           patch:
             type: StrategicMerge
             value:
               spec:
                 ports:
                   - port: 80
                     nodePort: 30080
   EOF
   ```

2. Add this block to the `spec` of the edge Gateway:

   ```yaml
   infrastructure:
     parametersRef:
       group: gateway.envoyproxy.io
       kind: EnvoyProxy
       name: edge
   ```

3. Send requests to `localhost:9090`:

   ```bash
   curl -i -H "Host: $STAGE_HOSTNAME" http://localhost:9090/
   ```

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| `helm install` fails with `Too long: may not be more than 1048576 bytes` | You installed the CRD chart with `helm install` | Render it with `helm template` and apply it server-side, as in the first step. |
| Edge route shows `ResolvedRefs=False` with reason `RefNotPermitted` | The ReferenceGrant is missing in the landscape namespace | Create the ReferenceGrant from the `konfidence-router` step. |
| Edge route shows `ResolvedRefs=False` with reason `BackendNotFound` | The `konfidence-router` Service is in `envoy-gateway-system` | Install the controller with `deploy.type=GatewayNamespace`. Then recreate the Gateway. |
| `curl` returns `503` with `upstream connect error` | The backend Pod of the stage does not accept connections | Check the Pod with `kubectl get pods -n "$LANDSCAPE_NAMESPACE"`. |

## Next steps

- [Route external traffic to stages](./ingress.md) describes the contract for other gateway implementations.
- [Create a stage](../../../manage-delivery/stages.md), then route a hostname to it.
