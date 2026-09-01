---
title: API
description: Konfidence REST API reference — endpoints, request and response schemas.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Konfidence API

> Version v1

HTTP gateway between CLI/UI clients and the Konfidence CRDs.



## Path Table

| Method | Path | Description |
| --- | --- | --- |
| GET | [/v1/login](#getv1login) | Initiate OIDC login |
| GET | [/v1/auth/callback](#getv1authcallback) | OIDC callback |
| POST | [/v1/logout](#postv1logout) | Terminate the current session |
| GET | [/v1/identity](#getv1identity) | Get the current user identity |
| POST | [/v1/exchange](#postv1exchange) | Send temp exchange code and PKCE verifier to get session |
| GET | [/v1/projects](#getv1projects) | List all projects |
| GET | [/v1/projects/{projectId}/landscapes](#getv1projectsprojectidlandscapes) | List all landscapes for a specific project |
| GET | [/v1/projects/{projectId}/stages](#getv1projectsprojectidstages) | List all stages for a project |
| GET | [/v1/projects/{projectId}/vectorDeployments](#getv1projectsprojectidvectordeployments) | List all vectorDeployments for a project |
| GET | [/v1/projects/{projectId}/artifactDeployments](#getv1projectsprojectidartifactdeployments) | List all artifactDeployments for a project. |

## Reference Table

| Name | Path | Description |
| --- | --- | --- |
| sessionCookie | [#/components/securitySchemes/sessionCookie](#componentssecurityschemessessioncookie) |  |
| ProjectPathId | [#/components/parameters/ProjectPathId](#componentsparametersprojectpathid) | Project Id |
| LandscapePathId | [#/components/parameters/LandscapePathId](#componentsparameterslandscapepathid) | Landscape Id |
| LandscapeQueryId | [#/components/parameters/LandscapeQueryId](#componentsparameterslandscapequeryid) | Filter by landscapeId |
| VectorDeploymentQueryId | [#/components/parameters/VectorDeploymentQueryId](#componentsparametersvectordeploymentqueryid) | Filter by vectorDeploymentId |
| ProjectList | [#/components/schemas/ProjectList](#componentsschemasprojectlist) |  |
| Project | [#/components/schemas/Project](#componentsschemasproject) |  |
| LandscapeList | [#/components/schemas/LandscapeList](#componentsschemaslandscapelist) |  |
| Landscape | [#/components/schemas/Landscape](#componentsschemaslandscape) |  |
| VectorDeploymentList | [#/components/schemas/VectorDeploymentList](#componentsschemasvectordeploymentlist) |  |
| VectorDeployment | [#/components/schemas/VectorDeployment](#componentsschemasvectordeployment) |  |
| ArtifactDeploymentList | [#/components/schemas/ArtifactDeploymentList](#componentsschemasartifactdeploymentlist) |  |
| ArtifactDeployment | [#/components/schemas/ArtifactDeployment](#componentsschemasartifactdeployment) |  |
| StageVersion | [#/components/schemas/StageVersion](#componentsschemasstageversion) |  |
| StageList | [#/components/schemas/StageList](#componentsschemasstagelist) |  |
| Stage | [#/components/schemas/Stage](#componentsschemasstage) |  |
| Identity | [#/components/schemas/Identity](#componentsschemasidentity) |  |
| ArtifactReference | [#/components/schemas/ArtifactReference](#componentsschemasartifactreference) |  |
| VectorReference | [#/components/schemas/VectorReference](#componentsschemasvectorreference) |  |
| ComponentReference | [#/components/schemas/ComponentReference](#componentsschemascomponentreference) |  |
| ProjectId | [#/components/schemas/ProjectId](#componentsschemasprojectid) | The project id |
| LandscapeId | [#/components/schemas/LandscapeId](#componentsschemaslandscapeid) | The landscape id |
| VectorDeploymentId | [#/components/schemas/VectorDeploymentId](#componentsschemasvectordeploymentid) | The vectorDeployment id |
| ArtifactDeploymentId | [#/components/schemas/ArtifactDeploymentId](#componentsschemasartifactdeploymentid) | The artifactDeployment id |
| StageId | [#/components/schemas/StageId](#componentsschemasstageid) | The stage id |
| StageVersionId | [#/components/schemas/StageVersionId](#componentsschemasstageversionid) | The stageVersion id |
| ErrorResponse | [#/components/schemas/ErrorResponse](#componentsschemaserrorresponse) |  |
| Unauthorized | [#/components/responses/Unauthorized](#componentsresponsesunauthorized) | Authentication required or session expired. |
| Forbidden | [#/components/responses/Forbidden](#componentsresponsesforbidden) | Access not allowed. |
| NotFound | [#/components/responses/NotFound](#componentsresponsesnotfound) | The requested resource was not found. |
| BadRequest | [#/components/responses/BadRequest](#componentsresponsesbadrequest) | Invalid request parameters. |
| InternalError | [#/components/responses/InternalError](#componentsresponsesinternalerror) | An unexpected server error occurred. |

## Path Details

***

### [GET]/v1/login

- Summary  
Initiate OIDC login

- Operation id  
loginV1

- Description  
Redirects the browser to the IDP authorization endpoint, beginning the PKCE auth flow. On successful authentication the IDP redirects back to /api/v1/auth/callback.  


- Security  

#### Parameters(Query)

```typescript
return_url: string
```

```typescript
code_challenge?: string
```

#### Responses

- 302 Redirect to IDP authorization endpoint.

- 400 undefined

- 500 undefined

***

### [GET]/v1/auth/callback

- Summary  
OIDC callback

- Operation id  
authCallbackV1

- Description  
Receives the authorization code from the IDP after successful login. Exchanges the code for tokens and establishes a session cookie.  


- Security  

#### Parameters(Query)

```typescript
state: string
```

```typescript
code?: string
```

```typescript
error?: string
```

```typescript
error_description?: string
```

#### Responses

- 302 Redirect to the application after successful authentication.

- 400 undefined

- 401 undefined

- 500 undefined

***

### [POST]/v1/logout

- Summary  
Terminate the current session

- Operation id  
logoutV1

- Description  
Clears the session cookie. Requires an active session.

#### Responses

- 200 Session terminated successfully.

- 401 undefined

***

### [GET]/v1/identity

- Summary  
Get the current user identity

- Operation id  
getIdentityV1

- Description  
Returns identity claims for the authenticated session.

#### Responses

- 200 OK

`application/json`

```typescript
{
  name: string
  givenName: string
  familyName: string
  email: string
  projectRoles: {
  }
}
```

- 401 undefined

- 500 undefined

***

### [POST]/v1/exchange

- Summary  
Send temp exchange code and PKCE verifier to get session

- Operation id  
postExchangeCodeV1

- Description  
Validates code and verifier and returns session if valid.

- Security  

#### RequestBody

- application/json

```typescript
{
  code: string
  verifier: string
}
```

#### Responses

- 200 Session established.

- 401 undefined

- 500 undefined

***

### [GET]/v1/projects

- Summary  
List all projects

- Operation id  
listProjectsV1

- Description  
Returns all Project resources visible to the authenticated user.

#### Responses

- 200 OK

`application/json`

```typescript
{
  data: {
    // The project id
    id: string
    // The name of the project
    name: string
  }[]
}
```

- 401 undefined

- 500 undefined

***

### [GET]/v1/projects/{projectId}/landscapes

- Summary  
List all landscapes for a specific project

- Operation id  
listLandscapesV1

- Description  
Returns all landscape resources for a project.

#### Responses

- 200 OK

`application/json`

```typescript
{
  data: {
    // The landscape id
    id: string
    // The name of the landscape
    name: string
  }[]
}
```

- 401 undefined

- 403 undefined

- 404 undefined

- 500 undefined

***

### [GET]/v1/projects/{projectId}/stages

- Summary  
List all stages for a project

- Operation id  
listStagesV1

- Description  
Returns all stage resources for a project. Can be filtered by landscape.

#### Parameters(Query)

```typescript
landscapeId?: string
```

#### Responses

- 200 OK

`application/json`

```typescript
{
  data: {
    // The stage id
    id: string
    // The stage name
    name: string
    // The landscape id
    landscapeId: string
    targetStageVersion: {
      // The stageVersion id
      id: string
      // StageVersion vector
      vector: string
      // Generation of the parent stage
      stageGeneration: integer
      // Indicates if this is the latest active stageVersion
      active: boolean
      status: enum[DeploymentCreated]
    }
  }[]
}
```

- 401 undefined

- 403 undefined

- 500 undefined

***

### [GET]/v1/projects/{projectId}/vectorDeployments

- Summary  
List all vectorDeployments for a project

- Operation id  
listVectorDeploymentsV1

- Description  
Returns all vectorDeployments resources for a project. Can be filtered by landscape.

#### Parameters(Query)

```typescript
landscapeId?: string
```

#### Responses

- 200 OK

`application/json`

```typescript
{
  data: {
    // The vectorDeployment id
    id: string
    // The landscape id
    landscapeId: string
    // The stage id
    stageId: string
    vector: #/components/schemas/ComponentReference
    // The vectorDeployment status
    status: enum[VectorDownloaded, ArtifactDeploymentCreated]
  }[]
}
```

- 401 undefined

- 403 undefined

- 500 undefined

***

### [GET]/v1/projects/{projectId}/artifactDeployments

- Summary  
List all artifactDeployments for a project.

- Operation id  
listArtifactDeploymentsV1

- Description  
Returns all artifactDeployments resources for a project. Can be filtered by landscape or vectorDeployment.

#### Parameters(Query)

```typescript
landscapeId?: string
```

```typescript
vectorDeploymentId?: string
```

#### Responses

- 200 OK

`application/json`

```typescript
{
  data: {
    // The artifactDeployment id
    id: string
    // The landscape id
    landscapeId: string
    // The vectorDeployment id
    vectorDeploymentIds?: string[]
    // The stage id
    stageIds?: string[]
    artifact: #/components/schemas/ComponentReference
    // The artifactDeployment status
    status: enum[ArtifactFetched, ArtifactDeployed]
  }[]
}
```

- 401 undefined

- 403 undefined

- 500 undefined

## References

### #/components/securitySchemes/sessionCookie

```typescript
{
  "type": "apiKey",
  "in": "cookie",
  "name": "kden-session"
}
```

### #/components/parameters/ProjectPathId

```typescript
projectId: string
```

### #/components/parameters/LandscapePathId

```typescript
landscapeId: string
```

### #/components/parameters/LandscapeQueryId

```typescript
landscapeId?: string
```

### #/components/parameters/VectorDeploymentQueryId

```typescript
vectorDeploymentId?: string
```

### #/components/schemas/ProjectList

```typescript
{
  data: {
    // The project id
    id: string
    // The name of the project
    name: string
  }[]
}
```

### #/components/schemas/Project

```typescript
{
  // The project id
  id: string
  // The name of the project
  name: string
}
```

### #/components/schemas/LandscapeList

```typescript
{
  data: {
    // The landscape id
    id: string
    // The name of the landscape
    name: string
  }[]
}
```

### #/components/schemas/Landscape

```typescript
{
  // The landscape id
  id: string
  // The name of the landscape
  name: string
}
```

### #/components/schemas/VectorDeploymentList

```typescript
{
  data: {
    // The vectorDeployment id
    id: string
    // The landscape id
    landscapeId: string
    // The stage id
    stageId: string
    vector: #/components/schemas/ComponentReference
    // The vectorDeployment status
    status: enum[VectorDownloaded, ArtifactDeploymentCreated]
  }[]
}
```

### #/components/schemas/VectorDeployment

```typescript
{
  // The vectorDeployment id
  id: string
  // The landscape id
  landscapeId: string
  // The stage id
  stageId: string
  vector: #/components/schemas/ComponentReference
  // The vectorDeployment status
  status: enum[VectorDownloaded, ArtifactDeploymentCreated]
}
```

### #/components/schemas/ArtifactDeploymentList

```typescript
{
  data: {
    // The artifactDeployment id
    id: string
    // The landscape id
    landscapeId: string
    // The vectorDeployment id
    vectorDeploymentIds?: string[]
    // The stage id
    stageIds?: string[]
    artifact: #/components/schemas/ComponentReference
    // The artifactDeployment status
    status: enum[ArtifactFetched, ArtifactDeployed]
  }[]
}
```

### #/components/schemas/ArtifactDeployment

```typescript
{
  // The artifactDeployment id
  id: string
  // The landscape id
  landscapeId: string
  // The vectorDeployment id
  vectorDeploymentIds?: string[]
  // The stage id
  stageIds?: string[]
  artifact: #/components/schemas/ComponentReference
  // The artifactDeployment status
  status: enum[ArtifactFetched, ArtifactDeployed]
}
```

### #/components/schemas/StageVersion

```typescript
{
  // The stageVersion id
  id: string
  // StageVersion vector
  vector: string
  // Generation of the parent stage
  stageGeneration: integer
  // Indicates if this is the latest active stageVersion
  active: boolean
  status: enum[DeploymentCreated]
}
```

### #/components/schemas/StageList

```typescript
{
  data: {
    // The stage id
    id: string
    // The stage name
    name: string
    // The landscape id
    landscapeId: string
    targetStageVersion: {
      // The stageVersion id
      id: string
      // StageVersion vector
      vector: string
      // Generation of the parent stage
      stageGeneration: integer
      // Indicates if this is the latest active stageVersion
      active: boolean
      status: enum[DeploymentCreated]
    }
  }[]
}
```

### #/components/schemas/Stage

```typescript
{
  // The stage id
  id: string
  // The stage name
  name: string
  // The landscape id
  landscapeId: string
  targetStageVersion: {
    // The stageVersion id
    id: string
    // StageVersion vector
    vector: string
    // Generation of the parent stage
    stageGeneration: integer
    // Indicates if this is the latest active stageVersion
    active: boolean
    status: enum[DeploymentCreated]
  }
}
```

### #/components/schemas/Identity

```typescript
{
  name: string
  givenName: string
  familyName: string
  email: string
  projectRoles: {
  }
}
```

### #/components/schemas/ArtifactReference

```typescript
undefined?: #/components/schemas/ComponentReference
```

### #/components/schemas/VectorReference

```typescript
undefined?: #/components/schemas/ComponentReference
```

### #/components/schemas/ComponentReference

```typescript
{
  repository: string
  componentName: string
  componentVersion: string
}
```

### #/components/schemas/ProjectId

```typescript
// The project id
string
```

### #/components/schemas/LandscapeId

```typescript
// The landscape id
string
```

### #/components/schemas/VectorDeploymentId

```typescript
// The vectorDeployment id
string
```

### #/components/schemas/ArtifactDeploymentId

```typescript
// The artifactDeployment id
string
```

### #/components/schemas/StageId

```typescript
// The stage id
string
```

### #/components/schemas/StageVersionId

```typescript
// The stageVersion id
string
```

### #/components/schemas/ErrorResponse

```typescript
{
  error: {
    code: string
    message: string
  }
}
```

### #/components/responses/Unauthorized

- application/json

```typescript
{
  error: {
    code: string
    message: string
  }
}
```

### #/components/responses/Forbidden

- application/json

```typescript
{
  error: {
    code: string
    message: string
  }
}
```

### #/components/responses/NotFound

- application/json

```typescript
{
  error: {
    code: string
    message: string
  }
}
```

### #/components/responses/BadRequest

- application/json

```typescript
{
  error: {
    code: string
    message: string
  }
}
```

### #/components/responses/InternalError

- application/json

```typescript
{
  error: {
    code: string
    message: string
  }
}
```