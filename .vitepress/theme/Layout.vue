<template>
  <DefaultTheme.Layout>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #home-hero-after>
      <div class="hero-action-area">
        <div class="button-container">
          <a href="/docs/getting-started/quickstart" class="hero-button hero-button--primary">Get Konfidence running</a>
          <a href="/docs/" class="hero-button hero-button--secondary">Browse the docs</a>
        </div>
      </div>
      <FeatureOverview />
    </template>
    <template #home-features-after>
      <VPFooter />
    </template>
    <template #doc-after>
      <VPFooter />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import VPFooter from './components/VPFooter.vue'
import VPHeroInfo from './components/VPHeroInfo.vue'
import FeatureOverview from './components/FeatureOverview.vue'
</script>

<style scoped>
.hero-action-area {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  justify-content: flex-start;
}

.hero-button {
  padding: 0.78rem 1.35rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-block;
  text-decoration: none;
  line-height: 1.2;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--konfidence-orange), #FF960C);
  color: #201100;
  box-shadow: 0 12px 28px rgba(255, 150, 12, 0.22);
}

.hero-button--secondary {
  color: var(--konfidence-blue-dark);
  border: 1px solid rgba(19, 156, 199, 0.45);
  background: rgba(128, 210, 224, 0.12);
}

:global(.dark .hero-button--secondary) {
  color: var(--konfidence-blue-light);
  border-color: rgba(185, 230, 235, 0.38);
  background: rgba(31, 172, 208, 0.16);
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-button--primary:hover {
  box-shadow: 0 16px 34px rgba(255, 150, 12, 0.3);
}

.hero-button--secondary:hover {
  border-color: var(--konfidence-blue);
  color: var(--konfidence-blue);
}

.hero-button:active {
  transform: translateY(0);
}

:global(.VPHome .VPHero) {
  padding-bottom: 1.25rem;
}

@media (min-width: 960px) {
  :global(.VPHome .VPHero) {
    padding-bottom: 1.5rem;
  }
}

@media (max-width: 640px) {
  .hero-action-area {
    padding: 0 1.5rem 3rem;
  }

  .button-container {
    gap: 0.65rem;
  }

  .hero-button {
    width: 100%;
    text-align: center;
  }
}
</style>
