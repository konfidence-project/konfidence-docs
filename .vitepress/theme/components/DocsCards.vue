<template>
  <div class="docs-cards-wrapper">
    <h1>Documentation overview</h1>
    <p class="intro">Not sure where to start? Pick the section that fits your work.</p>

    <div class="docs-cards">
      <a href="/docs/develop-integrate/" class="docs-card docs-card--blue">
        <div class="card-header">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/></svg>
          </div>
          <h2>Develop & Integrate</h2>
          <div class="role-tags">
            <span class="role-tag">Developer</span>
            <span class="role-tag">Architect</span>
            <span class="role-tag">Quality Engineer</span>
          </div>
        </div>
        <p class="card-description">Integrate Konfidence into your dev workflow. Publish artifacts, build vectors, and define promotions.</p>
        <ul class="card-links">
          <li><a href="/docs/develop-integrate/publish-artifacts/" @click.stop>Publish Artifacts</a></li>
          <li><a href="/docs/develop-integrate/observe-improve/build-vectors/" @click.stop>Build Vectors</a></li>
          <li><a href="/docs/develop-integrate/observe-improve/define-promotions/" @click.stop>Define Promotions</a></li>
        </ul>
      </a>

      <a href="/docs/deploy-operate/" class="docs-card docs-card--teal">
        <div class="card-header">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>
          </div>
          <h2>Deploy & Operate</h2>
          <div class="role-tags">
            <span class="role-tag">DevOps Engineer</span>
            <span class="role-tag">Pipeline Engineer</span>
            <span class="role-tag">Infra Engineer</span>
          </div>
        </div>
        <p class="card-description">Install, configure, and run Konfidence. Manage installations and promotion flows.</p>
        <ul class="card-links">
          <li><a href="/docs/deploy-operate/installation-variants" @click.stop>Installation Variants</a></li>
        </ul>
      </a>

      <!-- Observe & Deliver card — hidden until the section is ready
      <a href="/docs/develop-integrate/observe-improve/" class="docs-card docs-card--amber">
        <div class="card-header">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="15" y="5" width="4" height="12" rx="1"/><rect x="7" y="8" width="4" height="9" rx="1"/></svg>
          </div>
          <h2>Observe & Deliver</h2>
          <div class="role-tags">
            <span class="role-tag">Product Manager</span>
            <span class="role-tag">Program Manager</span>
            <span class="role-tag">Delivery Manager</span>
          </div>
        </div>
        <p class="card-description">Get visibility into your delivery performance. Track DORA KPIs, monitor rollout status, and make data-driven release decisions.</p>
        <ul class="card-links">
          <li><a href="/docs/develop-integrate/observe-improve/" @click.stop>Observe & Deliver Overview</a></li>
          <li><a href="/docs/core-concepts/" @click.stop>Core Concepts</a></li>
          <li><a href="/docs/reference/glossary" @click.stop>Glossary</a></li>
        </ul>
      </a>
      -->

      <a href="/docs/extend-customize/" class="docs-card docs-card--orange">
        <div class="card-header">
          <div class="card-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15.39 4.39a1 1 0 0 0 1.68-.474 2.5 2.5 0 1 1 3.014 3.015 1 1 0 0 0-.474 1.68l1.683 1.682a2.414 2.414 0 0 1 0 3.414L19.61 15.39a1 1 0 0 1-1.68-.474 2.5 2.5 0 1 0-3.014 3.015 1 1 0 0 1 .474 1.68l-1.683 1.682a2.414 2.414 0 0 1-3.414 0L8.61 19.61a1 1 0 0 0-1.68.474 2.5 2.5 0 1 1-3.014-3.015 1 1 0 0 0 .474-1.68l-1.683-1.682a2.414 2.414 0 0 1 0-3.414L4.39 8.61a1 1 0 0 1 1.68.474 2.5 2.5 0 1 0 3.014-3.015 1 1 0 0 1-.474-1.68l1.683-1.682a2.414 2.414 0 0 1 3.414 0z"/></svg>
          </div>
          <h2>Extend & Customize</h2>
          <div class="role-tags">
            <span class="role-tag">Extension Developer</span>
            <span class="role-tag">OSS Contributor</span>
          </div>
        </div>
        <p class="card-description">Extend Konfidence or contribute to the project. Add runtimes, customize vector assembly, and shape the open-source ecosystem.</p>
        <ul class="card-links">
          <li><a href="/docs/extend-customize/code-of-conduct" @click.stop>Contributing</a></li>
          <li><a href="/docs/extend-customize/styleguide" @click.stop>Styleguide</a></li>
        </ul>
      </a>
    </div>
  </div>
</template>

