# Content separation review

This working document is for writers and feature owners. It is outside the website source and does not appear in the navigation or search.

The baseline is the existing documentation in `src/docs/` on this branch. Existing page titles and H1 headings are preserved. The original site and generated references are unchanged. Edited pages live in `content/` under their original source paths; additional selection screens live in `pages/`.

## Review the first split: registry access

| Reader task | Page | Retained information |
| --- | --- | --- |
| Let the Konfidence operator pull private vectors | [Connect artifact registries](./content/deploy-operate/install/connect-registries.md) | Control plane secret, operator restart, OCM credentials, additional-secret environment variables, relevant failure cases |
| Let the Kubernetes deployer pull private artifacts in a landscape | [Configure registry access](./content/deploy-operate/install/deployer/kubernetes/registry-access.md) | Per-landscape credentials, registry-host lookup, ConfigMap mappings, workload image credentials, relevant failure case |
| Configure assembly credentials | Existing signing and vector assembly guides | Remains project-scoped and linked from the Core registry guide |

The registry environment variables and commands come from the original guide. Each new guide includes its own required prerequisites. Links to the old deployer-credential heading now lead to the Kubernetes guide.

## Content inventory

| Original page or section | New location and reader task | Treatment |
| --- | --- | --- |
| Connect artifact registries: Core credentials and OCM configuration | Same Core page | Retained; introduction, prerequisites, troubleshooting, and next steps scoped to Core |
| Connect artifact registries: deployer credentials, registry mapping, workload images | Configure registry access, under Kubernetes | Moved; commands retained; standalone prerequisites and verification added from existing behavior |
| Configure deployment targets for a landscape | Same Core page | Shared selection, resource ownership, readiness meaning, and handoff to the selected deployer's guide |
| Its Helm target creation and readiness commands | Configure a Kubernetes deployment target | Moved with landscape namespace setup and required permissions |
| Install the Kubernetes deployer: Target parameters | Configure a Kubernetes deployment target | Moved with remote-target warning, secret format, validation reasons, and registry prerequisite |
| Install the Kubernetes deployer: Supported artifact types | Types of artifacts | Moved; includes OCM/Flux mapping and zero/multiple-resource behavior |
| Install the Kubernetes deployer: Service results | Use deployment results | Processing, stable result names, ports, and scope moved into the existing application guide; duplicate Service example replaced by the original example with a port |
| Install the Kubernetes deployer: Service ingress opt-in | Expose a Service through stage ingress | Annotation fields, defaults, validation reasons, and removal behavior moved alongside the existing steps |
| Prepare your application | Same title, now in Core | General preparation retained; detailed HTTP context diagram and runtime integration moved to Access vector data in your application |
| Types of artifacts: reuse model and selection criteria | Artifacts and vectors | Common `allowReuse` semantics retained; no HTTP protocol prescribed as a universal requirement |
| Types of artifacts: HTTP reuse demands and diagrams | Access vector data in your application | Moved into Share an artifact instance, within the Kubernetes runtime context |
| Publish artifacts: Helm/Kustomize construction examples | Existing Author a Helm artifact / Author a Kustomize artifact | Existing complete constructors remain canonical; publishing now starts with prepared files and links to them. File placement and OCI reference requirements moved alongside the constructors. Shared validation, push, signing, alias, versioning, and failure behavior retained |
| Overview (vector data): Kubernetes runtime | Vector data on Kubernetes | ConfigMap transport and Vector Data Service relationship moved; original Core title retained |
| Use deployment results: common aggregation model | Overview (vector data): Deployment results | Shared concepts moved to Core; result schema warning retained |
| Add configuration to a vector: authored config retrieval | Access vector data in your application: Read authored configuration | Whole-bundle and endpoint rules moved to the runtime guide |
| Read feature flags in your application | Same Kubernetes guide | Kubernetes scope made explicit; SDK examples and existing TODO unchanged |
| System architecture: remote-target details | Configure a Kubernetes deployment target | Operational limitation and kubeconfig format retained with the target task; architecture links to it |
| Gateway routing: provider choice | Same page, before topology and routing contract | Existing alternatives and compatibility limits moved earlier; explains that the provider guides are alternatives |
| Existing Core installation, HA, projects/access, stages/promotions, tutorials, generated references, and ADRs | Existing mapped locations | No content edits in this pass |

