---
title: API
description: Konfidence REST API reference — endpoints, request and response schemas.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Konfidence API
HTTP gateway between CLI/UI clients and the Konfidence CRDs.

## Version: v1

### Servers

| URL | Description |
| --- | ----------- |
| /api | Stage resources (versioned API) |

### Available authorizations
#### sessionCookie (API Key Authentication)
**Name:** kden-session  
**In:** cookie  

---

### [GET] /v1/login
**Initiate OIDC login**

Redirects the browser to the IDP authorization endpoint, beginning the PKCE auth flow. On successful authentication the IDP redirects back to /api/v1/auth/callback.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| return_url | query | Fully qualified URL to redirect to after login. The URL must be present in the API server allowlist. | Yes | string (uri) |
| code_challenge | query | PKCE S256 challenge used for CLI login. | No | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 302 | Redirect to IDP authorization endpoint.<br>**Headers:**<br>**Location**: Redirect url<br> |  |
| 400 | Invalid request parameters. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/auth/callback
**OIDC callback**

Receives the authorization code from the IDP after successful login. Exchanges the code for tokens and establishes a session cookie.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| state | query |  | Yes | string |
| code | query |  | No | string |
| error | query |  | No | string |
| error_description | query |  | No | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 302 | Redirect to the application after successful authentication.<br>**Headers:**<br>**Set-Cookie**: Contains the session ID.<br>**Location**: Redirect url<br> |  |
| 400 | Invalid request parameters. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [POST] /v1/logout
**Terminate the current session**

Clears the session cookie. Requires an active session.

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Session terminated successfully.<br>**Headers:**<br>**Set-Cookie**: Removes the session cookie.<br> |  |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/identity
**Get the current user identity**

