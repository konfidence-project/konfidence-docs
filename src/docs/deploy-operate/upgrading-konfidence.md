---
title: Upgrading Konfidence
description: Learn how to upgrade Konfidence components while maintaining operational continuity.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Upgrading Konfidence

<!-- 
  Content type (Diátaxis): How-to guide — operator needs to upgrade an existing Konfidence installation without losing delivery state.
  TW will structure this as: Prerequisites → upgrade Galaxy → upgrade Star → verify → rollback if needed.

  Dev input needed:
  - Are any upgrade paths currently supported, or is a full reinstall the only option in the pre-stable phase?
  - At what point (first stable release? specific version?) will upgrade guarantees be made?
  - Any known risks specific to upgrading Galaxy vs Star separately?
  - What should operators back up before upgrading (CRDs, Helm values, delivery state)?

  Ticket: DOCS — How to Upgrade Konfidence: Define upgrade path 
-->

Upgrade documentation will be published alongside the first stable release of Konfidence.

For early-access and pre-release deployments, refer to the individual release notes for any breaking changes and required migration steps.

## See also

- [Releases](/docs/reference/releases) - Release history and version information
- [Galaxy installation](/docs/deploy-operate/galaxy-installation) - Installation reference
- [Star installation](/docs/deploy-operate/star-installation) - Installation reference
