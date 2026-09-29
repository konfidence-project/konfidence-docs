---
layout: page
title: Documentation
search: false
head:
  - - meta
    - http-equiv: refresh
      content: '0; url=/docs/getting-started/quickstart'
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
onMounted(() => router.go('/docs/getting-started/quickstart'))
</script>

[Open the Quickstart](/docs/getting-started/quickstart).