Returns identity claims for the authenticated session.

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [Identity](#identity-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [POST] /v1/exchange
**Send temp exchange code and PKCE verifier to get session**

Validates code and verifier and returns session if valid.

#### Request Body

| Required | Schema |
| -------- | ------ |
|  Yes | **application/json**: { **"code"**: string, **"verifier"**: string }<br> |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | Session established.<br>**Headers:**<br>**Set-Cookie**: Contains the session id.<br> |  |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

---

### [GET] /v1/projects
**List all projects**

Returns all Project resources visible to the authenticated user.

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [ProjectList](#projectlist-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/projects/{projectId}/landscapes
**List all landscapes for a specific project**

Returns all landscape resources for a project.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| projectId | path | Project Id | Yes | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [LandscapeList](#landscapelist-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 403 | Access not allowed. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 404 | The requested resource was not found. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/projects/{projectId}/stages
**List all stages for a project**

Returns all stage resources for a project. Can be filtered by landscape.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| projectId | path | Project Id | Yes | string |
| landscapeId | query | Filter by landscapeId | No | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [StageList](#stagelist-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 403 | Access not allowed. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/projects/{projectId}/vectorDeployments
**List all vectorDeployments for a project**

Returns all vectorDeployments resources for a project. Can be filtered by landscape.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| projectId | path | Project Id | Yes | string |
| landscapeId | query | Filter by landscapeId | No | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [VectorDeploymentList](#vectordeploymentlist-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 403 | Access not allowed. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

### [GET] /v1/projects/{projectId}/artifactDeployments
**List all artifactDeployments for a project.**

Returns all artifactDeployments resources for a project. Can be filtered by landscape or vectorDeployment.

#### Parameters

| Name | Located in | Description | Required | Schema |
| ---- | ---------- | ----------- | -------- | ------ |
| projectId | path | Project Id | Yes | string |
| landscapeId | query | Filter by landscapeId | No | string |
| vectorDeploymentId | query | Filter by vectorDeploymentId | No | string |

#### Responses

| Code | Description | Schema |
| ---- | ----------- | ------ |
| 200 | OK | **application/json**: [ArtifactDeploymentList](#artifactdeploymentlist-schema)<br> |
| 401 | Authentication required or session expired. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 403 | Access not allowed. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |
| 500 | An unexpected server error occurred. | **application/json**: [ErrorResponse](#errorresponse-schema)<br> |

---
### Schemas

#### ProjectList Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [Project](#project-schema) ] |  | Yes |

#### Project Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [ProjectId](#projectid-schema) |  | Yes |
| name | string | The name of the project | Yes |

#### LandscapeList Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [Landscape](#landscape-schema) ] |  | Yes |

#### Landscape Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [LandscapeId](#landscapeid-schema) |  | Yes |
| name | string | The name of the landscape | Yes |

#### VectorDeploymentList Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [VectorDeployment](#vectordeployment-schema) ] |  | Yes |

#### VectorDeployment Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [VectorDeploymentId](#vectordeploymentid-schema) |  | Yes |
| landscapeId | [LandscapeId](#landscapeid-schema) |  | Yes |
| stageId | [StageId](#stageid-schema) |  | Yes |
| vector | [VectorReference](#vectorreference-schema) |  | Yes |
| status | string, <br>**Available values:** "VectorDownloaded", "ArtifactDeploymentCreated" | The vectorDeployment status<br>*Enum:* `"VectorDownloaded"`, `"ArtifactDeploymentCreated"` | Yes |

#### ArtifactDeploymentList Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [ArtifactDeployment](#artifactdeployment-schema) ] |  | Yes |

#### ArtifactDeployment Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [ArtifactDeploymentId](#artifactdeploymentid-schema) |  | Yes |
| landscapeId | [LandscapeId](#landscapeid-schema) |  | Yes |
| vectorDeploymentIds | [ [VectorDeploymentId](#vectordeploymentid-schema) ] |  | Yes |
| stageIds | [ [StageId](#stageid-schema) ] |  | Yes |
| artifact | [ArtifactReference](#artifactreference-schema) |  | Yes |
| status | string, <br>**Available values:** "ArtifactFetched", "ArtifactDeployed" | The artifactDeployment status<br>*Enum:* `"ArtifactFetched"`, `"ArtifactDeployed"` | Yes |

#### StageVersion Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [StageVersionId](#stageversionid-schema) |  | Yes |
| vector | string | StageVersion vector | Yes |
| stageGeneration | integer | Generation of the parent stage | Yes |
| active | boolean | Indicates if this is the latest active stageVersion | Yes |
| status | string, <br>**Available values:** "DeploymentCreated" | *Enum:* `"DeploymentCreated"` | Yes |

#### StageList Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| data | [ [Stage](#stage-schema) ] |  | Yes |

#### Stage Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| id | [StageId](#stageid-schema) |  | Yes |
| name | string | The stage name | Yes |
| landscapeId | [LandscapeId](#landscapeid-schema) |  | Yes |
| targetStageVersion | [StageVersion](#stageversion-schema) |  | Yes |

#### Identity Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| name | string |  | Yes |
| givenName | string |  | Yes |
| familyName | string |  | Yes |
| email | string |  | Yes |
| projectRoles | object |  | Yes |

#### ArtifactReference Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| ArtifactReference | [ComponentReference](#componentreference-schema) |  |  |

#### VectorReference Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| VectorReference | [ComponentReference](#componentreference-schema) |  |  |

#### ComponentReference Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| repository | string |  | Yes |
| componentName | string |  | Yes |
| componentVersion | string |  | Yes |

#### ProjectId Schema

The project id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| ProjectId | string | The project id |  |

#### LandscapeId Schema

The landscape id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| LandscapeId | string | The landscape id |  |

#### VectorDeploymentId Schema

The vectorDeployment id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| VectorDeploymentId | string | The vectorDeployment id |  |

#### ArtifactDeploymentId Schema

The artifactDeployment id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| ArtifactDeploymentId | string | The artifactDeployment id |  |

#### StageId Schema

The stage id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| StageId | string | The stage id |  |

#### StageVersionId Schema

The stageVersion id

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| StageVersionId | string | The stageVersion id |  |

#### ErrorResponse Schema

| Name | Type | Description | Required |
| ---- | ---- | ----------- | -------- |
| error | { **"code"**: string, **"message"**: string } |  | Yes |
