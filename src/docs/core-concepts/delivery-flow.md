---
title: Delivery Flow
description: Understand how Konfidence orchestrates the complete software delivery process from build to production.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Delivery Flow

Konfidence makes software delivery safe, consistent, and scalable. It manages complexity by breaking the deployment process into clear, distinct parts.

## Step-by-step workflow

Here is how a deployment flows through Konfidence:

1.  **Build:** Your CI pipeline builds code and publishes **artifacts**.
2.  **Assemble:** Konfidence groups these artifacts into a new **vector**.
3.  **Promote:** You assign this vector to a **stage** (like `Development`).
4.  **Pull:** The **star** detects the change and pulls the new configuration.
5.  **Snapshot:** The system creates a **stageVersion** to track this specific rollout.
6.  **Vector lifecycle begins:**
    * **Deployers** deploy the necessary artifacts.
    * **VectorAssignments** link these artifacts to the current vector.
    * **Tasks** (like migrations) prepare the data.
7.  **Activate:** Once everything is ready, traffic switches to the new version, and you can track the entire flow in the delivery dashboard.

<!-- 
  Content type (Diátaxis): Explanation — addresses "how does it work?" Background, no instructions.
  TW will structure this page as: narrative prose describing each step, with a visual flow diagram.

  Dev input needed:
  - Is there already a "delivery dashboard"? 
  - Is the flow above complete, or are there parallel paths (e.g., simultaneous deployers)?

  Ticket: already exists https://github.com/konfidence-project/konfidence-project/issues/613
-->

This structured approach ensures that every deployment is auditable, reproducible, and safe, regardless of the complexity of your application.

