<script setup>
import { withBase } from 'vitepress'
const steps = [
  { title: 'Build', text: 'CI builds and publishes versioned artifacts.', path: '/core/build' },
  { title: 'Assemble', text: 'Combine artifacts and configuration into one immutable vector.', path: '/core/assemble' },
  { title: 'Deploy', text: 'Select a vector for a stage and verify the rollout.', path: '/core/deploy' },
  { title: 'Promote', text: 'Select the same vector for the next stage.', path: '/core/release' },
]
</script>

<template>
  <nav class="delivery-path four-steps" aria-label="Application delivery workflow">
    <a v-for="(step, index) in steps" :key="step.path" :href="withBase(step.path)">
      <span class="step-number">0{{ index + 1 }}</span>
      <strong>{{ step.title }}</strong>
      <span class="step-description">{{ step.text }}</span>
      <span class="step-arrow" aria-hidden="true">→</span>
    </a>
  </nav>
</template>
