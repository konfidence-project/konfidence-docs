<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <PreReleaseBanner />
    </template>
    <template #nav-bar-title-after>
      <span class="prerelease-badge">pre-alpha</span>
    </template>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #home-hero-after>
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
import PreReleaseBanner from './components/PreReleaseBanner.vue'
</script>

<style scoped>
.prerelease-badge {
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 999px;
  background: rgba(255, 170, 0, 0.18);
  border: 1px solid var(--konfidence-orange);
  color: #9A6700;
}

:global(.dark) .prerelease-badge {
  color: var(--konfidence-orange);
}

:global(.VPHome .VPHero) {
  padding-bottom: 1.25rem;
}

@media (min-width: 960px) {
  :global(.VPHome .VPHero) {
    padding-bottom: 1.5rem;
  }
}

</style>
