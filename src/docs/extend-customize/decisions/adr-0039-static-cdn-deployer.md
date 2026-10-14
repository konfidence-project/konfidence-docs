
---
id: ADR-0039
title: "Static content deployer"
description: "Deploy static apps to S3-compatible storage and activate them through administrator-provided CDN and routing setups"
status: draft
authors: []
category: Architecture Pattern
impact: Medium
dependencies: []
pageClass: adr
outline: deep
---

# ADR-0039: Static Content Deployer

<AdrHeader />

## Context

Static apps need to be deployed alongside services running in other runtimes. A stage can serve several apps under one hostname: static content through a CDN and API requests through Konfidence's public gateway.

This ADR defines how the static-content deployer uploads unchanged app files to S3-compatible storage and activates them through an administrator-provided CDN and routing setup. The design is provider-neutral.

Uploaded files stay unchanged, but the files served at a stage's public URL change during activation. Routing and caching must therefore be part of activation, even when the stored files are immutable.

## Scope and related decisions

- Administrators provide storage, access credentials, public hostnames, DNS, HTTPS, the CDN, and public path assignments.
- The deployer manages its uploaded files. Its activation phase updates the S3-backed routing rules and handles any required cache changes.
- Routes to the public gateway and other runtimes remain under their existing owners. This ADR describes how static delivery fits into that setup; the administrator defines the overall routing model.
- [ ] TODO: Follow the [draft deployer spec](https://github.com/konfidence-project/konfidence/blob/main/conformance/specs/deployer.md), [artifact type selection ADR-0038](./adr-0038-artifact-type-deployer-selection.md), and [routing ADR-0037](./adr-0037-ingress-routing-and-activation.md).

## Artifact Type

- The deployer publishes a new artifact type called static.konfidence.cloud-v1alpha1

## Artifact contents

The deployer uploads the supplied files unchanged.

Apps resolve API addresses themselves, for example through feature configuration or by using the same hostname with a path such as `/api` that routes to Konfidence's public gateway.

- [ ] TODO: Describe how files are packaged in OCM, which files and settings are required, and how the app's start page is identified.
- [ ] TODO: Define what makes a package valid before uploading it and how incomplete or invalid packages are reported.
- [ ] TODO: Decide who supplies file types, compression settings, and CDN caching rules: the artifact author, the deployer, or the administrator.

## Deployment Parameters

The administrator provides an existing bucket and storage access. A target can point to a designated area within a shared bucket; a separate bucket per landscape is not required. The deployer owns its uploaded files, not the bucket.
- [ ] TODO: Do we wan't to allow one single bucket accross multiple landscapes?
- [ ] TODO: Describe the storage location and access settings a target needs. Keep storage addresses separate from public app URLs.
- [ ] TODO: Define which target settings can change while files are deployed, and what happens when a target is removed or replaced.

## S3 objects?

The following key layouts are examples under discussion. They must also work with shared buckets.

- user defined key: /app/index.html
- konfindence key (complete key): <artifact-deployment-name>/app/index.html

if virtual hosted style adressing:

<landscape>.<s3-host>/<artifact-deployment-name>/<app-key>
eg. dev-eu10.s3.amazonaws.com/example-app-654345654/app/index.html

if path style adressing:
<s3-host>/<landscape>/<artifact-deployment-name>/<app-key>
eg. s3.amazonaws.com/dev-eu10/example-app-654345654/app/index.html


edge case: collisions for global bucket use case with reuse? -> konfindence key <landscape-name>/<artifact-deployment-name>

## Uploads and shared files

- [ ] TODO: Choose how files are named so that landscapes and installations sharing a bucket cannot overwrite each other's files.

## Deployment results and vector data

- [ ] TODO: Describe what the deployer reports after an upload and which components use that information to serve the app.
- [ ] TODO: Define how activation uses static deployment results. Current KLO routing expects Kubernetes Services, so reporting an S3 address alone does not provide the required integration. -> Don't actually have deployment results?

## Routing

The administrator assigns public paths to apps. A stage can have several static apps as well as apps running in other runtimes. For example:

```text
stage.example.com/       -> CDN -> active static app in S3
stage.example.com/admin  -> CDN -> another active static app in S3
stage.example.com/api    -> Konfidence's public gateway -> backend
```

DNS points the hostname to the public entry point. The administrator's CDN or edge routing setup handles the path split. Static file requests are served directly from storage through the CDN, without passing through Konfidence's public gateway.

Public stage URLs stay stable. During activation, the deployer changes the S3-backed rules to point to the newly active artifact deployment. Uploading an artifact alone does not change what the stage serves.

Previous files may remain in storage, but the stage no longer routes to them after the switch.
- [ ] TODO: Define how the administrator's path assignments identify the S3-backed rules that the deployer's activation may update.
- [ ] TODO: Describe how those rules select the stage's active artifact deployments, including start pages, linked assets, and nested app pages.

## CDN and caching

The CDN serves the app's files from S3-compatible storage. The deployer's activation phase is responsible for the routing and cache changes needed to serve the new release at the same public URLs.

Changing the backing S3 path does not by itself remove cached responses for those URLs. Activation must wait until the CDN reports that the required routing and CDN cache changes are ready.

- [ ] TODO: Define the behavior required from supported CDN and routing setups, including how they report readiness and failure.
- [ ] TODO: Define which responses can be cached, for how long, and when caches must be cleared. Include the app's start page and browser caches.
- [ ] TODO: Explain how cached content stays correct when different stages or rollout groups use different versions.

## Activation

The deployer's activation phase selects the new static artifact deployment after its upload is complete. It updates the S3-backed routing rules and performs any required cache changes. It does not change the administrator's public path assignments or routes owned by other runtimes.

The static activation step completes only after routing and CDN readiness are confirmed. A routing or cache failure must not be reported as successful activation.

- [ ] TODO: Describe the order of routing and cache changes and what users may see while those changes take effect.
- [ ] TODO: Define rollback and what happens if a newer activation starts before the previous one finishes.

### Open question: activation across runtimes

The CDN may already serve the new static app when backend activation fails, leaving the stage with the new frontend and the old backend. An atomic switch within the CDN provider does not solve this cross-runtime problem.

- [ ] TODO: Decide how Konfidence coordinates activation across runtimes and handles partial failure, including whether and how it restores the previous version. This remains unresolved; the static deployer alone cannot guarantee a consistent switch of the whole vector.

## Initial browser behavior

Keeping an open browser tab on its original vector is desirable, but requires shared support in Konfidence for routing requests to that vector. This is deferred.

The first version can ship without those features. After activation, a tab running the previous frontend may call the new backend or request an old asset that the stage no longer serves. Applications must account for this limitation; the deployer does not promise that existing tabs keep working across a switch.

## Operations (Implementation Details, tbd before given for Agent to implementation)

- [ ] TODO: Distinguish a usable target, a complete upload, an active version, and an app that is reachable from outside. Define what each status actually guarantees.
- [ ] TODO: Decide which failures are retried, which need administrator action, and how status changes when a previously working dependency fails.
- [ ] TODO: Define the information operators need to understand failed uploads, routing changes, and cache updates.

## Retention and cleanup

The deployer removes files it owns when they are no longer needed. Shared buckets, administrator-managed CDN setup, and DNS records have a separate lifetime from individual artifacts. Retaining old files in storage does not make them reachable through a stage that has switched to another deployment.

- [ ] TODO: Decide how long old files remain stored for reuse by other vectors or stages and for rollback.
- [ ] TODO: Define when files are no longer needed and how cleanup resumes if access to the original storage is lost. Deletion must not be reported complete while owned files remain.

## Supported setups and acceptance criteria

- [ ] TODO: Define the first supported storage and routing setups, and what support for another provider would require.
- [ ] TODO: Describe successful deployment, activation, and rollback from a user's point of view, including the stated limitations for already-open browser tabs.
- [ ] TODO: Describe the expected outcome of an invalid package, an interrupted upload, a routing or cache failure, and a removed or replaced target.

## Feature Toggles

- TODO

## Idea:
- Artifact Result returns S3 Url wich gets served by ArtifactDeployment named host/domain/etc -> edge router routes stages to latest artifactdeployments - CDN specific? -> indefinite caching per artifact deployment route
