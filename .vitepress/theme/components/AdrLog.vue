<script setup lang="ts">
import { withBase } from 'vitepress'
import { data as adrs } from '../adrs.data.mts'
import AdrStatus from './AdrStatus.vue'
</script>

<template>
  <table class="adr-log">
    <thead>
      <tr>
        <th>ADR</th>
        <th>Title</th>
        <th>Status</th>
        <th>Category</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="a in adrs" :key="a.id">
        <td class="adr-id"><a :href="withBase(a.url)">{{ a.id }}</a></td>
        <td><a :href="withBase(a.url)">{{ a.title }}</a></td>
        <td><AdrStatus :status="a.status" /></td>
        <td>{{ a.category }}</td>
      </tr>
    </tbody>
  </table>
</template>

<style scoped>
.adr-id {
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
</style>
