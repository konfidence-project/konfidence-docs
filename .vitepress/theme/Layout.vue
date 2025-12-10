<template>
  <DefaultTheme.Layout>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #doc-after>
      <VPFooter />
    </template>
    <template #home-features-after>
      <VPFooter />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import VPFooter from './components/VPFooter.vue'
import VPHeroInfo from './components/VPHeroInfo.vue'
</script>
