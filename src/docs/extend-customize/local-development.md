---
title: "Local development"
description: "Set up a local Konfidence development environment, from an envtest apiserver on your host to a kind cluster, adding only the pieces your change needs."
editLink: true
lastUpdated: true
---

# Local development

This page explains how to run Konfidence locally while you change it. It's for contributors to the [`konfidence`](https://github.com/konfidence-project/konfidence) repository. If you want to try Konfidence rather than change it, follow the [Quickstart](../getting-started/quickstart.md) instead.

The setup is a handful of independent pieces. Which ones you need depends on how far your change has to reach before you can trust it:

| You are changing | You need |
| --- | --- |
| Controller logic, API handlers, the CLI, the dashboard | A Kubernetes API with the Konfidence CRDs. envtest provides one on your host. |
| Vector or artifact handling, image builds | The above plus a local OCI registry |
| Login and sessions | The above plus a local identity provider |
| The Helm chart, Dockerfiles, RBAC or webhooks as deployed | A real kind cluster with the registry |
| End-to-end delivery into workloads | The cluster plus a deployer |

Start with the Kubernetes API. Add a piece only when your change reaches it.

## Prerequisites

- A clone of the `konfidence` repository.
- Docker running, for the registry, the identity provider and kind. Another container tool works if you set `CONTAINER_TOOL`, for example `CONTAINER_TOOL=podman`.
- Hermit activated in your shell. It provides every other tool, including `go`, `kind`, `kubectl`, `helm` and `mkcert`:

  ```bash
  source ./bin/activate-hermit
  ```

Run every command on this page from the repository root with Hermit active. `make help` lists all targets.

## Kubernetes API

The operator, the API server and `kden` only read and write custom resources. They don't need nodes, scheduling or pods, so a bare API server is enough. [envtest](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest) starts one on your host, with the Konfidence CRDs installed:

```bash
make dev-apiserver
```

It prints an `export KUBECONFIG=...` line. Run that line in every other terminal you use for the steps below, then leave the apiserver running.

Verify the CRDs are present:

```bash
kubectl get crds | grep konfidence
```

You should see the Konfidence CRDs, such as `landscapes.konfidence.cloud` and `artifactdeployments.konfidence.cloud`.

Now run the operator and the API server on your host. They restart in seconds, which makes this the everyday loop.

1. Generate the webhook certificates once. The operator's admission webhooks need TLS, and `mkcert` creates a locally trusted certificate:

   ```bash
   make webhook-certs
   ```

2. Start the operator in one terminal:

   ```bash
   make run
   ```

3. Start the API server in a second terminal:

   ```bash
   make run-kden-api
   ```

   OIDC is off by default. The login flow still runs, but it needs no identity provider: logging in through the dashboard or `kden login` gives you a local admin session as `admin@local` in the group `local-admin`. A project is visible to that user only if one of its role bindings references that group.

4. Verify the API server answers:

   ```bash
   curl http://localhost:8090/healthz
   ```

   The expected response is `{"status":"ok"}`.

The `kden` CLI talks to `http://localhost:8090` by default, so it works against this API server without configuration. If you run the API server elsewhere, point the CLI at it with `kden config set api-endpoint <url>`. `make test-operators` uses the same envtest binaries, so the controller tests need nothing beyond this section.

To serve the dashboard from the API server as in production, build it once with `pnpm ui:build` and point the API server at the result:

```bash
API_UI_ASSET_PATH=apps/konfidence-ui/build make run-kden-api
```

For dashboard work itself, run the dev server and point its API proxy at the API server from step 3:

```bash
KONFIDENCE_API_URL=http://127.0.0.1:8090 pnpm ui:dev
```

