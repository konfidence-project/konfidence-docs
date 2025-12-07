---
title: Documentation
description: Comprehensive documentation for Konfidence.
outline: false
editLink: true
lastUpdated: true
layout: doc
---

<style scoped>
.docs-home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.docs-intro {
  text-align: center;
  margin-bottom: 4rem;
}

.docs-intro h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  font-weight: 700;
}

.docs-intro p {
  font-size: 1.25rem;
  color: var(--vp-c-text-2);
  max-width: 700px;
  margin: 0 auto;
}

.guide-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.guide-card {
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.guide-card:hover {
  border-color: var(--vp-c-brand);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.guide-card h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  color: var(--vp-c-brand);
}

.guide-card .subtitle {
  font-size: 1.1rem;
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.guide-card .description {
  color: var(--vp-c-text-2);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.guide-card h4 {
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.75rem;
  color: var(--vp-c-text-2);
}

.guide-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.guide-card li {
  margin-bottom: 0.5rem;
}

.guide-card a {
  color: var(--vp-c-brand);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  transition: color 0.2s;
}

.guide-card a:hover {
  color: var(--vp-c-brand-dark);
  text-decoration: underline;
}

.guide-card a::before {
  content: "→";
  margin-right: 0.5rem;
  font-weight: bold;
}

.additional-resources {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--vp-c-divider);
}

.additional-resources h2 {
  text-align: center;
  margin-bottom: 2rem;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.resource-item {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.resource-item h3 {
  font-size: 1.1rem;
  margin-bottom: 0.5rem;
}

.resource-item p {
  color: var(--vp-c-text-2);
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .docs-intro h1 {
    font-size: 2rem;
  }

  .guide-cards {
    grid-template-columns: 1fr;
  }
}
</style>

<div class="docs-home">
  <div class="docs-intro">
    <h1>Konfidence Documentation</h1>
    <p>
      Welcome to the comprehensive documentation for Konfidence.
      Choose your path based on how you want to work with Konfidence.
    </p>
  </div>

  <div class="guide-cards">
    <div class="guide-card">
      <h3>User Guide</h3>
      <div class="subtitle">Develop & Integrate</div>
      <div class="description">
        Learn how to use Konfidence in your projects, integrate with your applications, and leverage the API.
      </div>
      <h4>Useful Links</h4>
      <ul>
        <li><a href="/docs/getting-started/">Getting Started</a></li>
        <li><a href="/docs/user-guide/">User Guide Overview</a></li>
        <li><a href="/docs/core-concepts/">Core Concepts</a></li>
      </ul>
    </div>

    <div class="guide-card">
      <h3>Operator Guide</h3>
      <div class="subtitle">Deploy & Operate</div>
      <div class="description">
        Deploy Konfidence in production environments, configure infrastructure, and manage operations.
      </div>
      <h4>Useful Links</h4>
      <ul>
        <li><a href="/docs/operator-guide/">Operator Guide Overview</a></li>
        <li><a href="/docs/core-concepts/architecture-overview">Architecture Overview</a></li>
        <li><a href="/docs/getting-started/">Installation Guide</a></li>
      </ul>
    </div>

    <div class="guide-card">
      <h3>Contributor Guide</h3>
      <div class="subtitle">Extend & Customize</div>
      <div class="description">
        Join the Konfidence community, contribute code, extend functionality, and help shape the project.
      </div>
      <h4>Useful Links</h4>
      <ul>
        <li><a href="/docs/contributor-guide/">Contributor Guide Overview</a></li>
        <li><a href="/docs/core-concepts/architecture-overview">Architecture Overview</a></li>
        <li><a href="https://github.com/konfidence-project" target="_blank">GitHub Repository</a></li>
      </ul>
    </div>
  </div>

  <div class="additional-resources">
    <h2>Additional Resources</h2>
    <div class="resource-grid">
      <div class="resource-item">
        <h3>📖 Introduction</h3>
        <p>Learn about Konfidence, its goals, and key features.</p>
        <a href="/docs/introduction/">Read more →</a>
      </div>
      <div class="resource-item">
        <h3>🏗️ Architecture</h3>
        <p>Understand the system architecture and design principles.</p>
        <a href="/docs/core-concepts/architecture-overview">Read more →</a>
      </div>
      <div class="resource-item">
        <h3>📚 Glossary</h3>
        <p>Quick reference for Konfidence terminology and concepts.</p>
        <a href="/docs/core-concepts/glossary">Read more →</a>
      </div>
    </div>
  </div>
</div>
