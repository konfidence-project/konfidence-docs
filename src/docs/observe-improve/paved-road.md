---
title: Paved Road
description: Learn about paved roads - standardized, safe paths for delivering software through Konfidence.
outline: [2, 3]
editLink: true
lastUpdated: true
---

# Paved Road

A paved road represents a standardized, well-tested delivery path in Konfidence. It enables teams to deliver software safely and consistently by providing a pre-configured, vetted execution path.

## What is a paved road?

A paved road encapsulates:

- Complete delivery process from artifact to production
- Pre-configured stages and landscapes
- Validated deployment procedures
- Built-in quality gates and approvals
- Integrated observability and monitoring

### Benefits of paved roads

- **Consistency:** All teams follow the same delivery process
- **Safety:** Built-in validations and approvals prevent issues
- **Efficiency:** Reduces setup time for new deployments
- **Compliance:** Ensures regulatory and security requirements
- **Learning:** New teams have clear examples to follow

## Designing paved roads

### Standard delivery stages

Define stages appropriate for your organization:

- **Development:** Continuous deployment for development work
- **Test:** Comprehensive automated testing
- **Staging:** Production-like environment for validation
- **Production:** Live environment serving users

### Quality criteria

Establish clear criteria for progression:

- All tests passing
- Code review approval
- Security scans completed
- Performance benchmarks met
- Manual approvals if required

### Integration patterns

Include deployment patterns:

- Blue-green deployments for zero-downtime updates
- Canary releases for gradual rollouts
- Feature flags for controlled feature availability
- Health checks and automatic rollbacks

## Implementing paved roads

### 1. Define the road map

- Identify stages in your process
- Document stage characteristics and purposes
- Define promotion criteria and rules

### 2. Configure stages and landscapes

- Set up required Kubernetes namespaces or environments
- Install necessary deployers and tools
- Configure monitoring and logging

### 3. Establish approval processes

- Define who approves promotions
- Create escalation procedures
- Document exception handling

### 4. Document and socialize

- Create runbooks for common scenarios
- Provide templates and examples
- Train teams on the standard path

## Using paved roads

### As a developer

1. Push code to your repository
2. CI/CD pipeline builds artifacts
3. Konfidence automatically creates vectors
4. Follow promotion rules through stages
5. Monitor deployments in delivery dashboard

### As an operator

1. Define and maintain paved roads
2. Monitor adherence and success rates
3. Measure delivery metrics
4. Improve processes based on data
5. Provide support and coaching

## Customization and exceptions

While paved roads provide standardization, allow for:

- Temporary exceptions with approval
- Team-specific variations with governance
- Custom test and validation steps
- Integration with team-specific tools

## Success metrics

Measure paved road effectiveness:

- Deployment frequency
- Lead time for changes
- Mean time to recovery
- Change failure rate
- Developer satisfaction

## See also

- [Define promotions](/docs/observe-improve/define-promotions) - Detailed promotion configuration
- [Build vectors](/docs/observe-improve/build-vectors) - Vector composition

