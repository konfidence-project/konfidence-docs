<script setup>
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Check,
  CircleAlert,
  Github,
  Layers3,
  Package,
  Recycle,
  Rocket,
  ShieldCheck,
  Users,
} from 'lucide-vue-next'

const prerelease = __PRERELEASE__
</script>

<template>
  <div class="feature-overview-wrapper">
    <section class="landing-section problem-section" aria-labelledby="problem-heading">
      <div class="section-intro">
        <p class="section-eyebrow">The delivery problem</p>
        <h2 id="problem-heading">Every environment can become a different version of the truth.</h2>
        <p class="section-lead">
          As services, teams, and release frequency grow, it becomes harder to answer three basic questions: What was tested? What is running? What is ready to go next?
        </p>
      </div>

      <div class="truth-comparison">
        <article class="truth-panel truth-panel--problem">
          <CircleAlert aria-hidden="true" />
          <div>
            <span>Without a shared delivery model</span>
            <h3>Builds and configuration drift between environments.</h3>
            <p>Teams reconstruct application state for every target and lose confidence in the handoff to production.</p>
          </div>
        </article>
        <ArrowRight class="comparison-arrow" aria-hidden="true" />
        <article class="truth-panel truth-panel--solution">
          <ShieldCheck aria-hidden="true" />
          <div>
            <span>With Konfidence</span>
            <h3>One exact application version follows a controlled path.</h3>
            <p>The tested version stays immutable while promotions make the next desired deployment explicit.</p>
          </div>
        </article>
      </div>
    </section>

    <section class="landing-section capabilities-section" aria-labelledby="capabilities-heading">
      <div class="section-intro section-intro--center">
        <p class="section-eyebrow">Why Konfidence</p>
        <h2 id="capabilities-heading">Keep application versions consistent and traceable.</h2>
        <p class="section-lead">
          Konfidence separates the application version from its target environment. Teams can promote the same version and see what should run at every stage.
        </p>
      </div>

      <div class="feature-tiles">
        <article class="feature-tile">
          <span class="feature-icon"><ShieldCheck aria-hidden="true" /></span>
          <span class="feature-label">Immutable application versions</span>
          <h3>Know exactly what will be deployed</h3>
          <p>Every application version is recorded as a fixed set of service outputs, configuration, and metadata. What was tested cannot silently change later.</p>
        </article>

        <article class="feature-tile">
          <span class="feature-icon"><ArrowUpRight aria-hidden="true" /></span>
          <span class="feature-label">Controlled promotions</span>
          <h3>Promote without rebuilding</h3>
          <p>A promotion points the next delivery checkpoint to the same concrete application version. Nothing is copied, rebuilt, or modified along the way.</p>
        </article>

        <article class="feature-tile">
          <span class="feature-icon"><Recycle aria-hidden="true" /></span>
          <span class="feature-label">Artifact reuse</span>
          <h3>Reuse unchanged service deployments</h3>
          <p>Konfidence can reuse an unchanged service deployment for multiple application versions in the same environment. This avoids duplicate deployments.</p>
        </article>

        <article class="feature-tile">
          <span class="feature-icon"><Layers3 aria-hidden="true" /></span>
          <span class="feature-label">Unified control plane</span>
          <h3>See the intended and running state</h3>
          <p>Define delivery centrally and let Konfidence coordinate execution in each target environment. Teams see the intended version and the running state in one model.</p>
        </article>
      </div>
    </section>

    <section id="workflow" class="landing-section workflow-section" aria-labelledby="workflow-heading">
      <div class="workflow-heading-row">
        <div class="section-intro">
          <p class="section-eyebrow">How it works</p>
          <h2 id="workflow-heading">From build output to production in four steps.</h2>
          <p class="section-lead">
            Konfidence connects CI output with controlled deployment. A stage is a delivery checkpoint such as development, test, or production.
          </p>
        </div>
      </div>

      <ol class="workflow-path" aria-label="Typical Konfidence delivery workflow">
        <li>
          <span class="workflow-number">01</span>
          <span class="workflow-icon"><Package aria-hidden="true" /></span>
          <div>
            <h3>Build</h3>
            <p>CI produces versioned service outputs and registers them with Konfidence.</p>
          </div>
        </li>
        <li>
          <span class="workflow-number">02</span>
          <span class="workflow-icon"><Boxes aria-hidden="true" /></span>
          <div>
            <h3>Assemble</h3>
            <p>Those outputs and configuration become one immutable application version.</p>
          </div>
        </li>
        <li>
          <span class="workflow-number">03</span>
          <span class="workflow-icon"><Rocket aria-hidden="true" /></span>
          <div>
            <h3>Deploy</h3>
            <p>A stage declares which exact application version should run at that checkpoint.</p>
          </div>
        </li>
        <li>
          <span class="workflow-number">04</span>
          <span class="workflow-icon"><ArrowUpRight aria-hidden="true" /></span>
          <div>
            <h3>Promote</h3>
            <p>The next stage is updated to reference that same version, which triggers deployment there. The application version itself remains unchanged.</p>
          </div>
        </li>
      </ol>
    </section>

    <section class="landing-section audience-section" aria-labelledby="audience-heading">
      <div class="audience-copy">
        <p class="section-eyebrow">Who it is for</p>
        <h2 id="audience-heading">For teams that own reliable software delivery.</h2>
        <p class="section-lead">
          Konfidence is designed for organizations that operate complex SaaS products across multiple environments.
        </p>
      </div>

      <div class="audience-list">
        <div>
          <Users aria-hidden="true" />
          <span><strong>Platform teams</strong> standardizing how applications are delivered.</span>
        </div>
        <div>
          <Check aria-hidden="true" />
          <span><strong>Release and delivery teams</strong> coordinating safe production changes.</span>
        </div>
        <div>
          <Layers3 aria-hidden="true" />
          <span><strong>Engineering leaders</strong> who need traceability across services and environments.</span>
        </div>
      </div>
    </section>

    <section class="landing-section final-cta" aria-labelledby="next-step">
      <div class="final-cta-copy">
        <p class="section-eyebrow">Next step</p>
        <template v-if="prerelease">
          <h2 id="next-step">Follow Konfidence as the platform takes shape.</h2>
          <p>Konfidence is under active development. Watch the project on GitHub for progress and release updates.</p>
        </template>
        <template v-else>
          <h2 id="next-step">Start with Konfidence.</h2>
          <p>Run the quickstart or explore the documentation to understand the delivery model.</p>
        </template>
      </div>
      <div class="cta-actions">
        <a v-if="prerelease" href="https://github.com/konfidence-project" class="cta-button cta-button--primary">
          <Github aria-hidden="true" />
          Follow on GitHub
        </a>
        <a v-else href="/docs/" class="cta-button cta-button--primary">
          Explore Konfidence
          <ArrowRight aria-hidden="true" />
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.feature-overview-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 6.5rem;
}

