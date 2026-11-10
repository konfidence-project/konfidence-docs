---
title: Set up Traefik
description: Install Traefik Proxy as a Gateway API implementation, an edge Gateway, and one konfidence-router Gateway per landscape.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Set up Traefik

Use [Traefik](https://doc.traefik.io/traefik/) to route external requests to a [stage](../../../../reference/glossary.md#stage) by hostname. You install one Traefik release for the edge Gateway and one per landscape for `konfidence-router`. You also register the activation task that lets Konfidence attach its routes. [Gateway routing](../../../plan/gateway-routing.md) explains what each part does.

## Each Traefik release manages one gateway

Traefik does not deploy a proxy per Gateway. One Traefik deployment serves every Gateway that it manages, on its own entry points. If the edge Traefik also managed `konfidence-router`, external clients could reach the stage routes directly. They could then pick any stage with their own `x-konfidence-*` headers.

Each Helm release therefore manages exactly one Gateway. The value `providers.kubernetesGateway.gateways` names that Gateway. All releases share one GatewayClass, because Traefik has the fixed controller name `traefik.io/gateway-controller`.

## Prerequisites

Before you begin, make sure you have:

- [Konfidence](../../konfidence-installation.md) and the [Kubernetes deployer](../kubernetes.md) installed.
- At least one [landscape](../../../../reference/glossary.md#landscape) with a stage. `kubectl get stages -A` lists them.
- Helm 3.8 or later and `kubectl` with cluster-admin permissions.
- No other Gateway API implementation that manages the Gateway API CRDs. `kubectl get crd gateways.gateway.networking.k8s.io` shows whether they exist.
- No other Traefik installation with the Gateway API provider. `kubectl get gatewayclass` lists no class with the controller `traefik.io/gateway-controller`.

The commands use these values. Replace them with your own:

```bash
export GATEWAY_API_VERSION=v1.6.3
export TRAEFIK_CHART_VERSION=42.3.1
export LANDSCAPE_NAMESPACE=kden-l-dev
export STAGE=dev-eu12
export STAGE_HOSTNAME=dev-eu12.example.kden.local
export SERVICE=my-service
```

`SERVICE` is the name of a [deployment result](../../../../reference/glossary.md#deployment-result) of the stage. Chart version `42.3.1` installs Traefik v3.7.17, which implements Gateway API v1.6.3.

## Install the Gateway API resources

The Traefik chart ships no Gateway API CRDs. Install them and the shared GatewayClass yourself.

1. Install the Gateway API CRDs of the standard channel:

   ```bash
   kubectl apply --server-side -f \
     "https://github.com/kubernetes-sigs/gateway-api/releases/download/$GATEWAY_API_VERSION/standard-install.yaml"
   ```

2. Create the GatewayClass that all Traefik releases share:

   ```bash
   kubectl apply -f - <<EOF
   apiVersion: gateway.networking.k8s.io/v1
   kind: GatewayClass
   metadata:
     name: traefik
   spec:
     controllerName: traefik.io/gateway-controller
   EOF
   ```

`kubectl get gatewayclass traefik` shows `ACCEPTED` `True` once the first Traefik release runs.

## Install the edge Gateway

The edge release creates the Gateway `edge` and a `LoadBalancer` service named `edge`. The listener port `8000` is the port of Traefik's `web` entry point. Traefik rejects listener ports that match no entry point. The Service maps port `80` to it.

::: tip Local kind cluster
A kind cluster has no load balancer. On the [Quickstart](../../../../getting-started/quickstart.md) cluster, first read [Use in a local kind cluster](#use-in-a-local-kind-cluster). Then add its values to this release.
:::

The edge release watches all namespaces. It must read the `konfidence-router` Services and the ReferenceGrants in the landscape namespaces.

```bash
helm upgrade --install edge oci://ghcr.io/traefik/helm/traefik \
  --version "$TRAEFIK_CHART_VERSION" \
  --namespace edge-gateway \
  --create-namespace \
  --wait \
  -f - <<EOF
fullnameOverride: edge
providers:
  kubernetesCRD:
    enabled: false
  kubernetesIngress:
    enabled: false
  kubernetesGateway:
    enabled: true
    # Manage only this Gateway, never konfidence-router.
    gateways:
      - name: edge
        namespace: edge-gateway
ingressClass:
  enabled: false
gatewayClass:
  # The GatewayClass from the previous step. Releases must not create it.
  enabled: false
  name: traefik
gateway:
  name: edge
  listeners:
    web:
      port: 8000
      protocol: HTTP
      namespacePolicy:
        from: Same
accessLog:
  enabled: true
EOF

kubectl wait gateway/edge -n edge-gateway --for=condition=Programmed --timeout=180s
```

The `kubectl wait` command prints `condition met`.

## Install the konfidence-router Gateway for each landscape

Repeat this step for every landscape namespace. The release creates the Gateway `konfidence-router` and a `ClusterIP` service with the same name. It watches only the landscape namespace. The ReferenceGrant lets edge routes in `edge-gateway` use that Service.

```bash
helm upgrade --install konfidence-router oci://ghcr.io/traefik/helm/traefik \
  --version "$TRAEFIK_CHART_VERSION" \
  --namespace "$LANDSCAPE_NAMESPACE" \
  --wait \
  -f - <<EOF
fullnameOverride: konfidence-router
providers:
  kubernetesCRD:
    enabled: false
  kubernetesIngress:
    enabled: false
  kubernetesGateway:
    enabled: true
    namespaces:
      - $LANDSCAPE_NAMESPACE
    gateways:
      - name: konfidence-router
        namespace: $LANDSCAPE_NAMESPACE
ingressClass:
  enabled: false
gatewayClass:
  enabled: false
  name: traefik
gateway:
  name: konfidence-router
  listeners:
    web:
      port: 8000
      protocol: HTTP
      namespacePolicy:
        from: Same
accessLog:
  enabled: true
service:
  spec:
    type: ClusterIP
ports:
  websecure:
    expose:
      default: false
EOF

kubectl apply -f - <<EOF
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

`kubectl get service konfidence-router -n "$LANDSCAPE_NAMESPACE"` shows the type `ClusterIP` and the port `80/TCP`.

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

The backend port is the Service port `80`. Traefik resolves it to the `web` port `8000` of the `konfidence-router` Pods.

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

   The `Host` header selects the route, so you need no DNS entry or `/etc/hosts` change. Until Konfidence has created the stage's route, the response is `404`. The edge also answers `404` when no route matches, so the status does not show where the request ended.

3. Check that the request reached `konfidence-router`:

   ```bash
   kubectl logs -n "$LANDSCAPE_NAMESPACE" --tail=5 \
     -l "app.kubernetes.io/name=traefik,app.kubernetes.io/instance=konfidence-router-$LANDSCAPE_NAMESPACE"
   ```

   The output contains an access log line with the path `/$SERVICE`. Its router name contains `konfidence-stage-<stage>`. If no line appears, the edge did not forward the request. Repeat the first step.

## Use in a local kind cluster

The [Quickstart](../../../../getting-started/quickstart.md) cluster has no load balancer. Its script maps `localhost:9090` to NodePort `30080` on the kind node. Give the edge Service a NodePort on that port.

A kind cluster that you created yourself has no such mapping. Add an `extraPortMappings` entry from `containerPort: 30080` to `hostPort: 9090` to its configuration, then recreate the cluster.

1. Add these values to the values of the edge release, after `accessLog`:

   ```yaml
   service:
     spec:
       type: NodePort
   ports:
     web:
       nodePort: 30080
     websecure:
       expose:
         default: false
   ```

2. Send requests to `localhost:9090`:

   ```bash
   curl -i -H "Host: $STAGE_HOSTNAME" "http://localhost:9090/$SERVICE"
   ```

`kubectl get service edge -n edge-gateway` shows the type `NodePort` and the port `80:30080/TCP`.

## Troubleshooting

| Symptom | Likely cause | Resolution |
| --- | --- | --- |
| `helm upgrade` fails with `port 80 is not declared in ports` | The listener port is the Service port, not an entry point port | Set the listener port to `8000`, the port of the `web` entry point. |
| The edge answers requests that carry `x-konfidence-*` headers but match no edge route | The edge release manages `konfidence-router` too | Set `providers.kubernetesGateway.gateways` in every release to its own Gateway only. |
| Edge route shows `ResolvedRefs=False` with the message `namespace <namespace> is not within watched namespaces`, and `curl` returns `500` | The edge release watches only some namespaces | Remove `providers.kubernetesGateway.namespaces` from the edge release, or list every landscape namespace in it. |
| Edge route shows `ResolvedRefs=False` with reason `RefNotPermitted` and no namespace message | The ReferenceGrant is missing in the landscape namespace | Create the ReferenceGrant from the `konfidence-router` step. |
| `kubectl get httproute -n "$LANDSCAPE_NAMESPACE"` lists no `konfidence-stage-<stage>` route after an activation | The activation task is not registered in the landscape namespace | Create the `ActivationTaskRegistration` from the registration step. Konfidence creates the route on the next activation of the stage. |
| `curl` returns `404` although `konfidence-stage-<stage>` exists | The edge route does not set `x-konfidence-service`, or its value is not a deployment result name | Compare the edge route's `x-konfidence-service` value with the values in `konfidence-stage-<stage>`. |
| `helm upgrade` fails with `ClusterRole. RBAC cannot be namespaced` | The values set `rbac.namespaced=true` | Remove the value. The Gateway API provider needs a ClusterRole. |

## Next steps

- [Gateway routing](../../../plan/gateway-routing.md) describes the contract for other gateway implementations.
- [Create a stage](../../../manage-delivery/stages.md), then route a hostname to it.
