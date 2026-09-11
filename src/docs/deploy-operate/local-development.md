---
title: Local Development (No-Auth Mode)
description: Run Konfidence without an identity provider by disabling OIDC authentication.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Local Development (No-Auth Mode)

Konfidence supports running without an identity provider by disabling OIDC authentication. In this mode, the API server injects a static admin identity into every request so you can work with all API endpoints and the UI without setting up an IDP.

::: warning Not for production
No-auth mode disables all authentication. It is intended exclusively for local development and testing. Never run with `oidc.enabled: false` in a shared or production environment.
:::

## How it works

When `oidc.enabled` is set to `false`:

- The OIDC login flow is replaced by a fake auth handler that immediately creates a session
- Every session carries a static admin identity with the group `local-admin`
- All API endpoints remain accessible - the session middleware still validates sessions normally
- Both the browser (UI) and CLI login flows work without any IDP

The static admin identity has the following attributes:

| Field   | Value         |
|---------|---------------|
| Name    | `Local Admin` |
| Email   | `admin@local` |
| Groups  | `local-admin` |

## Setup

**1. Create a kind cluster**

If you don't have a cluster yet, use the quickstart script to spin up a kind cluster with Konfidence pre-installed (OIDC disabled by default):

```bash
curl -L https://raw.githubusercontent.com/konfidence-project/konfidence/main/hack/quickstart/kind.sh | sh
```

Or create a minimal kind cluster manually (requires [kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)):

```bash
kind create cluster --name konfidence-test
```

If you already have a Kubernetes cluster, select it as your current kubeconfig context and skip to step 2.

**2. Apply CRDs**

```bash
kubectl apply -f .tmp/crds/
```

**3. Start the API server with OIDC disabled**

```bash
API_OIDC_ENABLED=false make run-kden-api
```

**4. Apply a project with the `local-admin` role binding**

Projects use `roleBindings` to control access. Any project that should be accessible in no-auth mode must include the `local-admin` group:

```bash
kubectl apply -f - <<EOF
apiVersion: konfidence.cloud/v1alpha1
kind: Project
metadata:
  name: my-project
spec:
  roleBindings:
    admin:
      - session:
          memberOf:
            - local-admin
EOF
```

Projects without a `local-admin` binding will return empty role sets and their resources will not be accessible.

## Login flow

### Browser (UI)

Start the UI dev server:

```bash
pnpm dev
```

Open `http://localhost:5173` and click **Login**. The fake auth handler redirects immediately through the callback and sets a session cookie - no IDP interaction required. The UI will show you logged in as `Local Admin`.

### API (curl)

**1. Get the callback URL**

```bash
curl -sv "http://localhost:8090/api/v1/login?return_url=/" 2>&1 | grep Location
```

**2. Follow the callback URL from the `Location` header**

```bash
curl -sv "http://localhost:8090/api/v1/auth/callback?state=..." 2>&1 | grep Set-Cookie
```

**3. Verify your identity**

```bash
curl -s "http://localhost:8090/api/v1/identity" -H "Cookie: kden-session=<session-id>"
# {"name":"Local Admin","email":"admin@local","projectRoles":{"my-project":["admin"]}}
```

**4. List resources**

```bash
curl -s "http://localhost:8090/api/v1/projects" -H "Cookie: kden-session=<session-id>"
```

### CLI

```bash
kden login --server http://localhost:8090
```

The CLI opens the login URL in your browser, the fake auth handler completes the callback, and the CLI receives its session token via the PKCE exchange.

## Next steps

- [Access Control (RBAC)](/docs/deploy-operate/access-control) — Configure role bindings for real IDP groups
- [Installing Konfidence](/docs/deploy-operate/konfidence-installation) — Full Helm installation reference
