<template>
  <div class="feature-overview-wrapper">
    <section class="landing-section mission-section" aria-labelledby="mission-heading">
      <div class="mission-copy">
        <h2 id="mission-heading">Keep every release on a known flight path.</h2>
        <p>
          Konfidence is a software delivery framework for microservice-based SaaS applications. It helps teams define exactly what gets delivered, validate that version, and promote it through environments with a clear, repeatable delivery model.
        </p>
      </div>

      <div class="mission-strip" aria-label="Konfidence delivery model">
        <div class="mission-step">
          <span>01</span>
          <strong>Artifacts</strong>
          <p>Versioned build outputs and metadata.</p>
        </div>
        <div class="mission-step">
          <span>02</span>
          <strong>Vector</strong>
          <p>One immutable application version.</p>
        </div>
        <div class="mission-step">
          <span>03</span>
          <strong>Stages</strong>
          <p>The same verified version moves forward.</p>
        </div>
      </div>
    </section>

    <section class="landing-section orbit-section" aria-labelledby="problem-heading">
      <div class="orbit-copy">
        <h2 id="problem-heading">Enterprise delivery drifts when every environment becomes its own version of the truth.</h2>
      </div>
      <div class="orbit-points">
        <p>
          As services, teams, and release frequency grow, it becomes harder to know what was tested, what is running, and what is ready to promote.
        </p>
        <p>
          Konfidence counters that drift by making the application version immutable and moving the verified vector through a controlled stage model.
        </p>
      </div>
    </section>

    <section class="landing-section capabilities-section" aria-labelledby="capabilities">
      <div class="section-header section-header--center">
        <h2 id="capabilities">What teams get from Konfidence</h2>
      </div>

      <div class="feature-tiles">
        <div class="feature-tile">
          <span class="feature-label">Immutable versions</span>
          <h3><RefreshCcw class="tile-icon" />Reuse verified releases</h3>
          <p>Promote the same vector across environments and reuse shared service versions within a landscape when stages need the same artifact.</p>
        </div>

        <div class="feature-tile">
          <span class="feature-label">Stage-based flow</span>
          <h3><TrendingUp class="tile-icon" />Scale release control</h3>
          <p>Use stages and promotion flows to keep delivery understandable as systems, teams, and release frequency grow.</p>
        </div>

        <div class="feature-tile">
          <span class="feature-label">Build/release split</span>
          <h3><Zap class="tile-icon" />Reduce delivery friction</h3>
          <p>Separate build and release concerns so teams can deploy the validated application state instead of rebuilding per environment.</p>
        </div>

        <div class="feature-tile">
          <span class="feature-label">Galaxy and Star</span>
          <h3><Layers class="tile-icon" />Coordinate the landscape</h3>
          <p>Let Galaxy manage desired delivery state while Star executes deployments close to the target environment.</p>
        </div>
      </div>
    </section>

    <section class="landing-section control-section" aria-labelledby="control-heading">
      <div class="control-copy">
        <h2 id="control-heading">From build output to production without changing the payload.</h2>
        <p>
          Konfidence bridges CI/CD output and enterprise delivery governance by turning artifacts into a verifiable vector, then moving that vector through predefined stages after validation.
        </p>
      </div>

      <ol class="control-path" aria-label="Typical Konfidence delivery workflow">
        <li>
          <span>Build</span>
          <p>CI produces application outputs and registers Konfidence artifacts.</p>
        </li>
        <li>
          <span>Assemble</span>
          <p>Artifacts become one immutable application vector.</p>
        </li>
        <li>
          <span>Deploy</span>
          <p>The vector is rolled out to a target stage in a coordinated way.</p>
        </li>
        <li>
          <span>Promote</span>
          <p>The same verified vector moves forward without modification.</p>
        </li>
      </ol>
    </section>

    <section class="landing-section final-cta" aria-labelledby="next-step">
      <div class="final-cta-copy">
        <h2 id="next-step">See the delivery model in a running setup.</h2>
        <p>
          Open the docs overview to understand the project structure and choose the path that fits your role.
        </p>
      </div>
      <div class="cta-actions">
        <a href="/docs/" class="cta-button cta-button--primary">Explore Konfidence</a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { RefreshCcw, TrendingUp, Zap, Layers } from 'lucide-vue-next'
