<script setup lang="ts">
import { useRouter, withBase } from 'vitepress'
import { deployers } from '../deployers.mts'

defineProps<{ selected: string }>()
const router = useRouter()

function selectDeployer(event: Event) {
  const value = (event.target as HTMLSelectElement).value
  if (value === 'all') {
    router.go(withBase('/deployers/'))
    return
  }
  const deployer = deployers.find(item => item.slug === value)
  if (deployer?.entry) router.go(withBase(deployer.entry))
}
</script>

<template>
  <div class="deployer-picker">
    <label for="deployer-select" class="visually-hidden">Deployer</label>
    <select id="deployer-select" :value="selected" @change="selectDeployer">
      <option value="" disabled>Choose a deployer</option>
      <option value="all">All deployers</option>
      <option v-for="deployer in deployers" :key="deployer.slug" :value="deployer.slug" :disabled="!deployer.entry">
        {{ deployer.name }}{{ deployer.entry ? '' : ' — No guide available' }}
      </option>
    </select>
  </div>
</template>