`fragments.json` maps links to moved sections to their new locations. It does not create duplicate pages. This preview is not a production redirect scheme; permanent URL migration remains a publication decision.

## Feature-owner questions and existing gaps

These are review questions, not claims about missing product functionality. They are deliberately kept out of reader-facing guides. A question below does not authorize changing the associated behavior or documenting an unsupported capability.

| ID | Affected page | Information needed | Current handling |
| --- | --- | --- | --- |
| R1 | [Install Konfidence](../../src/docs/deploy-operate/install/konfidence-installation.md), [Plan for high availability](../../src/docs/deploy-operate/plan/high-availability.md) | For the documented release, which Flux controllers and Gateway API CRDs are required by Core itself, and which are needed only for Kubernetes deployment/routing? Please provide the release and the minimal supported installation. | Original prerequisites remain unchanged. Do not remove or move dependencies based on their names. Local sibling checkouts are from August and are not evidence for the current release. |
| R2 | [Gateway routing](./content/deploy-operate/plan/gateway-routing.md) | Which released KLO version includes gateway-route activation and optional Gateway provisioning? Which documented provider versions support `routability: Cluster`? | Existing release-verification TODOs and compatibility limitations retained. No new compatibility promise added. |
| R3 | [Read feature flags in your application](./content/develop-integrate/advanced-features/feature-flags.md) | Can the owner verify the Go, Java, and TypeScript examples against the intended SDK/provider versions and provide the tested versions? | Existing TODO and examples retained. This pass does not claim to have executed these integrations. |
| R4 | [Configure registry access](./content/deploy-operate/install/deployer/kubernetes/registry-access.md) | Which concrete resource status or log message should a reader inspect to confirm a private artifact pull and distinguish it from a workload image pull failure? | Expected behavior and troubleshooting retained from the original guide. No unverified status condition or command added. A more precise success check would improve this now-independent guide. |
| R5 | [Configure a Kubernetes deployment target](./content/deploy-operate/install/deployer/kubernetes/deployment-target.md) | Before upgrading remote targets to a supported recipe: which release deploys all required resources remotely, and what end-to-end check proves this? | Original work-in-progress warning preserved before the instructions. Local-cluster setup is the documented runnable path; remote snippets remain explicitly partial. |
| R6 | S3 and Cloud Foundry placeholder pages | Before writing real guides: supported release, artifact contract, credentials and target schema, deployment/activation behavior, result data, verification steps, and limitations. | Clearly labeled dummy pages contain no commands, schemas, or supported-feature assertions. Both are selectable to demonstrate navigation. |

The runtime guides describe the documented Kubernetes integration. They do not assert that another deployer implements `X-Vector-ID`, OFREP, the Vector Data Service, or Kubernetes Service results. Such support needs evidence from that deployer's contract and implementation.

## Review against PR feedback

- Core installation and landscape/target preparation belong to Deploy & Operate. Project access, CI access, stages, and promotions belong to Observe & Deliver.
- Build and assembly share Develop & Integrate. Landscape setup remains a prerequisite linked from the stage guide.
- CLI installation remains in Getting started, outside Reference.
- The Kubernetes entry page offers installation and application integration paths.
- Gateway setup has a provider-choice introduction on Gateway routing. Its section heading only expands and collapses.
- Target configuration has its own how-to. Service result details are in Use deployment results, rather than the installation guide or Reference.
- S3 and Cloud Foundry show navigation behavior only.

Before sharing the next PR revision, update its description: it still describes the earlier Build/Assemble/Deploy/Promote navigation. No review thread has been resolved or replied to as part of this local work.