</script>

<style scoped>
.feature-overview-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 6rem;
}

.landing-section {
  margin-top: 6rem;
}

.landing-section:first-child {
  margin-top: 0;
}

.landing-section h2 {
  color: var(--vp-c-text-1);
  font-size: 2.05rem;
  line-height: 1.16;
  margin: 0;
  max-width: 760px;
}

.landing-section p {
  color: var(--vp-c-text-2);
  font-size: 1rem;
  line-height: 1.7;
}

.mission-section {
  display: grid;
  grid-template-columns: minmax(0, 0.96fr) minmax(320px, 1.04fr);
  gap: 2.75rem;
  align-items: center;
  padding: 3rem;
  border: 1px solid rgba(255, 170, 0, 0.32);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 170, 0, 0.14), rgba(19, 156, 199, 0.09)),
    var(--vp-c-bg);
  box-shadow: 0 24px 70px rgba(19, 156, 199, 0.10);
}

:global(.dark .mission-section) {
  border-color: rgba(255, 170, 0, 0.30);
  background:
    linear-gradient(135deg, rgba(255, 170, 0, 0.14), rgba(31, 172, 208, 0.14)),
    var(--vp-c-bg);
}

.mission-copy p {
  max-width: 62ch;
  margin: 1.1rem 0 0;
}

.mission-strip {
  position: relative;
  display: grid;
  gap: 1rem;
  padding-left: 1.25rem;
}

.mission-strip::before {
  content: '';
  position: absolute;
  top: 0.45rem;
  bottom: 0.45rem;
  left: 0;
  width: 3px;
  border-radius: 999px;
  background: linear-gradient(180deg, var(--konfidence-orange), var(--konfidence-blue));
}

.mission-step {
  display: grid;
  grid-template-columns: 3.2rem minmax(0, 1fr);
  gap: 0.35rem 1rem;
  align-items: start;
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.50);
}

:global(.dark .mission-step) {
  background: rgba(255, 255, 255, 0.04);
}

.mission-step span {
  grid-row: 1 / 3;
  color: var(--konfidence-blue-dark);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.2;
}

:global(.dark .mission-step span) {
  color: var(--konfidence-blue-light);
}

.mission-step strong {
  color: var(--vp-c-text-1);
  font-size: 1rem;
  line-height: 1.3;
}

.mission-step p {
  font-size: 0.9rem;
  line-height: 1.5;
  margin: 0;
}

.orbit-section {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 3.25rem;
  align-items: start;
  padding: 4rem 0;
  border-top: 1px solid var(--vp-c-divider);
  border-bottom: 1px solid var(--vp-c-divider);
}

.orbit-points {
  display: grid;
  gap: 1.25rem;
}

.orbit-points p {
  margin: 0;
}

.section-header {
  max-width: 760px;
}

.section-header--center {
  margin: 0 auto 2.75rem;
  text-align: center;
}

.section-header--center h2 {
  margin: 0 auto;
}

.feature-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
}

.feature-tile {
  display: flex;
  flex-direction: column;
  min-height: 252px;
  padding: 1.5rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
  box-shadow: 0 14px 34px rgba(19, 156, 199, 0.08);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.feature-tile::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--konfidence-orange), var(--konfidence-blue));
}

.feature-tile:hover {
  border-color: rgba(19, 156, 199, 0.50);
  box-shadow: 0 18px 42px rgba(19, 156, 199, 0.12);
  transform: translateY(-2px);
}

.feature-label {
  color: var(--konfidence-blue-dark);
  font-size: 0.72rem;
  font-weight: 800;
  line-height: 1.35;
  margin-bottom: 1rem;
  text-transform: uppercase;
}

:global(.dark .feature-label) {
  color: var(--konfidence-blue-light);
}

.feature-tile h3 {
  color: var(--vp-c-text-1);
  display: flex;
  align-items: flex-start;
  gap: 0.55rem;
  font-size: 1.04rem;
  font-weight: 700;
  line-height: 1.32;
  margin: 0 0 1rem;
}

