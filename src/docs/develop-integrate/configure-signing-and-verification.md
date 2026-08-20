---
title: Configure signing and verification
description: Set up cryptographic signing and verification across the Konfidence delivery pipeline — from artifact signing through VectorAssembly, Promotion, and VectorDeployment.
---

# Configure signing and verification

This guide explains how to configure cryptographic signing and verification across the Konfidence delivery pipeline — from pushing a signed artifact through to verified deployment. Every phase is opt-in; enable only the ones you need.

## Prerequisites

- A running Kubernetes cluster with Konfidence CRDs installed
- An OCI registry
- An RSA key pair for artifact signing and a separate RSA key pair for vector signing
- The `kden` CLI installed
- For background on how credential resolution works, see the [OCM credential system concepts](https://ocm.software/docs/concepts/credential-system/)

## How signing flows through the pipeline

<DrawioDiagram src="/assets/diagrams/signing-and-verification-flow.drawio" />

## Create credential Secrets

Store key material and OCI registry auth in Kubernetes Secrets, then reference them via `spec.credentials.ocm.refs`. Konfidence merges all listed Secrets into a single credential graph — see [OCM credential resolution](https://ocm.software/docs/tutorials/understand-credential-resolution/) for how identity matching works.

> Secrets must live in the **same namespace as the CR** that references them.

**Option A — everything in one Secret:**

```bash
kubectl apply -n <cr-namespace> -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: my-creds
  namespace: <cr-namespace>
stringData:
  .ocmconfig: |
    type: generic.config.ocm.software/v1
    configurations:
      - type: credentials.config.ocm.software/v1
        consumers:
          - identities:
              - type: RSA/v1alpha1
                signature: my-artifact-sig
                algorithm: RSASSA-PSS
            credentials:
              - type: RSACredentials/v1
                privateKeyPEM: |
                  -----BEGIN RSA PRIVATE KEY-----
                  <base64-encoded artifact signing key>
                  -----END RSA PRIVATE KEY-----
                publicKeyPEM: |
                  -----BEGIN CERTIFICATE-----
                  <base64-encoded artifact signing cert>
                  -----END CERTIFICATE-----
          - identities:
              - type: RSA/v1alpha1
                signature: my-vector-sig
                algorithm: RSASSA-PSS
            credentials:
              - type: RSACredentials/v1
                privateKeyPEM: |
                  -----BEGIN RSA PRIVATE KEY-----
                  <base64-encoded vector signing key>
                  -----END RSA PRIVATE KEY-----
                publicKeyPEM: |
                  -----BEGIN CERTIFICATE-----
                  <base64-encoded vector signing cert>
                  -----END CERTIFICATE-----
          - identities:
              - type: OCIRegistry
                hostname: registry.example.com
            credentials:
              - type: Credentials/v1
                properties:
                  username: konfidence
                  password: <password>
EOF
```

Reference it in the CR:

```yaml
credentials:
  ocm:
    refs:
      - name: my-creds
```

**Option B — separate Secrets per concern:**

```bash
# Signing keys
kubectl apply -n <cr-namespace> -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: my-signing-creds
  namespace: <cr-namespace>
stringData:
  .ocmconfig: |
    type: generic.config.ocm.software/v1
    configurations:
      - type: credentials.config.ocm.software/v1
        consumers:
          - identities:
              - type: RSA/v1alpha1
                signature: my-artifact-sig
                algorithm: RSASSA-PSS
            credentials:
              - type: RSACredentials/v1
                privateKeyPEM: |
                  -----BEGIN RSA PRIVATE KEY-----
                  <base64-encoded artifact signing key>
                  -----END RSA PRIVATE KEY-----
                publicKeyPEM: |
                  -----BEGIN CERTIFICATE-----
                  <base64-encoded artifact signing cert>
                  -----END CERTIFICATE-----
          - identities:
              - type: RSA/v1alpha1
                signature: my-vector-sig
                algorithm: RSASSA-PSS
            credentials:
              - type: RSACredentials/v1
                privateKeyPEM: |
                  -----BEGIN RSA PRIVATE KEY-----
                  <base64-encoded vector signing key>
                  -----END RSA PRIVATE KEY-----
                publicKeyPEM: |
                  -----BEGIN CERTIFICATE-----
                  <base64-encoded vector signing cert>
                  -----END CERTIFICATE-----
EOF

# OCI registry credentials
kubectl apply -n <cr-namespace> -f - <<'EOF'
apiVersion: v1
kind: Secret
metadata:
  name: my-registry-creds
  namespace: <cr-namespace>
type: kubernetes.io/dockerconfigjson
stringData:
  .dockerconfigjson: |
    {
      "auths": {
        "registry.example.com": {
          "username": "konfidence",
          "password": "<password>"
        }
      }
    }
EOF
```

Reference both in the CR:

```yaml
credentials:
  ocm:
    refs:
      - name: my-signing-creds
      - name: my-registry-creds
```

## Push, sign, and alias artifacts

Before VectorAssembly can verify an artifact, it must carry a signature. Run these steps locally or in CI — see [Publish Artifacts](./publish-artifacts.md) for the full artifact publishing workflow.

**Push** an artifact constructor YAML to the registry:

```bash
kden artifact push \
  --registry registry.example.com \
  --file my-artifact.yaml
```

`my-artifact.yaml` is an OCM component constructor. The `version` must be semver. The resource type must be `cloud.konfidence.artifact.manifest` with a `file/v1` input:

```yaml
# my-artifact.yaml
components:
  - name: konfidence.io/payment-hub
    version: 1.0.0
    provider:
      name: konfidence.io
    resources:
      - name: manifest
        type: cloud.konfidence.artifact.manifest
        input:
          type: file/v1
          path: artifact-manifest.json
```

The file at `input.path` must be valid JSON:

```json
{"type": "cloud.konfidence.flux.helm", "allowReuse": true}
```

**Sign** the pushed component. The ref must use the semver version, not an alias:

```bash
kden artifact sign \
  registry.example.com//konfidence.io/payment-hub:1.0.0 \
  --signer-spec signer-spec.yaml \
  --signature-name my-artifact-sig
```

`signer-spec.yaml` selects the algorithm and encoding:

```yaml
type: RSASigningConfiguration/v1alpha1
signatureAlgorithm: RSASSA-PSS
signatureEncodingPolicy: PEM
```

> Use `PEM` encoding — controllers verify against `application/x-pem-file` by default. See [OCM signing concepts](https://ocm.software/docs/concepts/signing-and-verification/) for other encoding options.

**Alias** a mutable tag to the signed version. Signing creates a new manifest digest, so re-run this after every sign:

```bash
kden artifact alias registry.example.com//konfidence.io/payment-hub:1.0.0 edge
```

**CLI credentials** are loaded from `~/.ocmconfig`:

```yaml
# ~/.ocmconfig
type: generic.config.ocm.software/v1
configurations:
  - type: credentials.config.ocm.software/v1
    consumers:
      - identities:
          - type: RSA/v1alpha1
            signature: my-artifact-sig
            algorithm: RSASSA-PSS
        credentials:
          - type: Credentials/v1
            properties:
              privateKeyPEMFile: /home/user/.keys/signing-key.pem
              publicKeyPEMFile: /home/user/.keys/signing-cert.pem
      - identities:
          - type: OCIRegistry
            hostname: registry.example.com
        credentials:
          - type: Credentials/v1
            properties:
              username: konfidence
              password: <password>
```

> The CLI uses `Credentials/v1` with `properties` for RSA key material; Kubernetes Secrets use `RSACredentials/v1` directly. See [OCM credential resolution](https://ocm.software/docs/tutorials/understand-credential-resolution/).

## Configure VectorAssembly signing and verification

```bash
kubectl apply -n <cr-namespace> -f - <<'EOF'
apiVersion: konfidence.cloud/v1alpha1
kind: VectorTemplate
metadata:
  name: my-vector
  namespace: <cr-namespace>
spec:
  uploadTarget: registry.example.com//konfidence.io/my-app/vector
  components:
    - name: registry.example.com//konfidence.io/my-app/backend:stable
    - name: registry.example.com//konfidence.io/my-app/frontend:stable

  credentials:
    ocm:
      refs:
        - name: my-signing-creds
        - name: my-registry-creds

  # Verify every listed artifact carries this signature before assembling.
  verifyArtifacts:
    signatures:
      - name: my-artifact-sig

  # Sign the assembled vector with this key.
  signVector:
    signatures:
      - name: my-vector-sig

  # Verify the existing base vector before inheriting its artifacts.
  # verifyVector:
  #   signatures:
  #     - name: my-vector-sig
EOF
```

Any verification or signing failure stops the reconcile. Check `kubectl describe vectortemplate my-vector` for the condition and attached event.

Verify the assembly succeeded:

```bash
kubectl get vectortemplate my-vector -n <cr-namespace> -o jsonpath='{.status.conditions}'
```

A healthy assembly shows `type: Ready`, `status: True` — with `reason: VectorCreated` on the first reconcile and `reason: NoDriftDetected` on subsequent ones.

## Promotions do not verify

A promotion re-points a target stage at a vector version that already exists in the registry. It never rebuilds, re-signs, or transfers OCM content, so there is nothing to verify and no registry access to authenticate at promotion time. `VectorPromotionConfig` and `VectorPromotion` therefore carry no `credentials`, `signVector`, or `verifyVector` fields.

Verification still guards both ends of every promotion chain:

- **At assembly** — the `VectorTemplate` verifies its artifacts (and optionally its base vector) and signs the assembled vector, as shown above.
- **At deployment** — the `VectorDeployment` controller re-verifies the vector and its artifacts before rollout, as shown below.

Because the selected vector was signed at assembly and is re-verified at deployment, moving it between stages needs no additional signature check.

## Configure VectorDeployment verification

The VectorDeployment controller reads its crypto configuration from environment variables on the operator pod — not from the CRD:

```bash
kubectl set env deployment/<operator-deployment> \
  KONFIDENCE_DEPLOYMENT_VECTOR_SIGNATURES=my-vector-sig \
  KONFIDENCE_DEPLOYMENT_ARTIFACT_SIGNATURES=my-artifact-sig \
  KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAME=my-signing-creds \
  KONFIDENCE_DEPLOYMENT_CREDENTIALS_SECRET_NAMESPACE=<operator-namespace> \
  -n <operator-namespace>
```

Verify the env vars are set and the operator pod has restarted:

```bash
kubectl rollout status deployment/<operator-deployment> -n <operator-namespace>
kubectl set env deployment/<operator-deployment> --list -n <operator-namespace> | grep KONFIDENCE_DEPLOYMENT
```

## Pin signature parameters

Add optional fields to any `Signature` entry to pin exact algorithm parameters:

```yaml
verifyVector:
  signatures:
    - name: my-vector-sig
      algorithm: RSASSA-PSS
      hashAlgorithm: SHA-256
      normalisationAlgorithm: jsonNormalisation/v4alpha1
      signatureMediaType: application/x-pem-file
      issuer: "CN=konfidence-signer,O=Example Corp"
```

All fields are optional besides `name`. For valid values see [OCM signing and verification concepts](https://ocm.software/docs/concepts/signing-and-verification/).

## Default behaviors when fields are omitted

| Omitted field | Effect |
|---|---|
| `verifyArtifacts`, `verifyVector`, or `signVector` block | That check is skipped entirely; the pipeline proceeds without it |
| RSA key material missing from credential Secret — verify | Falls back to system root trust store; CA-issued signatures pass, self-signed or internal keys fail |
| RSA key material missing from credential Secret — sign | Fails immediately; a private key is always required |

## Troubleshooting

| Symptom | Likely cause | Where to look |
|---|---|---|
| VectorTemplate `Ready=Unknown`, reason `DriftDetectionFailed` | Credential Secret missing, wrong key name, or not in same namespace | `kubectl describe vectortemplate <name>` → Events |
| VectorDeployment `VectorDownloaded` never `True` | Env vars not set or credential Secret not found | `kubectl logs deployment/<operator-deployment> -n <operator-namespace>` |
| `algorithm` pin rejection | Signed with `RSASSA-PKCS1-V1_5` but CRD pins `RSASSA-PSS` | Align `algorithm` in Secret consumer identity and CRD `Signature` entry |

## Next steps

- [Build vectors](./observe-improve/build-vectors.md)
- [Define promotions](./observe-improve/define-promotions.md)
- [Stages and Promotions — security boundaries](../core-concepts/stages-and-promotions.md)
