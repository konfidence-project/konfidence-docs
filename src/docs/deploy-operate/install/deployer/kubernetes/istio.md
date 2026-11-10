---
title: Set up Istio
description: Install Istio as a Gateway API implementation, an edge Gateway, and one konfidence-router Gateway per landscape.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Set up Istio

Use [Istio](https://istio.io/) to route external requests to a [stage](../../../../reference/glossary.md#stage) by hostname. You install the Istio control plane, one edge Gateway, and one `konfidence-router` Gateway per landscape. You also register the activation task that lets Konfidence attach its routes. [Gateway routing](../../../plan/gateway-routing.md) explains what each part does.

The setup uses only Istio's Gateway API support. It needs no sidecars and no mesh in the landscape namespaces.

## Prerequisites

Before you begin, make sure you have:

- [Konfidence](../../konfidence-installation.md) and the [Kubernetes deployer](../kubernetes.md) installed.
- At least one [landscape](../../../../reference/glossary.md#landscape) with a stage. `kubectl get stages -A` lists them.
- Helm 3.8 or later and `kubectl` with cluster-admin permissions.
- No other Gateway API implementation that manages the Gateway API CRDs. `kubectl get crd gateways.gateway.networking.k8s.io` shows whether they exist.
- No existing Istio installation. `kubectl get deployment istiod -n istio-system` returns `NotFound`.

The commands use these values. Replace them with your own:

```bash
export GATEWAY_API_VERSION=v1.6.0
export ISTIO_VERSION=1.31.4
export LANDSCAPE_NAMESPACE=kden-l-dev
export STAGE=dev-eu12
export STAGE_HOSTNAME=dev-eu12.example.kden.local
export SERVICE=my-service
```

`SERVICE` is the name of a [deployment result](../../../../reference/glossary.md#deployment-result) of the stage. Istio 1.31 implements Gateway API v1.6.0.

## Install Istio

1. Install the Gateway API CRDs of the standard channel:

   ```bash
   kubectl apply --server-side -f \
     "https://github.com/kubernetes-sigs/gateway-api/releases/download/$GATEWAY_API_VERSION/standard-install.yaml"
   ```

2. Add the Istio Helm repository:

   ```bash
   helm repo add istio https://blob.istio.io/istio-release/charts
   helm repo update istio
   ```

3. Install the Istio base chart. It contains the Istio CRDs and cluster roles:

   ```bash
   helm upgrade --install istio-base istio/base \
     --version "$ISTIO_VERSION" \
     --namespace istio-system \
     --create-namespace \
     --set defaultRevision=default \
     --wait
   ```

4. Install `istiod`. Access logging is off by default. `meshConfig.accessLogFile` turns it on for the gateway proxies, so you can check the request path later:

   ```bash
   helm upgrade --install istiod istio/istiod \
     --version "$ISTIO_VERSION" \
     --namespace istio-system \
     --set meshConfig.accessLogFile=/dev/stdout \
     --wait
   ```

`kubectl get gatewayclass istio` shows `ACCEPTED` `True`. `istiod` creates this GatewayClass itself.

## Create the edge Gateway

The edge Gateway receives external traffic. Istio deploys a proxy for each Gateway in the Gateway's namespace. It names the proxy's Deployment and Service `<gateway>-istio`. The annotation `gateway.istio.io/name-override` sets the name `edge` instead. The Service has the type `LoadBalancer` by default.

Create the namespace of the edge Gateway:

```bash
kubectl create namespace edge-gateway
```

::: tip Local kind cluster
A kind cluster has no load balancer. On the [Quickstart](../../../../getting-started/quickstart.md) cluster, follow [Use in a local kind cluster](#use-in-a-local-kind-cluster) first. Then create the edge Gateway with the `infrastructure` block from that section.
:::

Create the edge Gateway:

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: edge
  namespace: edge-gateway
  annotations:
    gateway.istio.io/name-override: edge
spec:
  gatewayClassName: istio
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

Repeat this step for every landscape namespace. The annotation `networking.istio.io/service-type` pins the proxy's Service to `ClusterIP`. The annotation `gateway.istio.io/name-override` gives it the stable name `konfidence-router`. The ReferenceGrant lets edge routes in `edge-gateway` use that Service.

```bash
kubectl apply -f - <<EOF
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: konfidence-router
  namespace: $LANDSCAPE_NAMESPACE
  annotations:
    gateway.istio.io/name-override: konfidence-router
    networking.istio.io/service-type: ClusterIP
spec:
  gatewayClassName: istio
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

`kubectl get service konfidence-router -n "$LANDSCAPE_NAMESPACE"` shows the type `ClusterIP` and the ports `15021/TCP,80/TCP`. Port `15021` is the proxy's status port.

## Register the activation task for each landscape

Repeat this step for every landscape namespace. Konfidence creates the stage routes on `konfidence-router` only if this registration exists. Without it, activations succeed but no route exists.

```bash
kubectl apply -f - <<EOF
apiVersion: konfidence.cloud/v1alpha1
kind: ActivationTaskRegistration
metadata:
  name: gateway-route
  namespace: $LANDSCAPE_NAMESPACE
spec:
  type: gateway-route.konfidence.cloud
  # Optional: gatewayName and gatewayNamespace override the Gateway that the
  # routes attach to. They default to konfidence-router in this namespace.
  spec: {}
EOF
```

After the next activation of a stage in this landscape, `kubectl get httproute -n "$LANDSCAPE_NAMESPACE"` lists `konfidence-stage-<stage>`.

## Route a hostname to each stage

Repeat this step for every stage that you want to expose outside the cluster. The route matches the stage's hostname. Each rule matches a path and sets the headers that select the stage and the deployment result. It then forwards the request to the landscape's `konfidence-router`. Add one rule per deployment result that you want to expose.

`kubectl get httproute "konfidence-stage-$STAGE" -n "$LANDSCAPE_NAMESPACE" -o yaml` shows the `x-konfidence-service` values that Konfidence matches once the stage is active.

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
    - matches:
        - path:
            type: PathPrefix
            value: /$SERVICE
      filters:
        - type: RequestHeaderModifier
          requestHeaderModifier:
            # set overwrites client-supplied values, so clients cannot
            # pick another stage or service.
            set:
              # Selects the stage.
              - name: x-konfidence-stage
                value: $STAGE
              # Selects the deployment result within the stage.
              - name: x-konfidence-service
                value: $SERVICE
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

2. Send a request through the edge. `<EDGE_ADDRESS>` is the address that `kubectl get gateway edge -n edge-gateway` shows. On a local kind cluster, use `localhost:9090` instead, as described in [Use in a local kind cluster](#use-in-a-local-kind-cluster):

   ```bash
   curl -i -H "Host: $STAGE_HOSTNAME" "http://<EDGE_ADDRESS>/$SERVICE"
   ```

   The `Host` header selects the route, so you need no DNS entry or `/etc/hosts` change. A response from the edge carries the header `server: istio-envoy`. Until Konfidence has created the stage's route, the response is `404`. The edge also answers `404` when no route matches, so the status does not show where the request ended.

3. Check that the request reached `konfidence-router`:

   ```bash
   kubectl logs -n "$LANDSCAPE_NAMESPACE" --tail=5 \
     -l gateway.networking.k8s.io/gateway-name=konfidence-router
   ```

   The output contains an access log line such as `"GET /$SERVICE HTTP/1.1"`. Its upstream is `outbound|80||<deployment-result-service>`. If no line appears, the edge did not forward the request. Repeat the first step.

## Use in a local kind cluster

The [Quickstart](../../../../getting-started/quickstart.md) cluster has no load balancer. Its script maps `localhost:9090` to NodePort `30080` on the kind node. Give the edge Gateway a NodePort service on that port.

A kind cluster that you created yourself has no such mapping. Add an `extraPortMappings` entry from `containerPort: 30080` to `hostPort: 9090` to its configuration, then recreate the cluster.

1. Before you create the edge Gateway, create this ConfigMap. Istio applies its `service` key as a strategic merge patch to the generated Service:

   ```bash
   kubectl apply -f - <<EOF
   apiVersion: v1
   kind: ConfigMap
   metadata:
     name: edge
     namespace: edge-gateway
   data:
     service: |
       spec:
         type: NodePort
         ports:
           - port: 80
             nodePort: 30080
   EOF
   ```

2. Add this block to the `spec` of the edge Gateway:

   ```yaml
   infrastructure:
     parametersRef:
       group: ""
       kind: ConfigMap
       name: edge
   ```

3. Send requests to `localhost:9090`:

   ```bash
   curl -i -H "Host: $STAGE_HOSTNAME" "http://localhost:9090/$SERVICE"
   ```

`kubectl get service edge -n edge-gateway` shows the type `NodePort` and the port `80:30080/TCP`.

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| Edge route shows `ResolvedRefs=False` with reason `RefNotPermitted` | The ReferenceGrant is missing in the landscape namespace | Create the ReferenceGrant from the `konfidence-router` step. |
| Edge route shows `ResolvedRefs=False`, and the landscape namespace has a Service `konfidence-router-istio` | The `konfidence-router` Gateway lacks the annotation `gateway.istio.io/name-override` | Add the annotation to the Gateway. Istio then renames the Deployment and the Service. |
| `kubectl get service konfidence-router -n "$LANDSCAPE_NAMESPACE"` shows the type `LoadBalancer` | The Gateway lacks the annotation `networking.istio.io/service-type: ClusterIP` | Add the annotation. `konfidence-router` must stay cluster-internal. |
| `kubectl get httproute -n "$LANDSCAPE_NAMESPACE"` lists no `konfidence-stage-<stage>` route after an activation | The activation task is not registered in the landscape namespace | Create the `ActivationTaskRegistration` from the registration step. Konfidence creates the route on the next activation of the stage. |
| `curl` returns `404` although `konfidence-stage-<stage>` exists | The edge route does not set `x-konfidence-service`, or its value is not a deployment result name | Compare the edge route's `x-konfidence-service` value with the values in `konfidence-stage-<stage>`. |
| `curl` returns `503` with `upstream connect error` | The backend Pod of the stage does not accept connections | Check the Pod with `kubectl get pods -n "$LANDSCAPE_NAMESPACE"`. |
| `kubectl logs` for `konfidence-router` shows no access log lines | `istiod` runs without `meshConfig.accessLogFile` | Upgrade `istiod` with `--set meshConfig.accessLogFile=/dev/stdout`, as in the install step. |

## Next steps

- [Gateway routing](../../../plan/gateway-routing.md) describes the contract for other gateway implementations.
- [Create a stage](../../../manage-delivery/stages.md), then route a hostname to it.
