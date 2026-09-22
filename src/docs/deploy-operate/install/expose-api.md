---
title: Give teams access to the dashboard and API
description: Publish the API and dashboard through an Ingress or Gateway with TLS and connect the login to your OIDC provider.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Give teams access to the dashboard and API

Let your teams open the Konfidence dashboard in a browser and sign in with their company account. The same setup lets the `kden` CLI and CI pipelines reach the API. To get there, you publish the API server under a public URL with TLS. Then you connect its login to your OpenID Connect (OIDC) provider.

This configures the installation's endpoint and login. [Create a project](../control-access/projects.md) and [grant teams access to it](../control-access/access-control.md) to make project resources available after sign-in.

## Prerequisites

- Konfidence installed with the release name `konfidence` in `konfidence-system`. See [Install Konfidence](./konfidence-installation.md).
- Helm and `kubectl` access to upgrade the release and configure Secrets and routing in its namespace.
- An Ingress controller in the cluster, or a Gateway API implementation such as Envoy Gateway. Check: `kubectl get ingressclass` or `kubectl get gatewayclass` lists at least one class.
- A DNS name for the API that resolves to that controller, for example `konfidence.example.com`.
- A TLS certificate for that name as a Secret in `konfidence-system`. An issuer such as cert-manager can create it from Ingress annotations instead.
- An OIDC client at your identity provider with the redirect URL `https://konfidence.example.com/api/v1/auth/callback`. Note its issuer URL, client id, and client secret.

The session cookie is marked `secure`, so browsers send it over HTTPS only. Plain HTTP works for `curl` but not for the dashboard login.

Set the values used below:

```bash
export KONFIDENCE_VERSION=0.0.1-alpha.1
export KONFIDENCE_HOST=konfidence.example.com
```

## Store the client secret

The chart reads the client secret from a Secret in the release namespace:

```bash
kubectl create secret generic konfidence-oidc-client \
  --namespace konfidence-system \
  --from-literal=client-secret='<CLIENT_SECRET>'
```

## Write the values file

Pick the tab for your controller. Save the file as `konfidence-values.yaml` and replace the issuer URL and client id with the values from your provider. For an Ingress, replace `<INGRESS_CLASS>` with the name from `kubectl get ingressclass`.

::: code-group

```yaml [Ingress]
api:
  oidc:
    enabled: true
    issuerURL: https://id.example.com
    clientId: konfidence
    clientSecretRef:
      name: konfidence-oidc-client
      key: client-secret
    redirectURL: https://konfidence.example.com/api/v1/auth/callback
    scopes: openid,profile,email,groups
  ingress:
    enabled: true
    className: <INGRESS_CLASS>
    hosts:
      - host: konfidence.example.com
        paths:
          - path: /
            pathType: Prefix
    tls:
      - secretName: konfidence-tls
        hosts:
          - konfidence.example.com
```

```yaml [Gateway API]
api:
  oidc:
    enabled: true
    issuerURL: https://id.example.com
    clientId: konfidence
    clientSecretRef:
      name: konfidence-oidc-client
      key: client-secret
    redirectURL: https://konfidence.example.com/api/v1/auth/callback
    scopes: openid,profile,email,groups
  ingress:
    enabled: false
```

:::

Role bindings match users by group, so the token must carry group membership. Add the scope your provider uses for that, `groups` in the example. Leave `redirectURL` identical to the redirect URL registered at the provider.

## Upgrade the release

Apply the values to the existing release:

```bash
helm upgrade konfidence oci://ghcr.io/konfidence-project/charts/konfidence \
  --version "$KONFIDENCE_VERSION" \
  --namespace konfidence-system \
  --set image.repository=ghcr.io/konfidence-project/konfidence-operator \
  --set image.tag="$KONFIDENCE_VERSION" \
  --set webhook.enabled=false \
  --values konfidence-values.yaml \
  --wait
```

Helm restarts the API deployment.

## Publish the endpoint

::: code-group

```bash [Ingress]
kubectl get ingress konfidence-api --namespace konfidence-system
```

```yaml [Gateway API]
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: konfidence-api
  namespace: konfidence-system
spec:
  parentRefs:
    - name: <GATEWAY_NAME>
      namespace: <GATEWAY_NAMESPACE>
  hostnames:
    - konfidence.example.com
  rules:
    - backendRefs:
        - name: konfidence-api
          port: 8090
```

:::

With an Ingress, Helm already created it during the upgrade. The command lists `konfidence-api` with your host and an address.

With Gateway API, save the route as `konfidence-route.yaml` and apply it with `kubectl apply -f konfidence-route.yaml`. It points at the `konfidence-api` Service. TLS terminates at the Gateway's HTTPS listener, so the certificate is configured on the Gateway, not on the route. The Gateway must allow routes from `konfidence-system` in its listener's `allowedRoutes`.

## Verify the endpoint

Check the health endpoint through your Ingress or Gateway:

```bash
curl --fail "https://$KONFIDENCE_HOST/healthz"
```

The command exits with status 0. Open `https://konfidence.example.com` in a browser. The sign-in page appears, and after signing in you see the dashboard with the projects your groups grant you.

<!-- TODO(docs): screenshot — the project list right after sign-in, captured from the quickstart with the example app. Belongs with the planned "Follow deployments in the dashboard" page under Develop & Integrate. -->

## Log in with the CLI

Point `kden` at the public endpoint and sign in:

```bash
kden config set api-endpoint "https://$KONFIDENCE_HOST/api"
kden login
```

A browser window opens for the identity provider. After sign-in, `kden project list` prints the projects your groups grant you.

## What to do if it fails

- The API pod restarts with `oidc-issuer-url must not be empty`: `api.oidc.issuerURL` is missing from the values file.
- The provider rejects the login with a redirect URI error: `redirectURL` differs from the URL registered at the provider.
- Sign-in succeeds but `kden project list` is empty: the token carries no group that a project binds. Check the scope and [Grant teams access to a project](../control-access/access-control.md).
- `curl` reports a certificate error: the TLS Secret named in `ingress.tls` does not exist or covers a different host.

## Next steps

- [Choose a deployer](./deployer/overview.md) selects the deployment capabilities to install.
- [Create a project](../control-access/projects.md) establishes a project, and [Grant teams access to a project](../control-access/access-control.md) binds identity provider groups to its roles.
- [Grant CI pipelines access](../control-access/grant-ci-access.md) lets pipelines call the exposed API.
