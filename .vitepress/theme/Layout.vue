<template>
  <DefaultTheme.Layout>
    <template #layout-top>
      <PreReleaseBanner v-if="prerelease" />
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
    <template #doc-before>
      <VersionBanner />
    </template>
    <template #doc-after>
      <VPFooter />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup lang="ts">
import DefaultTheme from 'vitepress/theme'
import VPFooter from './components/VPFooter.vue'
import VPHeroInfo from './components/VPHeroInfo.vue'
import FeatureOverview from './components/FeatureOverview.vue'
import PreReleaseBanner from './components/PreReleaseBanner.vue'
import VersionBanner from './components/VersionBanner.vue'

const prerelease = __PRERELEASE__
</script>

<style scoped>
:global(.VPHome .VPHero) {
  padding: 0;
}

:global(.VPHome .VPHero .container),
:global(.VPHome .VPHero .main) {
  max-width: none;
  width: 100%;
}

:global(.VPHome .VPHero .main) {
  order: 0;
}
</style>
