<script setup>
import { withBase } from 'vitepress'
import { deployers } from '../deployers.mts'
</script>

<template>
  <nav class="deployer-cards" aria-label="Choose a deployer">
    <a
      v-for="deployer in deployers"
      :id="deployer.slug"
      :key="deployer.slug"
      :href="withBase(deployer.entry)"
      :aria-labelledby="'deployer-title-' + deployer.slug"
      class="deployer-card"
    >
      <h2 :id="'deployer-title-' + deployer.slug">{{ deployer.name }}</h2>
      <p class="deployer-status">{{ deployer.status }}</p>
      <p class="deployer-description">{{ deployer.description }}</p>
      <span class="deployer-arrow" aria-hidden="true">→</span>
    </a>
  </nav>
</template>
