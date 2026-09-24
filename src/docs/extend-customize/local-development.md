---
title: "Local development"
description: "Run Konfidence locally while you change it: an envtest apiserver on your host, and a registry, identity provider, kind cluster or deployer when your change needs them."
editLink: true
lastUpdated: true
---

# Local development

This page is for contributors to the [`konfidence`](https://github.com/konfidence-project/konfidence) repository. To try Konfidence without changing it, follow the [Quickstart](../getting-started/quickstart.md) instead.

What you need depends on what your change touches:

| You are changing | You need |
| --- | --- |
| Controller logic, API handlers, the CLI, the dashboard | A Kubernetes API with the Konfidence CRDs. envtest provides one on your host. |
| [Vector](../reference/glossary.md#vector) or [artifact](../reference/glossary.md#artifact) handling, image builds | The above plus a local OCI registry |
| Login and sessions | The above plus a local identity provider |
| The Helm chart, Dockerfiles, RBAC or webhook wiring | A kind cluster with the registry |
| End-to-end delivery into workloads | The cluster plus a [deployer](../reference/glossary.md#deployer) |

## Prerequisites

- A clone of the `konfidence` repository.
- Docker running, for the registry, the identity provider and kind. Another container tool works if you set `CONTAINER_TOOL`, for example `CONTAINER_TOOL=podman`.
- Hermit activated in your shell. It provides every other tool, including `go`, `kind`, `kubectl`, `helm` and `mkcert`:

  ```bash
  source ./bin/activate-hermit
  ```

Run every command on this page from the repository root with Hermit active. `make help` lists all targets. The first `make` target you run downloads the pinned tools and regenerates manifests. Expect a minute of output before anything else happens.

## Kubernetes API

The operator, the API server and `kden` read and write custom resources and need nothing else from a cluster. A bare API server is enough, and [envtest](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest) starts one on your host with the Konfidence CRDs installed. `make test-operators` uses the same binaries:

```bash
make dev-apiserver
```

Once the generators are done it prints an `export KUBECONFIG=...` line. Paste that line into every other terminal you use for the steps below and leave the apiserver running. The variable is per terminal; a new tab needs it again. `Ctrl`+`C` stops it.

Verify the CRDs are present:

```bash
kubectl get crds | grep konfidence
```

You should see the Konfidence CRDs, such as `landscapes.konfidence.cloud` and `artifactdeployments.konfidence.cloud`.

Now run the operator and the API server on your host. Both regenerate manifests and run `go fmt` and `go vet` on every start, which takes about half a minute.

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

   OIDC is off by default. See [No-auth mode](#no-auth-mode) for what that means.

4. Verify the API server answers:

   ```bash
   curl http://localhost:8090/healthz
   ```

   The expected response is `{"status":"ok"}`.

5. Build the `kden` CLI once:

   ```bash
   make build-kden-cli
   ```

   The binary lands in `bin/kden`, which Hermit has on your `PATH`. It talks to `http://localhost:8090` by default and needs no configuration for this API server. If you run the API server elsewhere, point it there with `kden config set api-endpoint <url>`.

### No-auth mode

With `API_OIDC_ENABLED=false`, the API server replaces the OIDC login with a handler that creates a session straight away. Every session carries the same static identity. The session middleware otherwise works as usual, and all endpoints, the dashboard and the CLI behave as they do with a real identity provider.

| Field  | Value         |
| ------ | ------------- |
| Name   | `Local Admin` |
| Email  | `admin@local` |
| Groups | `local-admin` |

::: warning Not for shared environments
No-auth mode disables authentication. Never run a shared or production installation with `oidc.enabled: false`.
:::

[Projects](../reference/glossary.md#project) control access through role bindings. A project is only visible to the local admin if it binds the `local-admin` group. Create one to work with:

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

Projects without that binding return empty role sets and their resources stay hidden.

Signing in works the same way everywhere. In the dashboard, click **Login** and you land on the local admin session. With the CLI, `kden login` opens the login URL in your browser and completes the callback on its own. To drive the flow with `curl`, follow the login redirect, keep the cookie it sets and use it on later requests:

```bash
curl -si "http://localhost:8090/api/v1/login?return_url=http://localhost:8090/" | grep -i location
curl -si "<the Location URL from above>" | grep -i set-cookie
curl -s http://localhost:8090/api/v1/identity -H "Cookie: kden-session=<session id from the cookie>"
```

The identity response names `Local Admin` with `my-project` under `projectRoles`. An empty `projectRoles` means the Project was not applied or lacks the `local-admin` binding. The same [role binding model](../deploy-operate/control-access/access-control.md) applies to real identity provider groups.

To serve the dashboard from the API server as in production, install the workspace dependencies and build it once, then start the API server with the build. Stop the API server from step 3 first, since both listen on port 8090:

```bash
pnpm install
pnpm ui:build
API_UI_ASSET_PATH=apps/konfidence-ui/build make run-kden-api
```

For dashboard work itself, run the dev server and point its API proxy at the API server from step 3:

```bash
KONFIDENCE_API_URL=http://127.0.0.1:8090 pnpm ui:dev
```

Open the printed URL, usually `http://localhost:5173`, and sign in. With OIDC off you land on the local admin session without a password. Without `KONFIDENCE_API_URL` the proxy targets the mock API on port 8091, which `pnpm ui:dev:mock` starts together with the dashboard when you want no Kubernetes at all. The design system is a workspace package that the dashboard imports from source; changes to it show up live in the same dev server. See the [`konfidence` README](https://github.com/konfidence-project/konfidence#dashboard-development).

::: tip Any cluster works
If you already have a cluster, point `KUBECONFIG` at it and install the CRDs with `make install`. Everything else on this page is the same.
:::

## Artifact store

Vectors and artifacts are OCI objects, and so are the container images. Start a local registry at `localhost:5001`:

```bash
make dev-registry
```

A vector is pushed from a constructor file that lists its components and resources. Create a minimal one under `.tmp`, which git ignores, together with the config file it references:

```bash
mkdir -p .tmp/demo-vector
echo '{"description": "demo vector for local development"}' > .tmp/demo-vector/vector-config.json
cat > .tmp/demo-vector/vector-constructor.yaml <<'EOF'
components:
  - name: example.com/demo/vector
    version: 0.1.0
    provider:
      name: konfidence
    resources:
      - name: cloud-konfidence-vector-config
        type: json
        version: 0.1.0
        relation: local
        input:
          type: file/v1
          path: ./vector-config.json
EOF
```

Push it with `kden`. The constructor's file paths are relative to the working directory, so the command runs in a subshell inside that directory. The registry speaks plain HTTP and `kden` assumes HTTPS, hence the explicit scheme. The path after the port names the repository the vector goes into:

```bash
(cd .tmp/demo-vector && kden vector push --file vector-constructor.yaml --registry=http://localhost:5001/vectors/demo)
```

On success the command prints two log lines about missing OCM configuration and credentials and nothing else. Verify the vector is in the registry:

```bash
curl http://localhost:5001/v2/_catalog
```

The output lists `vectors/demo/component-descriptors/example.com/demo/vector`. The registry keeps its contents until `make dev-cluster-down` deletes it along with the kind cluster.

## Identity provider

Only the login flow touches an identity provider. The repository ships a Docker Compose stack with Authelia (OIDC) behind Caddy. Caddy serves the local components over HTTPS with a certificate generated by `mkcert`:

```bash
make dev-up
```

`make dev-up` runs `make dev-tls` first. It installs the local `mkcert` certificate authority in your operating system trust store and generates the certificate under `local/tls/`, which Git ignores. The first run may ask for your password while `mkcert -install` changes the system trust store. You can regenerate the certificate or repair the trust-store installation at any time:

```bash
make dev-tls
```

The stack exposes these trusted HTTPS endpoints:

- `https://ui.localhost` for the Vite dashboard
- `https://api.localhost` for the API server
- `https://auth.localhost` for Authelia
- `https://id.localhost` for the workload identity simulator

Start the API server with OIDC on. Stop the one from step 3 first; it also listens on port 8090:

```bash
API_OIDC_ENABLED=true make run-kden-api
```

For dashboard work, start Vite in another terminal and open `https://ui.localhost`. Caddy sends `/api/*` requests directly to the API and all other requests to Vite, keeping the UI and its session cookie on one origin. The target binds Vite to the host interfaces so the Dockerized proxy can reach it; the regular `pnpm ui:dev` command remains loopback-only:

```bash
make dev-ui
```

`make dev-logs` tails the stack's logs until you press `Ctrl`+`C`. `make dev-down` stops the stack and keeps its data. `make dev-reset` stops it and deletes the data.

The stack also starts Postgres. Sessions default to in-memory storage; you need Postgres when you work on session storage itself. Apply the API server's migrations once, then start the API server in database mode. Stop the API server from step 3 first; it also listens on port 8090:

```bash
make dev-db-migrate
API_SESSION_STORAGE_TYPE=db-pg make run-kden-api
```

`make dev-db-migrate` can be rerun; it applies whatever migrations are missing. The connection string defaults to the compose credentials and can be overridden with `API_DB_CONNECTION`.

## Real cluster

Use a kind cluster when your change concerns how Konfidence runs inside a cluster: the Helm chart, the Dockerfiles, RBAC or the webhook wiring. Stop `make dev-apiserver`, `make run` and `make run-kden-api` first, and use a terminal without the envtest `KUBECONFIG`. kind writes its context into whatever `KUBECONFIG` points at, and every `make dev-apiserver` rewrites the envtest file. `make dev-cluster` therefore refuses to run while it's set.

1. Create the cluster. It is wired to the local registry and starts it if needed. Your `kubectl` context switches to `kind-konfidence-dev`:

   ```bash
   make dev-cluster
   ```

2. Build the images and push them to the registry. These targets cross-compile for Linux and work on macOS and Linux hosts alike:

   ```bash
   REGISTRY=localhost:5001 make docker-build docker-push docker-build-api docker-push-api
   ```

3. Deploy the operator. `make deploy` reuses the webhook certificates from `make webhook-certs`. Run that once if you haven't:

   ```bash
   REGISTRY=localhost:5001 make deploy
   ```

4. Or deploy the operator and the API server together. Running this after step 3 upgrades the release in place. The API server pod needs the identity provider from `make dev-up` wired in, and the values below match the compose stack:

   ```bash
   REGISTRY=localhost:5001 \
   DEPLOY_OIDC_ISSUER_URL=https://host.docker.internal \
   DEPLOY_OIDC_CLIENT_ID=konfidence \
   DEPLOY_OIDC_REDIRECT_URL=https://ui.localhost/api/v1/auth/callback \
   DEPLOY_OIDC_CLIENT_SECRET=konfidence-local-secret \
   DEPLOY_OIDC_ALLOW_RETURN_URLS=https://ui.localhost/ \
   DEPLOY_OIDC_TRUST_LOCAL_CA=1 \
   make deploy
   ```

   The issuer is `host.docker.internal` because the pod talks to Authelia on your host. `make deploy` rewrites the browser-facing URLs to `auth.localhost` and mounts the local `mkcert` CA into the pod so it trusts Authelia's certificate. On Linux, where that hostname does not exist, it also adds a host alias pointing at the kind node's gateway.

5. Verify the pods are running:

   ```bash
   kubectl get pods -n konfidence-system
   ```

   Both `konfidence` and `konfidence-api` should reach `1/1 Running`.

6. To call the in-cluster API server from your host, forward its service and check the health endpoint:

   ```bash
   kubectl -n konfidence-system port-forward svc/konfidence-api 8090:8090
   curl http://localhost:8090/healthz
   ```

   Browser logins from this deployment redirect to `https://auth.localhost`, which the compose stack serves.

To remove the deployment, run `make undeploy`. To delete the cluster and the registry, run `make dev-cluster-down`.

## Deployer

The Konfidence operator records what should be deployed. Turning that into running workloads is the job of a deployer, which lives in its own repository and installs its own prerequisites. For the [Kubernetes deployer](../deploy-operate/install/deployer/kubernetes.md), clone [`kubernetes-landscape-orchestrator`](https://github.com/konfidence-project/kubernetes-landscape-orchestrator) next to your `konfidence` clone and run, from its root with its Hermit active:

```bash
make install-deps
make install-konfidence-crds
REGISTRY=localhost:5001 make docker-build docker-push dev-install
```

The first target installs Gateway API and Flux into the kind cluster. The second installs the Konfidence CRDs from the sibling clone, which the deployer's controllers need before they start; it skips the install when the CRDs are already present, for example after `make deploy` in `konfidence`. The last line builds the deployer image for your host's architecture, pushes it to the local registry and installs the chart with it.

The chart installs into your current namespace, normally `default`. Verify the deployer is running:

```bash
kubectl get pods -l app.kubernetes.io/name=kubernetes-landscape-orchestrator
```

The pod should reach `1/1 Running`.

## Tear everything down

```bash
make undeploy
make dev-cluster-down
make dev-reset
```

Stop `make dev-apiserver` with `Ctrl`+`C`. If it was killed hard instead, its `etcd` and `kube-apiserver` processes can survive it. Find and stop them with `pkill -f kube-apiserver` and `pkill -f etcd`. The built images in your container tool and the webhook certificates under `/tmp/k8s-webhook-server` are left in place.

## Troubleshooting

**`make dev-apiserver` exits with `is KUBEBUILDER_ASSETS set?`.** The envtest binaries for the configured Kubernetes version are missing. Run `make setup-envtest` and retry.

**`make run-kden-api` fails with `address already in use`.** Another API server is still listening on port 8090, usually the one from step 3. Stop it first.

**`make deploy` fails with `spec.selector` is immutable.** A `konfidence` Deployment from an older chart version is still in the cluster. Delete it and rerun the command:

```bash
kubectl delete deployment konfidence -n konfidence-system
```

**`kden` reports a TLS error when pushing to `localhost:5001`.** The `--registry` value is missing its `http://` scheme. See [Artifact store](#artifact-store).

**The API server can't verify Authelia's certificate on your host.** This only happens with `API_OIDC_ENABLED=true`. Run `make dev-tls` to reinstall the local `mkcert` CA and regenerate the certificate, then restart the API server.

**A deployer logs `no matches for kind` errors.** It started before the Konfidence CRDs existed. Install the CRDs and restart the deployer.

## Related information

- The [`konfidence` README](https://github.com/konfidence-project/konfidence#dashboard-development) covers developing the dashboard with `pnpm`.
- The [`example-app`](https://github.com/konfidence-project/example-app) repository deploys a complete multi-service application through a released Konfidence build.
