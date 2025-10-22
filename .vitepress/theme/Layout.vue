<template>
  <DefaultTheme.Layout>
    <template #layout-bottom>
      <VPFooter />
    </template>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import DefaultTheme from 'vitepress/theme'
import VPFooter from './components/VPFooter.vue'
import VPHeroInfo from './components/VPHeroInfo.vue'
</script>