.landing-section {
  margin-top: clamp(5.5rem, 10vw, 9rem);
}

.landing-section:first-child {
  margin-top: 0;
}

.section-intro {
  max-width: 720px;
}

.section-intro--center {
  margin: 0 auto;
  text-align: center;
}

.section-eyebrow {
  margin: 0 0 1rem;
  color: var(--konfidence-blue-dark) !important;
  font-size: 0.75rem !important;
  font-weight: 800;
  letter-spacing: 0.09em;
  line-height: 1.4 !important;
  text-transform: uppercase;
}

:global(.dark .section-eyebrow) {
  color: var(--konfidence-blue-light) !important;
}

.landing-section h2 {
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(2.15rem, 4vw, 3.65rem);
  font-weight: 700;
  letter-spacing: -0.045em;
  line-height: 1.04;
  text-wrap: balance;
}

.landing-section p {
  color: var(--vp-c-text-2);
}

.section-lead {
  max-width: 64ch;
  margin: 1.35rem 0 0;
  font-size: 1.04rem;
  line-height: 1.72;
}

.section-intro--center .section-lead {
  margin-right: auto;
  margin-left: auto;
}

.problem-section {
  padding: clamp(3rem, 6vw, 5rem);
  overflow: hidden;
  border: 1px solid var(--konfidence-surface-border);
  border-radius: 28px;
  background: var(--konfidence-gradient-surface);
}

