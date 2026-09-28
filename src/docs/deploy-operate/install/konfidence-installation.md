---
title: Install Konfidence
description: Install the Konfidence operator and API server into a Kubernetes cluster with Helm.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Install Konfidence

Install the Konfidence operator and API server from one Helm chart. After verifying these services, publish the dashboard and API, choose a [deployer](../../reference/glossary.md#deployer), and configure registry access.

These steps are for the administrator of the Kubernetes installation. Review [System architecture](../plan/system-architecture.md) and [Plan for high availability](../plan/high-availability.md) before choosing your configuration.

For a local test cluster, use the [Quickstart](/docs/getting-started/quickstart) instead. It sets up a kind cluster with everything installed.

## Prerequisites

- A Kubernetes cluster and `kubectl` access with permission to install charts and their cluster-scoped resources. Check connectivity with `kubectl cluster-info`; it prints the Kubernetes control plane address.
- Helm with OCI registry support, version 3.8 or later. Check: `helm version` prints 3.8 or higher.
- The Gateway API CRDs, version 1.4.1. Check: `kubectl get crd gateways.gateway.networking.k8s.io` finds the CRD. Install:

  ```bash
  kubectl apply --server-side -f https://github.com/kubernetes-sigs/gateway-api/releases/download/v1.4.1/standard-install.yaml
  ```

- Flux with its source controller. Check: `kubectl get deployment source-controller -n flux-system` shows one available replica. Install:

  ```bash
  kubectl apply -f https://github.com/fluxcd/flux2/releases/latest/download/install.yaml
  kubectl wait deployment/source-controller \
    --namespace flux-system \
    --for=condition=Available \
    --timeout=180s
  ```

## Install the Konfidence services {#install-the-control-plane}

Set the Konfidence version and target namespace:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_NAMESPACE=konfidence-system
```

Install the chart:

```bash
helm upgrade --install konfidence oci://ghcr.io/konfidence-project/charts/konfidence \
  --version "$KONFIDENCE_VERSION" \
  --namespace "$KONFIDENCE_NAMESPACE" \
  --create-namespace \
  --set image.repository=ghcr.io/konfidence-project/konfidence-operator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --set api.oidc.enabled=false \
  --set webhook.enabled=false \
  --wait
```

The two `enabled=false` flags keep the first install self-contained. With the chart defaults, the API server refuses to start without an OIDC issuer URL. The admission webhook needs a TLS Secret named `konfidence-webhook-server-cert`. [Give teams access to the dashboard and API](./expose-api.md) turns OIDC on. [Enable the admission webhook with cert-manager](#enable-the-admission-webhook-with-cert-manager) below creates the Secret. Every chart value is listed in the [Helm values reference](/docs/reference/helm-values-konfidence).

## Verify the installation

```bash
kubectl get deployments -n "$KONFIDENCE_NAMESPACE"
```

You see `konfidence` and `konfidence-api` with all replicas available.

## Enable the admission webhook with cert-manager

The webhook validates `Project`, `Landscape`, and `DeploymentTarget` resources before the API server stores them. It serves TLS from the Secret `konfidence-webhook-server-cert`, and the Kubernetes API server must trust the certificate's CA. cert-manager issues the certificate and injects the CA into the webhook configuration.

Prerequisite: cert-manager runs in the cluster. Check: `kubectl get crd certificates.cert-manager.io` finds the CRD.

Create a self-signed issuer and the certificate in the Konfidence namespace. Save the following as `webhook-cert.yaml`:

```yaml
apiVersion: cert-manager.io/v1
kind: Issuer
metadata:
  name: konfidence-webhook-selfsigned
  namespace: konfidence-system
spec:
  selfSigned: {}
---
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: konfidence-webhook-server-cert
  namespace: konfidence-system
spec:
  secretName: konfidence-webhook-server-cert
  issuerRef:
    name: konfidence-webhook-selfsigned
  dnsNames:
    - konfidence-webhook-service.konfidence-system.svc
    - konfidence-webhook-service.konfidence-system.svc.cluster.local
```

Apply it and wait for the Secret:

```bash
kubectl apply -f webhook-cert.yaml
kubectl wait certificate/konfidence-webhook-server-cert \
  --namespace konfidence-system \
  --for=condition=Ready \
  --timeout=60s
```

The Secret `konfidence-webhook-server-cert` now holds `tls.crt` and `tls.key`. Enable the webhook and let cert-manager inject the CA. Save the following as `webhook-values.yaml`:

```yaml
webhook:
  enabled: true
  annotations:
    cert-manager.io/inject-ca-from: konfidence-system/konfidence-webhook-server-cert
```

Run the install command again without `--set webhook.enabled=false`.

## Keep login sessions in PostgreSQL

The API server keeps login sessions in memory by default. A restart signs every user out, and two replicas do not share sessions. To keep sessions across restarts and replicas, store them in PostgreSQL.

Prerequisite: a PostgreSQL database the API server can reach, and its connection string in the URL form `postgres://konfidence:<PASSWORD>@postgres.example.com:5432/konfidence`.

Store the connection string in a Secret:

```bash
kubectl create secret generic konfidence-api-db \
  --namespace konfidence-system \
  --from-literal=connection='postgres://konfidence:<PASSWORD>@postgres.example.com:5432/konfidence'
```

Save the following as `session-values.yaml`. The chart exposes the store type as a value and reads the connection string from the environment:

```yaml
api:
  session:
    storageType: db-pg
  env:
    - name: API_DB_CONNECTION
      valueFrom:
        secretKeyRef:
          name: konfidence-api-db
          key: connection
```

Run the install command again with `--values session-values.yaml`. The API server refuses to start when `storageType` is `db-pg` and the connection string is empty. Pool sizes are set under `api.database`.

## Next steps

- [Give teams access to the dashboard and API](./expose-api.md) publishes both and enables login through your identity provider.
- [Choose a deployer](./deployer/overview.md) selects the capabilities your applications need. Then [install the Kubernetes deployer](./deployer/kubernetes.md#install-the-deployer) for Helm and Kustomize artifacts.
- [Connect artifact registries](./connect-registries.md) configures control plane credentials now and deployer credentials after you create a [landscape](../../reference/glossary.md#landscape).
