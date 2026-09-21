---
title: Expose the API and dashboard
description: Publish the API and dashboard through an Ingress with TLS and connect the login to your OIDC provider.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Expose the API and dashboard

After installation, the API server is reachable only inside the cluster and has no login. Give it a public URL with TLS and connect the login to your OpenID Connect (OIDC) provider. One Ingress then serves every client: the dashboard, the `kden` CLI, and CI pipelines. In the dashboard, teams follow projects, stages, and deployments in a browser. Nobody needs cluster access to use Konfidence afterwards.

## Prerequisites

- Konfidence installed with the release name `konfidence` in `konfidence-system`. See [Install Konfidence](./konfidence-installation.md).
- An Ingress controller in the cluster. Check: `kubectl get ingressclass` lists at least one class.
- A DNS name for the API that resolves to the Ingress controller, for example `konfidence.example.com`.
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

Save the following as `konfidence-values.yaml` and replace the issuer URL and client id with the values from your provider:

```yaml
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
    className: nginx
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

Helm restarts the API deployment and creates the Ingress `konfidence-api`.

## Verify the endpoint

Check the health endpoint through the Ingress:

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
- Sign-in succeeds but `kden project list` is empty: the token carries no group that a project binds. Check the scope and [Grant roles](./access-control.md).
- `curl` reports a certificate error: the TLS Secret named in `ingress.tls` does not exist or covers a different host.

## Next steps

- [Grant roles](./access-control.md) binds identity provider groups to project roles.
- [Grant CI pipelines access](./grant-ci-access.md) lets pipelines call the exposed API.
