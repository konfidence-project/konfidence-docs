---
title: Configure signing and verification
description: Sign published application artifacts and configure artifact verification and vector signing during assembly.
outline: deep
editLink: true
lastUpdated: true
---

# Configure signing and verification

<!--
Content type (Diátaxis): How-to guide.
Audience: Application developers.
User job: Sign published artifacts and configure their verification and vector
signing in a VectorTemplate, then check that assembly succeeds.
-->

Use this guide when your application requires signed artifacts and vectors.
You will sign published artifacts, configure artifact verification and vector signing in a `VectorTemplate`, and check that assembly succeeds.

## Prerequisites

Before you begin, make sure you have:

- A running Kubernetes cluster with Konfidence custom resource definitions (CRDs) installed.
- The `kden` and `kubectl` command-line tools.
- Published application artifacts in an Open Container Initiative (OCI) registry. Follow [Publish artifacts](./publish-artifacts.md) to create and publish their Open Component Model (OCM) component versions.
- The registry address and credentials for accessing your artifacts and uploading the vector.
- An RSA key pair for artifact signing and a separate RSA key pair for vector signing.
- The namespace in which you will configure the credential Secrets and `VectorTemplate`.

The artifact-signing example uses `payment-hub:1.0.0` and the alias `edge`.
The separate assembly example uses `backend:stable` and `frontend:stable`.
Adapt each example to your own artifacts and replace the registry addresses, key paths, key material, and namespace placeholders before using it.

## Configure CLI credentials

Configure the CLI credentials before you sign an artifact.
The CLI loads them from `~/.ocmconfig`.
Use the following configuration to supply your artifact-signing key and registry credentials:

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

