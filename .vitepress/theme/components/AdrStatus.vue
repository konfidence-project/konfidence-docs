<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

// maps ADR lifecycle states onto the default theme's badge colours
const type = computed(
  () =>
    (<Record<string, "tip" | "info" | "warning" | "danger">>{
      accepted: 'tip',
      proposed: 'info',
      draft: 'info',
      deprecated: 'warning',
      superseded: 'warning',
      rejected: 'danger',
    })[props.status] ?? "info",
)
</script>

<template>
  <Badge :type="type" :text="status" />
</template>