Open the printed URL and sign in. With OIDC off you land on the local admin session without a password. Without `KONFIDENCE_API_URL` the proxy targets the mock API on port 8091, which `pnpm ui:dev:mock` starts together with the dashboard when you want no Kubernetes at all. The design system is a workspace package that the dashboard imports from source, so changes to it show up live in the same dev server. See the [`konfidence` README](https://github.com/konfidence-project/konfidence#dashboard-development).

::: tip Any cluster works
If you already have a cluster, point `KUBECONFIG` at it and install the CRDs with `make install`. Everything else on this page is the same.
:::

## Artifact store

Vectors and artifacts are OCI objects, and so are the container images. Start a local registry at `localhost:5001`:

```bash
make dev-registry
```

Push a vector to it with `kden`. The registry speaks plain HTTP, and `kden` assumes HTTPS, so give the scheme explicitly:

```bash
kden vector push --file vector.yaml --registry=http://localhost:5001/<subpath>
```

Replace `<subpath>` with any repository name, for example `vectors/demo`.

## Identity provider

Only the login flow touches an identity provider. The repository ships a Docker Compose stack with Authelia (OIDC) behind Caddy (reverse proxy with local TLS), served at `https://auth.localhost`:

```bash
make dev-up
```

Start the API server with `API_OIDC_ENABLED=true` to use it. Your operating system must trust Caddy's local certificate authority for this to work. Export the root certificate from the running Caddy container and add it to your system trust store once:

```bash
docker cp caddy:/data/caddy/pki/authorities/local/root.crt caddy-root.crt
```

On macOS, import `caddy-root.crt` into Keychain Access and mark it as trusted. The API server checks the system keychain there, not `SSL_CERT_FILE`.

To see what the stack is doing, run `make dev-logs`. To stop it, run `make dev-down`.

The stack also starts Postgres. Sessions default to in-memory storage, so it's only needed when you work on session storage itself. Apply the API server's migrations to it once, then start the API server in database mode:

```bash
make dev-db-migrate
API_SESSION_STORAGE_TYPE=db-pg make run-kden-api
```

`make dev-db-migrate` is safe to rerun and only applies migrations that are missing. The connection string defaults to the compose credentials; override it with `API_DB_CONNECTION`.

## Real cluster

Use a kind cluster when your change is about how Konfidence runs *in* a cluster: the Helm chart, the Dockerfiles, RBAC or the webhook wiring. Stop `make run` and `make run-kden-api` first, or the two copies compete for the same resources.

1. Create the cluster. It is wired to the local registry and starts it if needed. Your `kubectl` context switches to `kind-konfidence-dev`:

   ```bash
   make dev-cluster
   ```

2. Build the images and push them to the registry. These targets cross-compile for Linux, so they work on macOS and Linux hosts alike:

   ```bash
   REGISTRY=localhost:5001 make docker-build docker-push docker-build-api docker-push-api
   ```

3. Deploy the operator. `make deploy` reuses the webhook certificates from `make webhook-certs`, so run that once if you haven't:

   ```bash
   REGISTRY=localhost:5001 make deploy
   ```

4. Or deploy the operator and the API server together. The API server pod needs the identity provider from `make dev-up` wired in, and the values below match the compose stack:

   ```bash
   REGISTRY=localhost:5001 TAG=dev \
   DEPLOY_OIDC_ISSUER_URL=https://host.docker.internal \
   DEPLOY_OIDC_CLIENT_ID=konfidence \
   DEPLOY_OIDC_REDIRECT_URL=https://api.localhost/api/v1/auth/callback \
   DEPLOY_OIDC_CLIENT_SECRET=konfidence-local-secret \
   DEPLOY_OIDC_ALLOW_RETURN_URLS=https://api.localhost \
   DEPLOY_OIDC_TRUST_CADDY_CA=1 \
   make deploy
   ```

   The issuer is `host.docker.internal` because the pod has to reach Authelia on your host. `make deploy` takes care of the rest: it rewrites the browser-facing URLs to `auth.localhost` and mounts Caddy's local CA into the pod so it trusts Authelia's certificate.

5. Verify the pods are running:

   ```bash
   kubectl get pods -n konfidence-system
   ```

   Both `konfidence` and `konfidence-api` should reach `1/1 Running`.

To remove the deployment, run `make undeploy`. To delete the cluster and the registry, run `make dev-cluster-down`.

## Deployer

The Konfidence operator records what should be deployed. Turning that into running workloads is the job of a deployer, which lives in its own repository and installs its own prerequisites. For the [Kubernetes deployer](../develop-integrate/deployers/kubernetes.md), clone [`kubernetes-landscape-orchestrator`](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) next to your `konfidence` clone and run, from its root with its Hermit active:

```bash
make install-deps
make install-konfidence-crds
REGISTRY=localhost:5001 make docker-build docker-push dev-install
```

The first target installs Gateway API and Flux into the kind cluster. The second installs the Konfidence CRDs from the sibling clone, which the deployer's controllers need before they start. It does nothing if the CRDs are already there, for example after `make deploy` or `make install` in `konfidence`. The last line builds the deployer image for your host's architecture, pushes it to the local registry and installs the chart with it.

Verify the deployer is running:

```bash
kubectl get pods -l app.kubernetes.io/name=kubernetes-landscape-orchestrator
```

The pod should reach `1/1 Running`.

## Tear everything down

```bash
make undeploy
make dev-cluster-down
make dev-down
```

Stop `make dev-apiserver` with `Ctrl`+`C`. If it was killed hard instead, its `etcd` and `kube-apiserver` processes can survive it. Find and stop them with `pkill -f kube-apiserver` and `pkill -f etcd`.

## Troubleshooting

**`make dev-apiserver` exits with `is KUBEBUILDER_ASSETS set?`.** The envtest binaries for the configured Kubernetes version are missing. Run `make setup-envtest` and retry.

**`make deploy` fails with `spec.selector` is immutable.** A `konfidence` Deployment from an older chart version is still in the cluster. Delete it and rerun the command:

```bash
kubectl delete deployment konfidence -n konfidence-system
```

**`kden` reports a TLS error when pushing to `localhost:5001`.** The `--registry` value is missing its `http://` scheme. See [Artifact store](#artifact-store).

**The API server can't verify Authelia's certificate on your host.** This only happens with `API_OIDC_ENABLED=true`. Trust Caddy's CA in your operating system, as described in [Identity provider](#identity-provider).

**A deployer logs `no matches for kind` errors.** It started before the Konfidence CRDs existed. Install the CRDs and restart the deployer.

## Related information

- The [`konfidence` README](https://github.com/konfidence-project/konfidence#dashboard-development) covers developing the dashboard with `pnpm`.
- The [`example-app`](https://github.com/konfidence-project/example-app) repository deploys a complete multi-service application through a released Konfidence build.