The CLI uses `Credentials/v1` with `properties` for RSA key material.
The Kubernetes Secrets used later in this guide use `RSACredentials/v1` directly.
For background, see [OCM credential resolution](https://ocm.software/docs/tutorials/understand-credential-resolution/).

## Sign the published artifact

Before assembly can verify an artifact, the artifact must carry a signature.
Run these steps locally or in your continuous integration (CI) pipeline.

1. Create `signer-spec.yaml` to select the algorithm and encoding:

   ```yaml
   type: RSASigningConfiguration/v1alpha1
   signatureAlgorithm: RSASSA-PSS
   signatureEncodingPolicy: PEM
   ```

   Use `PEM` encoding. Controllers verify against `application/x-pem-file` by default.
   For other encoding options, see [OCM signing and verification concepts](https://ocm.software/docs/concepts/signing-and-verification/).

2. Sign the published component version. Use its semantic version, not an alias:

   ```bash
   kden artifact sign \
     registry.example.com//konfidence.io/payment-hub:1.0.0 \
     --signer-spec signer-spec.yaml \
     --signature-name my-artifact-sig
   ```

## Optional: Update the artifact alias

If you use a mutable alias, point it to the signed component version.
Signing creates a new manifest digest, so repeat this command after every sign:

```bash
kden artifact alias registry.example.com//konfidence.io/payment-hub:1.0.0 edge
```

## Create credential Secrets for assembly

Store key material and registry credentials in Kubernetes Secrets.
Choose either one combined Secret or separate Secrets, then reference them through `spec.credentials.ocm.refs` in your `VectorTemplate`.
Konfidence merges the listed Secrets into a single credential graph.

Secrets must be in the same namespace as the custom resource that references them.
The following examples use `<cr-namespace>` for that namespace.

Signing requires a private key and fails immediately if it is missing.
If verification credentials contain no RSA key material, verification falls back to the system root trust store: CA-issued signatures pass, while self-signed or internal keys fail.

### Option A: Use one Secret

1. Create a Secret containing both signing key pairs and the registry credentials:

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

2. Reference the Secret under `spec` in your `VectorTemplate`. This snippet shows only the credential configuration:

   ```yaml
   credentials:
     ocm:
       refs:
         - name: my-creds
   ```

### Option B: Use separate Secrets

1. Create one Secret for signing keys and another for registry credentials:

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

2. Reference both Secrets under `spec` in your `VectorTemplate`. This snippet shows only the credential configuration:

   ```yaml
   credentials:
     ocm:
       refs:
         - name: my-signing-creds
         - name: my-registry-creds
   ```

## Configure artifact verification and vector signing

Configure your `VectorTemplate` to verify its artifacts and sign the assembled vector.
Each signing and verification phase is optional.
If you omit `verifyArtifacts`, `verifyVector`, or `signVector`, the corresponding check or signing action is skipped.

1. Set `verifyArtifacts.signatures` to the artifact signature name to check during assembly.
2. Set `signVector.signatures` to the signature name to use for the assembled vector.
3. Reference the Secrets from the previous section and apply the `VectorTemplate`.

The following assembly example uses the separate Secrets from Option B.
If you chose Option A, use its credential reference instead.
The example references two artifacts independently of the earlier `payment-hub` example; sign the artifacts you reference before enabling their verification.

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

Any verification or signing failure stops reconciliation.

### Optional: Verify a base vector

If you inherit artifacts from an existing base vector, enable the commented `verifyVector` block in the example to verify that vector.

### Optional: Pin signature parameters

Add optional fields to a `Signature` entry when you need exact algorithm parameters.
The following partial example shows these fields for `verifyVector`:

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

Only `name` is required.
For valid values, see [OCM signing and verification concepts](https://ocm.software/docs/concepts/signing-and-verification/).

## Verify the result

Check the conditions of your `VectorTemplate` to confirm that assembly succeeded:

```bash
kubectl get vectortemplate my-vector -n <cr-namespace> -o jsonpath='{.status.conditions}'
```

A successful assembly shows `type: Ready` and `status: True`.
The reason is `VectorCreated` on the first reconciliation and `NoDriftDetected` on subsequent reconciliations.

If assembly fails, check `kubectl describe vectortemplate my-vector` for the condition and attached event.

## Troubleshooting

Use the following checks for known assembly and signature-configuration problems:

| Symptom | Likely cause | Resolution or diagnostic check |
| --- | --- | --- |
| `VectorTemplate` `Ready=Unknown`, reason `DriftDetectionFailed` | Credential Secret missing, wrong key name, or not in the same namespace | Check Events with `kubectl describe vectortemplate <name>`. |
| `algorithm` pin rejection | Signed with `RSASSA-PKCS1-V1_5` but the CRD pins `RSASSA-PSS` | Align `algorithm` in the Secret consumer identity and CRD `Signature` entry. |

## Next steps

Deployment verification is configured separately on the operator.
The `VectorDeployment` controller reads its cryptographic configuration from environment variables on the operator pod.
That configuration is outside the assembly task covered here.

For the next parts of your application delivery workflow, see:

- [Build vectors](./observe-improve/build-vectors.md).
- [Define promotions](./observe-improve/define-promotions.md).
- [Landscapes and Stages](../core-concepts/landscapes-and-stages.md) for security boundaries.

<!--
Retained for reuse: the full pipeline diagram provides conceptual context beyond this assembly-focused how-to.

## How signing flows through the pipeline

<DrawioDiagram src="/assets/diagrams/signing-and-verification-flow.drawio" />
-->

<!--
Retained for reuse: artifact construction and publishing are covered by Publish artifacts; this guide starts with a published component version.

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
-->

<!--
Retained for reuse: promotion behavior belongs with delivery-flow concepts rather than the assembly procedure.

## Promotions do not verify

A promotion re-points a target stage at a vector version that already exists in the registry. It never rebuilds, re-signs, or transfers OCM content, so there is nothing to verify and no registry access to authenticate at promotion time. 

Verification still guards both ends of every promotion chain:

- **At assembly** — the `VectorTemplate` verifies its artifacts (and optionally its base vector) and signs the assembled vector, as shown above.
- **At deployment** — the `VectorDeployment` controller re-verifies the vector and its artifacts before rollout, as shown below.

Because the selected vector was signed at assembly and is re-verified at deployment, moving it between stages needs no additional signature check.
-->

<!--
Retained for reuse: operator configuration and diagnostics belong in a separate deployment-verification procedure.

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

### Deployment troubleshooting

| Symptom | Likely cause | Where to look |
|---|---|---|
| VectorDeployment `VectorDownloaded` never `True` | Env vars not set or credential Secret not found | `kubectl logs deployment/<operator-deployment> -n <operator-namespace>` |
-->

<!--
Retained for reuse: the default-behavior table is reference material; its task-relevant effects are retained beside credential and signature configuration above.

## Default behaviors when fields are omitted

| Omitted field | Effect |
|---|---|
| `verifyArtifacts`, `verifyVector`, or `signVector` block | That check is skipped entirely; the pipeline proceeds without it |
| RSA key material missing from credential Secret — verify | Falls back to system root trust store; CA-issued signatures pass, self-signed or internal keys fail |
| RSA key material missing from credential Secret — sign | Fails immediately; a private key is always required |
-->

<!--
Retained for reuse: background reading moved out of the prerequisites; credential resolution is linked beside CLI configuration.

- For background on how credential resolution works, see the [OCM credential system concepts](https://ocm.software/docs/concepts/credential-system/)
-->
