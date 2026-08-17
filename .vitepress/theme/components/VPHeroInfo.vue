<script setup lang="ts">
import { Check, Github } from 'lucide-vue-next'
import { withBase } from 'vitepress'

const logoUrl = withBase('/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg')
</script>

<template>
  <section class="hero-announce" aria-labelledby="hero-heading">
    <div class="hero-copy">
      <h1 id="hero-heading">Promote one application version from development to production.</h1>
      <p class="hero-lead">
        Konfidence helps platform and delivery teams deploy the same tested application version across environments without rebuilding it.
      </p>

      <div class="hero-actions">
        <a href="https://github.com/konfidence-project" class="hero-button hero-button--primary">
          <Github aria-hidden="true" />
          Follow on GitHub
        </a>
      </div>

      <ul class="hero-assurances" aria-label="Konfidence at a glance">
        <li><Check aria-hidden="true" />Immutable application versions</li>
        <li><Check aria-hidden="true" />Controlled promotions</li>
        <li><Check aria-hidden="true" />No rebuilds between environments</li>
      </ul>
    </div>

    <div class="hero-brand-visual" aria-hidden="true">
      <span class="brand-orbit brand-orbit--outer"></span>
      <span class="brand-orbit brand-orbit--inner"></span>
      <img :src="logoUrl" alt="" />
    </div>
  </section>
</template>

<style scoped>
.hero-announce {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.55fr);
  gap: clamp(3rem, 7vw, 7rem);
  align-items: center;
  width: 100%;
  max-width: 1200px;
  min-height: min(700px, calc(100vh - 95px));
  margin: 0 auto;
  padding: clamp(6.5rem, 9vw, 8rem) 1.5rem clamp(4.5rem, 8vw, 7rem);
  overflow: clip;
  box-sizing: border-box;
}

.hero-announce::before {
  content: '';
  position: absolute;
  z-index: -1;
  inset: 2% -12% auto 36%;
  height: 88%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 34% 42%, rgba(255, 170, 0, 0.19), transparent 42%),
    radial-gradient(circle at 72% 62%, rgba(19, 156, 199, 0.17), transparent 48%);
  filter: blur(18px);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.hero-copy h1 {
  max-width: 820px;
  margin: 0;
  color: var(--vp-c-text-1);
  font-size: clamp(3.25rem, 5.25vw, 4.8rem);
  font-weight: 760;
  letter-spacing: -0.055em;
  line-height: 1;
  text-wrap: balance;
}

.hero-lead {
  max-width: 620px;
  margin: 1.6rem 0 0;
  color: var(--vp-c-text-2);
  font-size: clamp(1.04rem, 1.45vw, 1.17rem);
  line-height: 1.62;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2rem;
}

.hero-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0.78rem 1.35rem;
  border: 1px solid transparent;
  border-radius: 999px;
  font-size: 0.96rem;
  font-weight: 750;
  line-height: 1.2;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.hero-button svg {
  width: 1rem;
  height: 1rem;
}

.hero-button--primary {
  color: #241300;
  background: var(--konfidence-gradient-action);
  box-shadow: 0 14px 30px rgba(255, 150, 12, 0.24);
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-button--primary:hover {
  box-shadow: 0 18px 38px rgba(255, 150, 12, 0.32);
}

.hero-assurances {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem 1.2rem;
  margin: 1.7rem 0 0;
  padding: 0;
  color: var(--vp-c-text-2);
  font-size: 0.82rem;
  font-weight: 600;
  list-style: none;
}

.hero-assurances li {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.hero-assurances svg {
  width: 0.92rem;
  height: 0.92rem;
  color: var(--konfidence-blue);
  stroke-width: 3;
}

.hero-brand-visual {
  position: relative;
  display: grid;
  place-items: center;
  width: min(100%, 370px);
  aspect-ratio: 1;
  justify-self: end;
}

.hero-brand-visual::before {
  content: '';
  position: absolute;
  inset: 12%;
  border-radius: 50%;
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 214, 0, 0.30), transparent 38%),
    radial-gradient(circle at 65% 70%, rgba(19, 156, 199, 0.24), transparent 52%),
    rgba(255, 255, 255, 0.42);
  box-shadow:
    0 34px 90px rgba(19, 156, 199, 0.13),
    0 16px 42px rgba(255, 170, 0, 0.13);
  backdrop-filter: blur(10px);
}

:global(.dark .hero-brand-visual::before) {
  background:
    radial-gradient(circle at 35% 30%, rgba(255, 214, 0, 0.18), transparent 38%),
    radial-gradient(circle at 65% 70%, rgba(31, 172, 208, 0.20), transparent 52%),
    rgba(255, 255, 255, 0.035);
  box-shadow:
    0 34px 90px rgba(0, 0, 0, 0.30),
    0 16px 42px rgba(255, 170, 0, 0.08);
}

.hero-brand-visual img {
  position: relative;
  z-index: 2;
  width: 62%;
  height: auto;
  filter:
    drop-shadow(0 26px 44px rgba(255, 170, 0, 0.24))
    drop-shadow(0 12px 24px rgba(19, 156, 199, 0.12));
}

.brand-orbit {
  position: absolute;
  border: 1px solid rgba(19, 156, 199, 0.18);
  border-radius: 50%;
}

.brand-orbit--outer {
  inset: 1%;
}

.brand-orbit--inner {
  inset: 7%;
  border-color: rgba(255, 170, 0, 0.20);
}

@media (max-width: 820px) {
  .hero-announce {
    grid-template-columns: 1fr;
    gap: 2.75rem;
    min-height: 0;
    padding-top: 7rem;
  }

  .hero-copy {
    max-width: 700px;
  }

  .hero-brand-visual {
    width: min(72vw, 300px);
    justify-self: center;
  }
}

@media (max-width: 640px) {
  .hero-announce {
    gap: 2rem;
    padding: 6.5rem 1.25rem 4rem;
  }

  .hero-copy h1 {
    font-size: clamp(2.7rem, 12.5vw, 3.45rem);
    line-height: 1.02;
  }

  .hero-lead {
    margin-top: 1.3rem;
    font-size: 1rem;
  }

  .hero-actions {
    display: grid;
  }

  .hero-button {
    width: 100%;
  }

  .hero-assurances {
    display: grid;
  }

  .hero-brand-visual {
    display: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-button {
    transition: none;
  }
}
</style>
