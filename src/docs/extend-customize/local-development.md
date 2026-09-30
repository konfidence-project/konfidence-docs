---
title: "Local development"
description: "Set up Konfidence locally and add only the services your work needs."
outline: deep
editLink: true
lastUpdated: true
---

# Local development

This guide is for contributors to the [`konfidence`](https://github.com/konfidence-project/konfidence) repository. If you only want to try Konfidence, follow the [Quickstart](../getting-started/quickstart.md) instead.

The recommended setup runs the operator, API server, and dashboard on your computer. A lightweight Kubernetes API stores the Konfidence resources, while Docker provides login, HTTPS, and PostgreSQL.

## Before you start

You need:

- the `konfidence` repository cloned locally
- Docker running
- Hermit available in every terminal you use

Run the commands in this guide from the repository root. Activate Hermit in each terminal:

```bash
source ./bin/activate-hermit
```

Hermit provides the project tools, including Go, `kubectl`, Helm, and kind. Run `make help` at any time to see the available development commands.
The first `make` run may take a few minutes while it downloads tools and generates manifests.

If you plan to work on the dashboard, install its dependencies once:

```bash
pnpm install
```

## Recommended setup

The following setup includes the local sign-in flow and trusted HTTPS addresses. Leave each long-running process in its own terminal.

### 1. Start the local services

```bash
make dev-up
```

This starts the local identity provider, HTTPS proxy, and PostgreSQL. On the first run, `make dev-up` creates a local certificate authority and adds it to your operating system's trust store. Your operating system may ask for your password or confirmation.

The generated certificates are stored in `local/certs` and are specific to your computer. The shared development credentials in `hack/kden_local_dev` are for local use only.

### 2. Start the Kubernetes API

```bash
make dev-kube-apiserver
```

This starts a small Kubernetes API for development. It does not run containers or workloads, but it is enough for the operator, API server, CLI, and dashboard.

The command prints a `KUBECONFIG` value. In every new terminal, activate Hermit and set that value:

```bash
source ./bin/activate-hermit
export KUBECONFIG="$PWD/.tmp/envtest.kubeconfig"
```

Leave `make dev-kube-apiserver` running while you work.

### 3. Start the operator

Generate the local webhook certificates once:

```bash
make webhook-certs
```

Then start the operator:

```bash
make run
```

### 4. Start the API server

In another terminal with Hermit and `KUBECONFIG` set, run:

```bash
make run-kden-api
```

The default local configuration connects the API server to the identity provider started by `make dev-up`.

To check that the API is ready, open <https://api.localhost/healthz>. The response should be `{"status":"ok"}`.

### 5. Start the dashboard

In another terminal, run:

```bash
make dev-ui
```

Open <https://ui.localhost> and sign in with one of these local users:

| Username | Password | Groups |
| --- | --- | --- |
| `alice` | `password` | `admins`, `developers` |
| `devin` | `password` | `developers` |
| `primo` | `password` | `productmanagers` |

The main local addresses are:

| Service | Address |
| --- | --- |
| Dashboard | `https://ui.localhost` |
| API | `https://api.localhost` |
| Sign-in | `https://auth.localhost` |

## Customize your local settings

Make loads the shared settings from `hack/kden_local_dev/konfidence.env` before it runs a target. These settings provide the local addresses and development credentials used throughout this guide. Each target uses only the settings it needs.

Do not edit that file for personal settings. For a one-time change, add the variable to the `make` command. For example, enable debug logging for the API server:

```bash
make run-kden-api API_LOG_LEVEL=debug
```

For settings you want to keep, create a private copy outside the repository:

```bash
mkdir -p "$HOME/.config/konfidence"
cp hack/kden_local_dev/konfidence.env "$HOME/.config/konfidence/dev.env"
```

Edit the private file, then tell Make to use it in the current terminal:

```bash
export DEV_KONFIDENCE_ENV_FILE="$HOME/.config/konfidence/dev.env"
```

Every `make` command from that terminal now uses your private settings. You can also select the file for one command:

```bash
make dev-ui DEV_KONFIDENCE_ENV_FILE="$HOME/.config/konfidence/dev.env"
```

## Dashboard only

You do not need Kubernetes or the operator when your change only affects the dashboard. Start the dashboard with its mock API:

```bash
pnpm ui:dev:mock
```

Open the address printed in the terminal, usually `http://localhost:5173`. Changes to the dashboard and design system appear automatically.

Use the [recommended setup](#recommended-setup) when you need real API data or want to test sign-in.

## Run without an identity provider

For API or CLI work that does not need a real sign-in flow, you can skip `make dev-up`. OpenID Connect (OIDC) is disabled in this mode, so signing in creates a local administrator session without a password. Never use this mode in a shared or production environment.

Start the Kubernetes API and operator as described above, then run the API server with OIDC disabled:

```bash
make run-kden-api \
  API_OIDC_ENABLED=false \
  API_SESSION_COOKIE_SECURE=false \
  API_SESSION_COOKIE_SAME_SITE=SameSiteStrictMode
```

The API is available at `http://localhost:8090`.

Projects control access through role bindings. Create a project that grants access to the `local-admin` group:

```bash
kubectl apply -f - <<'EOF'
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

## Use the CLI

Build the CLI once:

```bash
make build-kden-cli
```

The `kden` command is then available on your Hermit `PATH`. For the recommended HTTPS setup, point it to the local API and sign in:

```bash
kden config set api-endpoint https://api.localhost/api
kden login
```

If you use the setup without an identity provider, the default endpoint is `http://localhost:8090/api`. You can change it with `kden config set api-endpoint <url>`.

## Optional services

Add these services only when your change needs them.

### Database-backed sessions

Sessions normally remain in memory and disappear when the API server stops. To test persistent sessions, stop the API server if it is already running. Then start the local services, apply the database migrations, and select PostgreSQL storage:

```bash
make dev-up
make dev-db-migrate
make run-kden-api API_SESSION_STORAGE_TYPE=db-pg
```

The migration command is safe to run again; it only applies missing migrations.

### Local artifact registry

Vectors, artifacts, and development container images can use the local registry:

```bash
make dev-registry
```

The registry is available at `http://localhost:5001`. Include the `http://` scheme when passing it to `kden` because the local registry does not use TLS.

### Workload identity simulator

Start the simulator only when working on workload identity:

```bash
go run ./hack/kden_local_dev/workload_id_simulator.go
```

It is then available through <https://id.localhost> while `make dev-up` is running.

## Test in a real cluster

Use the local kind cluster when changing the Helm chart, container images, RBAC, or webhook setup. Stop the local operator, API server, and lightweight Kubernetes API first. Then use a terminal where `KUBECONFIG` is not set:

```bash
unset KUBECONFIG
make dev-cluster
kubectl config use-context kind-konfidence-dev
kubectl config current-context
```

Confirm that the current context is `kind-konfidence-dev` before deploying.

Build and push the local images:

```bash
REGISTRY=localhost:5001 make docker-build docker-push docker-build-api docker-push-api
```

Generate the webhook certificates if you did not do so in the recommended setup:

```bash
make webhook-certs
```

To deploy only the operator:

```bash
REGISTRY=localhost:5001 make deploy
```

To include the API server and local sign-in, first run `make dev-up`, then deploy with:

```bash
REGISTRY=localhost:5001 \
DEPLOY_OIDC_ISSUER_URL=https://host.docker.internal \
DEPLOY_OIDC_CLIENT_ID=konfidence \
DEPLOY_OIDC_REDIRECT_URL=https://api.localhost/api/v1/auth/callback \
DEPLOY_OIDC_CLIENT_SECRET=konfidence \
DEPLOY_OIDC_ALLOWED_RETURN_HOSTS=ui.localhost \
DEPLOY_OIDC_TRUST_LOCAL_CA=1 \
make deploy
```

Check that the pods are running:

```bash
kubectl get pods -n konfidence-system
```

The operator pod, and the API server pod if you deployed it, should show `Running`.

If you deployed the API server, forward its port to reach it from your computer:

```bash
kubectl -n konfidence-system port-forward svc/konfidence-api 8090:8090
```

Leave the port-forward running. In another terminal, run `curl http://localhost:8090/healthz`. The response should be `{"status":"ok"}`.

## Test a deployer

Deployers live in separate repositories. For the Kubernetes deployer, clone [`kubernetes-landscape-orchestrator`](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) next to the `konfidence` repository and follow its [local development steps](https://github.com/konfidence-project/kubernetes-landscape-orchestrator/blob/main/README.md#local-development). They use the kind cluster and registry from the previous section.

From the deployer repository, check that its pod is running:

```bash
kubectl get pods -l app.kubernetes.io/name=kubernetes-landscape-orchestrator
```

The pod should reach `1/1 Running`. For the deployer's supported resources and configuration, see [Install the Kubernetes deployer](../deploy-operate/install/deployer/kubernetes.md).

## Stop the local setup

Stop the operator, API server, dashboard, and lightweight Kubernetes API with `Ctrl`+`C` in their terminals.

Stop the Docker services but keep their data:

```bash
make dev-down
```

To also delete the containers and stored data, including the local PostgreSQL database, run:

```bash
make dev-reset
```

If you deployed to the kind cluster, use a terminal with `KUBECONFIG` unset. Select and check its context before removing the Helm release:

```bash
unset KUBECONFIG
kubectl config use-context kind-konfidence-dev
kubectl config current-context
make undeploy
```

Then delete the kind cluster and local registry:

```bash
make dev-cluster-down
```

These commands do not delete the certificates in `local/certs` or remove the local certificate authority from your trust store. Locally built container images and webhook files in `/tmp/k8s-webhook-server/serving-certs` also remain.

## Troubleshooting

**The browser does not trust a local HTTPS address.** Run `make dev-certs` and restart the browser. This restores trust in the local certificate authority and reuses existing certificates. If the certificate files were copied from another computer, stop the local services, delete the files in `local/certs`, and run `make dev-up` to generate new certificates. Browsers with a separate certificate store may require you to trust the local certificate authority there too.

**The API server reports that port 8090 is already in use.** Another API server is still running. Stop it before starting a new one.

**The dashboard returns to the sign-in page after login.** Make sure `make dev-up`, `make run-kden-api`, and `make dev-ui` are all running. Delete cookies for `ui.localhost` and `api.localhost`, then sign in again.

**PostgreSQL rejects the local credentials.** Run `make dev-reset`, then `make dev-up`. Resetting removes the local database data.

**`make dev-kube-apiserver` cannot find its Kubernetes binaries.** Run `make setup-envtest`, then retry.

**The wrong cluster receives a deployment.** Run `kubectl config current-context`. For the local kind cluster, select it with `kubectl config use-context kind-konfidence-dev`.

## Related information

- The [`konfidence` README](https://github.com/konfidence-project/konfidence#dashboard-development) lists dashboard checks and tests.
- The [`example-app`](https://github.com/konfidence-project/example-app) repository demonstrates a complete multi-service application.