.tile-icon {
  width: 1.18rem;
  height: 1.18rem;
  flex-shrink: 0;
  color: var(--konfidence-blue);
  margin-top: 0.08rem;
}

.feature-tile p {
  color: var(--vp-c-text-2);
  flex-grow: 1;
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
}

.control-section {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 3rem;
  align-items: start;
}

.control-copy p {
  max-width: 60ch;
  margin: 1rem 0 0;
}

.control-path {
  display: grid;
  gap: 0.8rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.control-path li {
  display: grid;
  grid-template-columns: 7.5rem minmax(0, 1fr);
  gap: 1rem;
  align-items: baseline;
  padding: 1rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.control-path li:first-child {
  border-top: 1px solid var(--vp-c-divider);
}

.control-path span {
  color: var(--konfidence-orange);
  font-size: 0.82rem;
  font-weight: 800;
  line-height: 1.3;
  text-transform: uppercase;
}

.control-path p {
  font-size: 0.92rem;
  line-height: 1.58;
  margin: 0;
}

.final-cta {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2.5rem;
  align-items: center;
  padding: 2.5rem;
  border: 1px solid rgba(255, 170, 0, 0.38);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(255, 170, 0, 0.18), rgba(19, 156, 199, 0.11)),
    var(--vp-c-bg);
}

:global(.dark .final-cta) {
  background:
    linear-gradient(135deg, rgba(255, 170, 0, 0.14), rgba(31, 172, 208, 0.14)),
    var(--vp-c-bg);
}

.final-cta-copy {
  max-width: 760px;
}

.final-cta p {
  margin: 1rem 0 0;
}

.cta-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 220px;
}

.cta-button {
  display: inline-flex;
  justify-content: center;
  padding: 0.78rem 1.2rem;
  border-radius: 999px;
  font-weight: 700;
  line-height: 1.2;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
}

.cta-button--primary {
  background: linear-gradient(135deg, var(--konfidence-orange), #FF960C);
  color: #211100;
  box-shadow: 0 12px 26px rgba(255, 150, 12, 0.24);
}

.cta-button--secondary {
  color: var(--konfidence-blue-dark);
  border: 1px solid rgba(19, 156, 199, 0.45);
  background: rgba(128, 210, 224, 0.10);
}

:global(.dark .cta-button--secondary) {
  color: var(--konfidence-blue-light);
  border-color: rgba(185, 230, 235, 0.38);
  background: rgba(31, 172, 208, 0.16);
}

.cta-button:hover {
  transform: translateY(-2px);
}

.cta-button--primary:hover {
  box-shadow: 0 16px 34px rgba(255, 150, 12, 0.32);
}

.cta-button--secondary:hover {
  border-color: var(--konfidence-blue);
  color: var(--konfidence-blue);
}

@media (max-width: 1024px) {
  .landing-section {
    margin-top: 5rem;
  }

  .landing-section:first-child {
    margin-top: 0;
  }

  .mission-section,
  .orbit-section,
  .control-section,
  .final-cta {
    grid-template-columns: 1fr;
  }

  .feature-tiles {
    grid-template-columns: repeat(2, 1fr);
  }

  .cta-actions {
    flex-direction: row;
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .feature-overview-wrapper {
    padding: 0 1.5rem 4.5rem;
  }

  .landing-section {
    margin-top: 3.75rem;
  }

  .landing-section:first-child {
    margin-top: 0;
  }

  .mission-section,
  .final-cta {
    padding: 1.5rem;
  }

  .mission-section,
  .orbit-section,
  .control-section,
  .final-cta {
    gap: 1.75rem;
  }

  .orbit-section {
    padding: 3rem 0;
  }

  .landing-section h2 {
    font-size: 1.48rem;
    line-height: 1.22;
  }

  .mission-step,
  .control-path li {
    grid-template-columns: 1fr;
  }

  .mission-step span {
    grid-row: auto;
  }

  .feature-tiles {
    grid-template-columns: 1fr;
  }

  .feature-tile {
    min-height: 0;
  }

  .section-header--center {
    margin-bottom: 1.75rem;
    text-align: left;
  }

  .section-header--center h2 {
    margin: 0;
  }

  .cta-actions {
    flex-direction: column;
  }
}
</style>
