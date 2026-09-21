---
title: Grant CI pipelines access
description: Bind a project role to the OIDC identity of a CI workflow, so the pipeline needs no stored credential.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Grant CI pipelines access

Bind a project role to the OpenID Connect (OIDC) identity of a CI workflow. The workflow then calls the Konfidence API with the short-lived token its identity provider issues. No password or service account token is stored in the pipeline. The steps are the same for GitHub Actions, GitLab.com, and SPIRE. Pick your provider in the tabs.

## Prerequisites

- A [project](./projects.md) and the `admin` role in it, or `kubectl` access to edit `Project` resources.
- The API is reachable from the CI runners over HTTPS. See [Expose the API](./expose-api.md).
- The public URL of the API, for example `https://konfidence.example.com/api`.
- The identity the provider gives the workflow:

| Provider | Identity | Discovery endpoint |
|----------|----------|--------------------|
| GitHub Actions | Repository and branch, for example `my-org/my-repo` on `main` | `https://token.actions.githubusercontent.com/.well-known/openid-configuration` |
| GitLab.com | Project path and branch, for example `my-group/my-project` on `main` | `https://gitlab.com/.well-known/openid-configuration` |
| SPIRE | The SPIFFE ID SPIRE assigns to the workload, for example `spiffe://example.org/ci/release-runner` | The URL of your SPIRE OIDC Discovery Provider, for example `https://oidc.spire.example.com/.well-known/openid-configuration` |

## Choose the role

| Pipeline task | Role |
|---------------|------|
| Read deployment status, list vectors and promotions | `dev` |
| Approve promotions, change stage configuration | `pm` |

`admin` grants control over role bindings. Do not bind it to a pipeline. [Grant roles](./access-control.md) lists every permission.

## Choose the audience

The token's `aud` claim must equal the `audience` in the binding. Use the public API URL as the audience. A token minted for another service then fails at Konfidence, and a Konfidence token fails elsewhere.

## Add the binding to the project

Add a `jwks` subject to the role. All listed claims must match. A `*` matches any run of characters.

::: code-group

```bash [GitHub Actions]
kubectl patch project ecommerce-platform --type=merge --patch '
spec:
  roleBindings:
    pm:
      - jwks:
          endpoint: https://token.actions.githubusercontent.com/.well-known/openid-configuration
          audience: https://konfidence.example.com/api
          claims:
            sub: repo:my-org/my-repo:*
            ref: refs/heads/main
'
```

```bash [GitLab.com]
kubectl patch project ecommerce-platform --type=merge --patch '
spec:
  roleBindings:
    pm:
      - jwks:
          endpoint: https://gitlab.com/.well-known/openid-configuration
          audience: https://konfidence.example.com/api
          claims:
            project_path: my-group/my-project
            ref: main
'
```

```bash [SPIRE]
kubectl patch project ecommerce-platform --type=merge --patch '
spec:
  roleBindings:
    pm:
      - jwks:
          endpoint: https://oidc.spire.example.com/.well-known/openid-configuration
          audience: https://konfidence.example.com/api
          claims:
            sub: spiffe://example.org/ci/release-runner
'
```

:::

The GitHub `sub` claim has the form `repo:<OWNER>/<REPO>:<CONTEXT>`, so `repo:my-org/my-repo:*` covers every workflow and environment of the repository. GitLab puts the project path and the branch into separate claims. SPIRE puts the SPIFFE ID into `sub`.

::: warning A merge patch replaces the whole role
`kubectl patch --type=merge` replaces the list of subjects for the `pm` role. Include the existing subjects in the patch, or use `kubectl edit project ecommerce-platform`.
:::

## Verify the binding

Read the role bindings back:

```bash
kubectl get project ecommerce-platform \
  --output=jsonpath='{.spec.roleBindings.pm}{"\n"}'
```

The output contains the `jwks` subject. The API server contacts the endpoint only when a token arrives, so run a pipeline to test the full path.

## Request the token in the pipeline

The pipeline requests a token for the audience and hands it to `kden` through the `KDEN_ACCESS_TOKEN` environment variable. `kden` reads the API address from `KDEN_API_ENDPOINT`.

::: code-group

```yaml [GitHub Actions]
permissions:
  id-token: write
  contents: read

jobs:
  list-promotions:
    runs-on: ubuntu-latest
    env:
      KDEN_API_ENDPOINT: https://konfidence.example.com/api
    steps:
      - name: Request Konfidence token
        run: |
          TOKEN=$(curl --silent \
            --header "Authorization: Bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=https://konfidence.example.com/api" \
            | jq --raw-output .value)
          echo "::add-mask::$TOKEN"
          echo "KDEN_ACCESS_TOKEN=$TOKEN" >> "$GITHUB_ENV"
      - name: List promotion configs
        run: kden vector-promotion list --projectId ecommerce-platform
```

```yaml [GitLab.com]
list-promotions:
  id_tokens:
    KDEN_ACCESS_TOKEN:
      aud: https://konfidence.example.com/api
  variables:
    KDEN_API_ENDPOINT: https://konfidence.example.com/api
  script:
    - kden vector-promotion list --projectId ecommerce-platform
```

```bash [SPIRE]
export KDEN_API_ENDPOINT=https://konfidence.example.com/api
export KDEN_ACCESS_TOKEN=$(spire-agent api fetch jwt \
  -audience https://konfidence.example.com/api \
  -socketPath /run/spire/sockets/agent.sock \
  | sed -n '2p' | tr -d '[:space:]')
kden vector-promotion list --projectId ecommerce-platform
```

:::

GitLab exposes the token as the variable named under `id_tokens`, so no request step is needed. The SPIRE agent prints the SPIFFE ID on the first line and the token on the second. The workload needs a registration entry in SPIRE that assigns it the SPIFFE ID from the binding.

In every case, the last command prints the promotion configs of the project. A `401` response means no binding matched the token.

## What to do if it fails

- `401` from the API: the token did not match any binding. Decode the token and compare `aud` and each claim with the binding.
- The `Project` update is rejected with a validation error: `endpoint` must start with `https://`, and `claims` needs at least one entry.
- The token is rejected although the binding matches: the discovery endpoint must be reachable from the API server pod. For SPIRE, that is the OIDC Discovery Provider, not the agent socket.

## Next steps

- [Promote vectors](./promote-vectors.md) shows the approval the pipeline can now grant.
- [Grant roles](./access-control.md) covers session subjects for interactive users.