## Reader clusters in the November 23 revision

The Core navigation now uses three task clusters. Getting started, Core concepts, and Reference remain shared entry points. Every guide is a direct child of its section; there are no additional project, environment, or delivery subgroups.

| Cluster | Reader's task | Existing guides |
| --- | --- | --- |
| Develop & Integrate | Prepare application artifacts and assemble versioned application content | Prepare your application; Publish artifacts; Build vectors; Add configuration to a vector; Configure signing and verification |
| Deploy & Operate | Install and operate Konfidence and prepare its deployment infrastructure | System architecture; Plan for high availability; Install Konfidence; Give teams access to the dashboard and API; Choose a deployer; Connect artifact registries; Create a landscape; Configure deployment targets for a landscape |
| Observe & Deliver | Organize the project's delivery access, stages, and promotion process | Create a project; Grant teams access to a project; Grant CI pipelines access; Create a stage; Set up and run promotion flows |

This grouping does not change permissions. The project, access, and stage setup guides still state their Kubernetes administration prerequisites. Delivery managers may need an administrator to complete those steps. The existing promotion guide covers both setup and operation, including approvals and inspection of promotion and rollout status.

Kubernetes-specific procedures retain their separate location under Deployers. There is one canonical navigation entry per guide. This revision changes the grouping and section labels only; page titles, prose, and URLs are unchanged.

The Observe & Deliver label does not imply that dedicated dashboard, release-decision, or delivery-metrics guides already exist. No empty pages or invented product capabilities were added to fill that cluster. Those reader tasks need a separate content review before adding guides.

## Validation scope

Checked after the navigation-only revision on November 23, 2026:

- The Core sidebar has six flat sections, including the three reader-task clusters above. Group headings expand and collapse without opening pages.
- Comparing the sidebar before and after regrouping preserves all 57 guide destinations, with no additions, removals, or duplicates. No page titles, prose, or routes changed in this revision.
- Original and preview builds pass. The preview's 101 rendered pages have no missing internal destinations or fragments across 6,866 checked URLs. `git diff --check` passes.
- Desktop browser checks confirm the relocated landscape and target guides under Deploy & Operate, all five Observe & Deliver entries, and the active Create a stage page in that cluster.
- Markdownlint reports no findings in the two updated draft notes. Its configured wider scan reports 11 existing advisory findings in unchanged ADRs; VitePress retains its large-bundle advisory.

Checked locally on November 19, 2026:

- Original site and navigation preview builds pass. VitePress reports the existing large-bundle advisory.
- The preview's 101 rendered pages contain no missing internal link destinations or fragments across 6,866 checked URLs. Every explicit moved-fragment mapping resolves.
- The original site's configured internal link check also passes, including the README check.
- All 57 sidebar destinations are unique within their navigation areas. Section headings expand and collapse without page links.
- All 18 edited original pages retain their original title and H1. The remaining imported content and generated references have no source edits.
- Markdownlint reports no issues in the 27 checked draft Markdown files. Vale's 16 advisory findings were reviewed: they concern retained wording, technical names, and the proper names Cloud Foundry and Vector Data Service. Original page titles were not changed to silence them.
- Source comparison accounts for the removed code examples: the duplicated publishing constructor/manifest is replaced by the existing authoring examples and explicit reuse guidance; the Service example now includes the port from the installation guide; the local target fragment is covered by the complete local target manifest. Existing commands and SDK examples are retained.
- Browser checks cover Core-to-Kubernetes registry navigation, the Kubernetes entry and target guide, gateway provider choice, the moved artifact-sharing anchor, selectable S3/Cloud Foundry pages, and the mobile selector. The tested mobile pages have no horizontal overflow.

This documentation-only pass does not install Konfidence, pull from a private registry, deploy an artifact, or execute SDK examples. Feature-owner confirmation and execution checks remain necessary for the questions above.
