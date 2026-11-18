---
layout: page
title: Documentation
search: false
head:
  - - meta
    - http-equiv: refresh
      content: "0; url=getting-started/quickstart"
---

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vitepress'

const router = useRouter()
// relative, so every version's copy of this page opens its own quickstart
onMounted(() => router.go(new URL('getting-started/quickstart', location.href).pathname))
</script>

[Open the Quickstart](./getting-started/quickstart.md).
