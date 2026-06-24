---
title: Overview
description: 
---

<!-- 
  Content type (Diátaxis): Reference — lists all runtime components, their purpose, and when to install those components.
-->

# Runtime Components Overview

## What Are Runtime Components?

Runtime components are optional services that are deployed alongside your application workloads into your target runtime. 
They run beside your actual application services and provide additional functionality for Konfidence that may not be required in every setup.

These components are designed to enhance and extend the capabilities of your Konfidence deployment.
Since they're optional, you only need to install the ones that match your specific requirements.

## Installation and Administration

At the moment, runtime components need to be installed manually by a cluster administrator. 
This may change in future releases with automated installation options.

## Available Runtime Components

| Component                                           | Purpose                                                                                               |
|-----------------------------------------------------|-------------------------------------------------------------------------------------------------------|
| [Configuration Service](./configuration-service.md) | Allows your app to access [Vector Data](/docs/develop-integrate/vector-data/overview) during runtime. |