.truth-comparison {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 1.25rem;
  align-items: stretch;
  margin-top: 3rem;
}

.truth-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 18px;
  background: var(--konfidence-gradient-card);
}

.truth-panel > svg {
  width: 1.35rem;
  height: 1.35rem;
  margin-top: 0.1rem;
}

.truth-panel--problem > svg {
  color: var(--vp-c-text-3);
}

.truth-panel--solution {
  border-color: rgba(19, 156, 199, 0.30);
  box-shadow: 0 18px 45px rgba(19, 156, 199, 0.09);
}

.truth-panel--solution > svg {
  color: var(--konfidence-blue);
}

.truth-panel span {
  color: var(--vp-c-text-3);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.truth-panel h3 {
  margin: 0.55rem 0 0;
  color: var(--vp-c-text-1);
  font-size: 1.05rem;
  line-height: 1.38;
}

.truth-panel p {
  margin: 0.75rem 0 0;
  font-size: 0.87rem;
  line-height: 1.62;
}

.comparison-arrow {
  width: 1.25rem;
  color: var(--konfidence-orange);
  align-self: center;
}

.feature-tiles {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  margin-top: 3.25rem;
}

.feature-tile {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  grid-template-rows: auto auto 1fr;
  gap: 0 1rem;
  min-height: 230px;
  padding: 1.75rem;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 20px;
  background: var(--konfidence-gradient-card);
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.feature-tile::after {
  content: '';
  position: absolute;
  inset: auto -10% -55% 48%;
  height: 75%;
  border-radius: 50%;
  background: rgba(19, 156, 199, 0.08);
  filter: blur(26px);
  pointer-events: none;
}

.feature-tile:hover {
  border-color: rgba(19, 156, 199, 0.35);
  box-shadow: 0 22px 54px rgba(19, 156, 199, 0.10);
  transform: translateY(-3px);
}

.feature-icon {
  display: inline-flex;
  grid-row: 1 / 4;
  align-items: center;
  justify-content: center;
  width: 2.8rem;
  height: 2.8rem;
  border-radius: 13px;
  color: var(--konfidence-blue-dark);
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.16), rgba(19, 156, 199, 0.14));
}

:global(.dark .feature-icon) {
  color: var(--konfidence-blue-light);
}

.feature-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.feature-label {
  color: var(--konfidence-blue-dark);
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.055em;
  line-height: 1.35;
  text-transform: uppercase;
}

:global(.dark .feature-label) {
  color: var(--konfidence-blue-light);
}

.feature-tile h3 {
  margin: 0.55rem 0 0;
  color: var(--vp-c-text-1);
  font-size: 1.25rem;
  line-height: 1.3;
}

.feature-tile p {
  position: relative;
  z-index: 1;
  margin: 0.85rem 0 0;
  font-size: 0.91rem;
  line-height: 1.65;
}

.workflow-section {
  scroll-margin-top: 7rem;
}

.workflow-heading-row {
  max-width: 780px;
}

.workflow-path {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0;
  margin: 3.5rem 0 0;
  padding: 0;
  list-style: none;
  counter-reset: workflow;
}

.workflow-path li {
  position: relative;
  display: grid;
  align-content: start;
  min-height: 260px;
  padding: 1.45rem;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
  border-left: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
}

.workflow-path li:first-child {
  border-radius: 18px 0 0 18px;
}

.workflow-path li:last-child {
  border-right: 1px solid var(--vp-c-divider);
  border-radius: 0 18px 18px 0;
}

.workflow-path li:not(:last-child)::after {
  content: '';
  position: absolute;
  z-index: 2;
  top: 3.25rem;
  right: -0.36rem;
  width: 0.7rem;
  height: 0.7rem;
  border-top: 1px solid var(--vp-c-divider);
  border-right: 1px solid var(--vp-c-divider);
  background: var(--vp-c-bg);
  transform: rotate(45deg);
}

.workflow-number {
  color: var(--vp-c-text-3);
  font-size: 0.69rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.workflow-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  margin-top: 1.4rem;
  border-radius: 50%;
  color: var(--konfidence-blue-dark);
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.18), rgba(19, 156, 199, 0.15));
}

:global(.dark .workflow-icon) {
  color: var(--konfidence-blue-light);
}

