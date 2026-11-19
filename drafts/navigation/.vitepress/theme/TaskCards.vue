<script setup>
import { withBase } from 'vitepress'
defineProps({ items: { type: Array, required: true } })
</script>

<template>
  <div class="task-cards" :class="{ two: items.length === 2 }">
    <a v-for="item in items" :key="item.link" :href="withBase(item.link)" class="task-card">
      <span class="task-title">{{ item.title }} <span aria-hidden="true">↗</span></span>
      <span class="task-description">{{ item.description }}</span>
    </a>
  </div>
</template>
