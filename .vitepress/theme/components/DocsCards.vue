<template>
  <div class="docs-cards-wrapper">
    <p class="intro">Select your role to find the documentation that matters most to you.</p>

    <div class="docs-cards">
      <a href="/docs/develop-integrate/" class="docs-card">
        <div class="card-header">
          <h2>Develop & Integrate</h2>
          <div class="role-tags">
            <span class="role-tag">Developer</span>
            <span class="role-tag">Architect</span>
            <span class="role-tag">Quality Engineer</span>
          </div>
        </div>
        <p class="card-description">Integrate Konfidence into your dev workflow. Ship features fast with short feedback loops.</p>
        <div class="jobs">
          <span class="jobs-label">What you can do here</span>
          <ul>
            <li>Integrate new microservices and features into Konfidence</li>
            <li>Test local changes quickly without promoting to master</li>
            <li>Set up automated feedback loops and E2E tests</li>
          </ul>
        </div>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/getting-started/" @click.stop>Getting Started</a></li>
            <li><a href="/docs/develop-integrate/" @click.stop>Develop & Integrate Overview</a></li>
            <li><a href="/docs/core-concepts/" @click.stop>Core Concepts</a></li>
          </ul>
        </div>
      </a>

      <a href="/docs/deploy-operate/" class="docs-card">
        <div class="card-header">
          <h2>Deploy & Operate</h2>
          <div class="role-tags">
            <span class="role-tag">DevOps Engineer</span>
            <span class="role-tag">Pipeline Engineer</span>
            <span class="role-tag">Infra Engineer</span>
          </div>
        </div>
        <p class="card-description">Install, configure, and run Konfidence in production. Manage promotion flows, monitor landscapes, and automate rollouts across regions.</p>
        <div class="jobs">
          <span class="jobs-label">What you can do here</span>
          <ul>
            <li>Install and configure Konfidence on clusters</li>
            <li>Set up and manage promotion flows across landscapes</li>
            <li>Monitor environments and respond to incidents</li>
          </ul>
        </div>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/deploy-operate/" @click.stop>Deploy & Operate Overview</a></li>
            <li><a href="/docs/core-concepts/konfidence-core-concepts" @click.stop>Core Concepts</a></li>
            <li><a href="/docs/getting-started/" @click.stop>Getting Started</a></li>
          </ul>
        </div>
      </a>

      <a href="/docs/observe-improve/" class="docs-card">
        <div class="card-header">
          <h2>Observe & Improve</h2>
          <div class="role-tags">
            <span class="role-tag">Product Manager</span>
            <span class="role-tag">Program Manager</span>
            <span class="role-tag">Delivery Manager</span>
          </div>
        </div>
        <p class="card-description">Get visibility into your delivery performance. Track DORA KPIs, monitor rollout status, and make data-driven release decisions.</p>
        <div class="jobs">
          <span class="jobs-label">What you can do here</span>
          <ul>
            <li>Track DORA KPIs and delivery performance metrics</li>
            <li>Monitor feature rollout status across environments</li>
            <li>Prepare audit logs and management insights for stakeholders</li>
          </ul>
        </div>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/observe-improve/" @click.stop>Observe & Improve Overview</a></li>
            <li><a href="/docs/core-concepts/" @click.stop>Core Concepts</a></li>
            <li><a href="/docs/core-concepts/glossary" @click.stop>Glossary</a></li>
          </ul>
        </div>
      </a>

      <a href="/docs/extend-customize/" class="docs-card">
        <div class="card-header">
          <h2>Extend & Customize</h2>
          <div class="role-tags">
            <span class="role-tag">Extension Developer</span>
            <span class="role-tag">OSS Contributor</span>
          </div>
        </div>
        <p class="card-description">Extend Konfidence or contribute to the project. Add runtimes, customize vector assembly, and shape the open-source ecosystem.</p>
        <div class="jobs">
          <span class="jobs-label">What you can do here</span>
          <ul>
            <li>Add custom deployment runtimes and extend ingress</li>
            <li>Automate and customize vector assembly workflows</li>
            <li>Contribute code, documentation, and issues to the project</li>
          </ul>
        </div>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/extend-customize/" @click.stop>Extend & Customize Overview</a></li>
            <li><a href="/docs/core-concepts/" @click.stop>Core Concepts</a></li>
            <li><a href="https://github.com/konfidence-project" @click.stop>GitHub Repository</a></li>
          </ul>
        </div>
      </a>
    </div>
  </div>
</template>

<style scoped>
.docs-cards-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.intro {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 2.5rem;
  text-align: center;
}

.docs-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
}

@media (max-width: 640px) {
  .docs-cards {
    grid-template-columns: 1fr;
  }
}

.docs-card {
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  transition: all 0.3s ease;
}

.docs-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.docs-card h2 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--vp-c-brand-1);
  font-weight: 700;
  line-height: 1.3;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.role-tag {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.2rem 0.65rem;
  border-radius: 999px;
  background: rgba(255, 203, 73, 0.18);
  color: #CC7700;
  border: 1px solid rgba(255, 150, 12, 0.3);
  white-space: nowrap;
}

:global(.dark) .role-tag {
  background: rgba(255, 170, 0, 0.15);
  color: #FFAA00;
  border-color: rgba(255, 170, 0, 0.25);
}

.card-description {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
  font-size: 0.95rem;
}

.jobs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.jobs-label {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-weight: 600;
}

.jobs ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.jobs li {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  padding-left: 1rem;
  position: relative;
}

.jobs li::before {
  content: "·";
  position: absolute;
  left: 0;
  color: #FF960C;
  font-weight: 700;
}

.links {
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--vp-c-divider);
}

.links > span {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  font-weight: 600;
  display: block;
  margin-bottom: 0.6rem;
}

.links ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.links a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.links a:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.links a::before {
  content: "→ ";
  margin-right: 0.25rem;
}
</style>
