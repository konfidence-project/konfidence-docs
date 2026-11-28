<script setup>
import { withBase } from 'vitepress'
import { deployers } from '../deployers.mts'
</script>

<template>
  <nav class="deployer-cards" aria-label="Choose a deployer">
    <component
      v-for="deployer in deployers"
      :is="deployer.entry ? 'a' : 'article'"
      :id="deployer.slug"
      :key="deployer.slug"
      :href="deployer.entry ? withBase(deployer.entry) : undefined"
      :aria-labelledby="'deployer-title-' + deployer.slug"
      class="deployer-card"
      :class="{ 'deployer-placeholder': !deployer.entry }"
    >
      <h2 :id="'deployer-title-' + deployer.slug">{{ deployer.name }}</h2>
      <p class="deployer-status">{{ deployer.status }}</p>
      <p v-if="deployer.description" class="deployer-description">{{ deployer.description }}</p>
      <span v-if="deployer.entry" class="deployer-arrow" aria-hidden="true">→</span>
    </component>
  </nav>
</template>
