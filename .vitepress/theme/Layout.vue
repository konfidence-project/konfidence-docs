<template>
  <DefaultTheme.Layout>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #home-hero-after>
      <div class="button-container">
        <a href="/docs/introduction/what-is-konfidence.html" class="what-is-button">What is Konfidence?</a>
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
.button-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: flex-start;
  padding: 2rem 1.5rem;
}

.what-is-button {
  padding: 0.75rem 2.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
  background: transparent;
  color: var(--vp-c-brand-1);
}

.what-is-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(19, 156, 199, 0.3);
}

.what-is-button:active {
  transform: translateY(0);
}
</style>