.workflow-icon svg {
  width: 1.25rem;
  height: 1.25rem;
}

.workflow-path h3 {
  margin: 1.25rem 0 0;
  color: var(--vp-c-text-1);
  font-size: 1.15rem;
}

.workflow-path p {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
  line-height: 1.62;
}

.audience-section {
  padding: clamp(3rem, 6vw, 5rem);
  border: 1px solid var(--konfidence-surface-border);
  border-radius: 28px;
  background: var(--konfidence-gradient-surface);
}

.audience-copy {
  max-width: 780px;
}

.audience-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-top: 2.5rem;
}

.audience-list > div {
  display: grid;
  align-content: start;
  gap: 1rem;
  align-items: start;
  min-height: 180px;
  padding: 1.35rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  background: var(--konfidence-gradient-card);
}

.audience-list svg {
  box-sizing: border-box;
  width: 2.65rem;
  height: 2.65rem;
  padding: 0.7rem;
  border-radius: 12px;
  color: var(--konfidence-blue-dark);
  background: linear-gradient(135deg, rgba(255, 170, 0, 0.16), rgba(19, 156, 199, 0.14));
}

:global(.dark .audience-list svg) {
  color: var(--konfidence-blue-light);
}

.audience-list span {
  color: var(--vp-c-text-2);
  font-size: 0.9rem;
  line-height: 1.55;
}

.audience-list strong {
  display: block;
  margin-bottom: 0.35rem;
  color: var(--vp-c-text-1);
  font-size: 1rem;
}

.final-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 3rem;
  align-items: center;
  padding: clamp(2.25rem, 5vw, 4rem);
  overflow: hidden;
  border: 1px solid var(--konfidence-surface-border);
  border-radius: 28px;
  background: var(--konfidence-gradient-surface);
}

.final-cta-copy {
  max-width: 780px;
}

.final-cta-copy > p:last-child {
  max-width: 62ch;
  margin: 1rem 0 0;
  font-size: 0.98rem;
  line-height: 1.65;
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 210px;
}

.cta-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0.8rem 1.35rem;
  border-radius: 999px;
  font-size: 0.96rem;
  font-weight: 750;
  line-height: 1.2;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.cta-button svg {
  width: 1rem;
  height: 1rem;
}

.cta-button--primary {
  color: #241300;
  background: var(--konfidence-gradient-action);
  box-shadow: 0 14px 30px rgba(255, 150, 12, 0.24);
}

.cta-button:hover {
  box-shadow: 0 18px 38px rgba(255, 150, 12, 0.32);
  transform: translateY(-2px);
}

@media (max-width: 960px) {
  .final-cta {
    grid-template-columns: 1fr;
  }

  .workflow-path {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
  }

  .workflow-path li,
  .workflow-path li:first-child,
  .workflow-path li:last-child {
    min-height: 235px;
    border: 1px solid var(--vp-c-divider);
    border-radius: 16px;
  }

  .workflow-path li::after {
    display: none;
  }

  .cta-actions {
    min-width: 0;
  }
}

@media (max-width: 720px) {
  .feature-overview-wrapper {
    padding: 0 1.25rem 4.5rem;
  }

  .landing-section {
    margin-top: 5rem;
  }

  .problem-section {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .truth-comparison,
  .feature-tiles,
  .workflow-path,
  .audience-list {
    grid-template-columns: 1fr;
  }

  .comparison-arrow {
    justify-self: center;
    transform: rotate(90deg);
  }

  .truth-panel {
    padding: 1.2rem;
  }

  .feature-tile {
    min-height: 0;
    padding: 1.4rem;
  }

  .workflow-path {
    margin-top: 2.5rem;
  }

  .workflow-path li,
  .workflow-path li:first-child,
  .workflow-path li:last-child {
    min-height: 0;
  }

  .audience-section {
    padding: 1.5rem;
    border-radius: 20px;
  }

  .audience-list > div {
    min-height: 0;
  }

  .final-cta {
    gap: 2rem;
    padding: 1.6rem;
    border-radius: 20px;
  }

  .cta-button {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .feature-tile,
  .cta-button {
    transition: none;
  }
}
</style>