<style scoped>
/* ── Wrapper ── */
.docs-cards-wrapper {
  padding: 0.25rem 0 2.5rem;
}

.intro {
  font-size: 1.15rem;
  font-weight: 500;
  color: var(--vp-c-text-1);
  margin-bottom: 1.75rem;
  text-align: center;
  letter-spacing: -0.01em;
}

/* ── 3-column Grid ── */
.docs-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
}

@media (max-width: 768px) {
  .docs-cards {
    grid-template-columns: 1fr;
  }
}

/* ── Card base ── */
.docs-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  text-decoration: none;
  color: inherit;
  overflow: hidden;
  transition: box-shadow 0.2s ease, transform 0.2s ease, border-color 0.2s ease;
}

/* Colored top stripe */
.docs-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
}

.docs-card--blue::before   { background: #139CC7; }
.docs-card--teal::before   { background: #0E7FA3; }
.docs-card--amber::before  { background: #FFAA00; }
.docs-card--orange::before { background: #FF960C; }

/* Hover */
.docs-card--blue:hover,
.docs-card--teal:hover   { border-color: #139CC7; box-shadow: 0 6px 24px rgba(19, 156, 199, 0.12); }
.docs-card--amber:hover  { border-color: #FFAA00; box-shadow: 0 6px 24px rgba(255, 170, 0, 0.14); }
.docs-card--orange:hover { border-color: #FF960C; box-shadow: 0 6px 24px rgba(255, 150, 12, 0.14); }

.docs-card:hover {
  transform: translateY(-3px);
}

/* ── Header ── */
.card-header {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding-top: 0.25rem;
}

.card-icon {
  display: flex;
  align-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--vp-c-bg-soft);
  padding: 8px;
  flex-shrink: 0;
}

.card-icon svg {
  width: 22px;
  height: 22px;
}

.docs-card--blue .card-icon svg,
.docs-card--teal .card-icon svg  { color: #139CC7; }
.docs-card--amber .card-icon svg { color: #9C6200; }
.docs-card--orange .card-icon svg { color: #B05500; }

:global(.dark) .docs-card--amber .card-icon svg  { color: #FFAA00; }
:global(.dark) .docs-card--orange .card-icon svg { color: #FF960C; }

.docs-card h2 {
  font-size: 1.2rem;
  font-weight: 700;
  margin: 0;
  line-height: 1.3;
}

.docs-card--blue h2,
.docs-card--teal h2  { color: var(--vp-c-brand-1); }
.docs-card--amber h2 { color: #9C6200; }
.docs-card--orange h2 { color: #B05500; }

:global(.dark) .docs-card--amber h2  { color: #FFAA00; }
:global(.dark) .docs-card--orange h2 { color: #FF960C; }

/* ── Role tags ── */
.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.role-tag {
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
  background: rgba(255, 203, 73, 0.16);
  color: #CC7700;
  border: 1px solid rgba(255, 150, 12, 0.28);
}

:global(.dark) .role-tag {
  background: rgba(255, 170, 0, 0.13);
  color: #FFAA00;
  border-color: rgba(255, 170, 0, 0.22);
}

/* ── Description ── */
.card-description {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}

/* ── Links ── */
.card-links {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.card-links a {
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.15s ease;
}

.card-links a::before {
  content: "→ ";
  font-size: 0.8rem;
}

.docs-card--blue .card-links a,
.docs-card--teal .card-links a  { color: var(--vp-c-brand-1); }
.docs-card--amber .card-links a { color: #9C6200; }
.docs-card--orange .card-links a { color: #B05500; }

.docs-card--blue .card-links a:hover,
.docs-card--teal .card-links a:hover  { color: var(--vp-c-brand-2); }
.docs-card--amber .card-links a:hover { color: #7A4C00; }
.docs-card--orange .card-links a:hover { color: #8A4000; }

:global(.dark) .docs-card--amber .card-links a  { color: #FFAA00; }
:global(.dark) .docs-card--orange .card-links a { color: #FF960C; }

/* ── Footer CTA ── */
.card-footer {
  margin-top: auto;
  padding-top: 0.85rem;
  border-top: 1px solid var(--vp-c-divider);
  font-size: 0.875rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.card-footer .arrow {
  display: inline-block;
  transition: transform 0.2s ease;
}

.docs-card:hover .card-footer .arrow {
  transform: translateX(4px);
}

.docs-card--blue .card-footer,
.docs-card--teal .card-footer  { color: var(--vp-c-brand-1); }
.docs-card--amber .card-footer { color: #9C6200; }
.docs-card--orange .card-footer { color: #B05500; }

:global(.dark) .docs-card--amber .card-footer  { color: #FFAA00; }
:global(.dark) .docs-card--orange .card-footer { color: #FF960C; }
</style>
