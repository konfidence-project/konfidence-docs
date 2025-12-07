<template>
  <div class="docs-cards-wrapper">
    <p class="intro">Welcome to the comprehensive documentation for Konfidence. Choose your path based on how you want to work with Konfidence.</p>
  
    

    <div class="docs-cards">
      <a href="/docs/user-guide/" class="docs-card">
        <h2>User Guide</h2>
        <h3>Develop & Integrate</h3>
        <p>Learn how to use Konfidence in your projects, integrate with your applications, and leverage the API.</p>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/getting-started/" @click.stop>Getting Started</a></li>
            <li><a href="/docs/user-guide/" @click.stop>User Guide Overview</a></li>
            <li><a href="/docs/core-concepts/" @click.stop>Core Concepts</a></li>
          </ul>
        </div>
      </a>

      <a href="/docs/operator-guide/" class="docs-card">
        <h2>Operator Guide</h2>
        <h3>Deploy & Operate</h3>
        <p>Deploy Konfidence in production environments, configure infrastructure, and manage operations.</p>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/operator-guide/" @click.stop>Operator Guide Overview</a></li>
            <li><a href="/docs/core-concepts/architecture-overview" @click.stop>Architecture Overview</a></li>
            <li><a href="/docs/getting-started/" @click.stop>Installation Guide</a></li>
          </ul>
        </div>
      </a>

      <a href="/docs/contributor-guide/" class="docs-card">
        <h2>Contributor Guide</h2>
        <h3>Extend & Customize</h3>
        <p>Join the Konfidence community, contribute code, extend functionality, and help shape the project.</p>
        <div class="links">
          <span>Useful Links</span>
          <ul>
            <li><a href="/docs/contributor-guide/" @click.stop>Contributor Guide Overview</a></li>
            <li><a href="/docs/core-concepts/architecture-overview" @click.stop>Architecture Overview</a></li>
            <li><a href="https://github.com/konfidence-project" @click.stop>GitHub Repository</a></li>
          </ul>
        </div>
      </a>
    </div>

    <hr>

    <!-- <h2>Additional Resources</h2>
    <div class="additional-resources">
      <div class="resource">
        <h3>📖 Introduction</h3>
        <p>Learn about Konfidence, its goals, and key features.</p>
        <a href="/docs/introduction/">Read more →</a>
      </div>
      <div class="resource">
        <h3>🏗️ Architecture</h3>
        <p>Understand the system architecture and design principles.</p>
        <a href="/docs/core-concepts/architecture-overview">Read more →</a>
      </div>
      <div class="resource">
        <h3>📚 Glossary</h3>
        <p>Quick reference for Konfidence terminology and concepts.</p>
        <a href="/docs/core-concepts/glossary">Read more →</a>
      </div>
    </div> -->
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
  margin-bottom: 3rem;
  text-align: center;
}

.docs-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.docs-card {
  background: var(--vp-c-bg-soft);
  border: 2px solid var(--vp-c-divider);
  border-radius: 12px;
  padding: 2rem;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: all 0.3s ease;
}

.docs-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

.docs-card h2 {
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--vp-c-brand-1);
}

.docs-card h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-2);
  font-weight: 600;
}

.docs-card > p {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.links {
  margin-top: 1.5rem;
}

.links span {
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  display: block;
  margin-bottom: 0.75rem;
}

.links ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.links li {
  margin-bottom: 0.5rem;
}

.links a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.links a:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

.links a:before {
  content: "→ ";
  margin-right: 0.25rem;
}

hr {
  margin: 3rem 0;
  border: none;
  border-top: 1px solid var(--vp-c-divider);
}

.additional-resources {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.resource {
  padding: 1.5rem;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
  border: 1px solid var(--vp-c-divider);
}

.resource h3 {
  font-size: 1.1rem;
  margin: 0 0 0.5rem 0;
}

.resource p {
  color: var(--vp-c-text-2);
  margin: 0 0 1rem 0;
}

.resource a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-weight: 500;
}

.resource a:hover {
  color: var(--vp-c-brand-2);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .docs-cards {
    grid-template-columns: 1fr;
  }
}
</style>
