---
title: "Community"
scope: "Community"
editLink: false
lastUpdated: false
---
# Community

Contribute to Konfidence through code, documentation, and feedback. Start with the contribution guide for licensing, the Developer Certificate of Origin, and the project's Code of Conduct.

<TaskCards :items='[
 {"title":"Contributing","description":"Understand the contribution workflow and project agreements.","link":"/community/contributing"},
 {"title":"Contribute documentation","description":"Plan a page, use the writing guides, and check your changes.","link":"/community/documentation"},
 {"title":"Local development","description":"Run Konfidence locally to work on the platform.","link":"/community/local-development"}
]' />

## Understand a design decision

The [Architecture decisions](./decisions/index.md) collection records design context, alternatives, and consequences. Each record includes its status. Use the current task guides to operate Konfidence, and the records when considering a design change.

## Report a problem

Use the repository that owns the behavior:

- [Documentation issues](https://github.com/konfidence-project/konfidence-docs/issues)
- [Konfidence issues](https://github.com/konfidence-project/konfidence/issues)
- [Kubernetes landscape orchestrator issues](https://github.com/konfidence-project/kubernetes-landscape-orchestrator/issues)

If you are implementing another deployer, start with the [Deployer contract](./deployer-contract.md) and the [local conformance setup](./local-development.md#test-a-deployer).
