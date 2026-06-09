---
title: Define promotions
description: Learn how to define and manage promotions to guide vectors through your delivery stages.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Define promotions

Promotions describe how vectors progress through your delivery pipeline from development through production. They define the rules and approvals for moving between stages.

## Understanding promotions

A promotion describes the action of moving a vector from one stage to another. It acts as a blueprint for how selected artifacts are expected to evolve as they progress towards production environments.

## Promotion workflow

### Typical promotion path

1. **Development stage:** Initial deployment for development and testing
2. **Testing stage:** Comprehensive testing and validation
3. **Staging stage:** Pre-production testing with production-like data
4. **Production stage:** Live deployment serving end users

### Stage transitions

Each promotion defines:

- Source stage (where vector currently resides)
- Target stage (where vector will be promoted)
- Any required approvals or validations
- Execution timing and constraints

## Configuring promotions

### Promotion rules

Define rules for automatic or manual promotions:

- Time-based promotions (e.g., after X hours)
- Condition-based promotions (e.g., all tests pass)
- Manual approval requirements
- Dependencies on other promotions

### Quality gates

Establish conditions that must be met:

- Build and test pass
- Security scanning results
- Performance benchmarks
- Manual approval from stakeholders

## Promotion execution

### Automated promotions

- Monitors for conditions that trigger promotion
- Automatically assigns vector to next stage
- Logs and tracks promotion events

### Manual promotions

- Requires explicit approval
- Documents who approved and when
- Provides rollback capability

<!-- 
  Content type (Diátaxis): How-to guide — user wants to define promotion rules that move vectors through stages automatically or with approvals.
  TW will structure this as: what a promotion is → create a VectorPromotion resource → configure rules → trigger and monitor.

  Dev input needed:
  - Are the "Advanced strategies" below (blue-green, canary, feature flags, time-based, condition-based) implemented features of Konfidence, or aspirational descriptions? 
  - What does a minimal VectorPromotion YAML resource look like?

  Ticket: DOCS — How to Define Promotions
-->

## Advanced strategies

### Blue-green deployments

- Maintain two production environments
- Test in one while running in other
- Switch traffic after validation

### Canary releases

- Deploy to small portion of landscape first
- Monitor metrics and error rates
- Gradually increase traffic if successful
- Rollback if issues detected

### Feature flags

- Deploy all features but toggle availability
- Manage feature rollout independently
- Reduce risk of deployments

## Best practices

- Keep promotion rules clearly documented
- Test promotion paths regularly
- Monitor promotion success rates
- Maintain clear approval chains
- Document rollback procedures

## See also

- [Paved Road](/docs/develop-integrate/observe-improve/paved-road) - Standardized delivery paths

