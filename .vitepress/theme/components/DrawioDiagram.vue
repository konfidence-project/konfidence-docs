<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ src: string }>()
const container = ref<HTMLElement | null>(null)

declare global {
  interface Window {
    GraphViewer: { processElements: () => void }
  }
}

onMounted(async () => {
  if (!container.value) return

  const response = await fetch(props.src)
  const xmlText = await response.text()

  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')
  const mxGraphModel = doc.querySelector('mxGraphModel')
  if (!mxGraphModel) return

  const xml = new XMLSerializer().serializeToString(mxGraphModel)

  const div = document.createElement('div')
  div.className = 'mxgraph'
  div.style.maxWidth = '100%'
  div.setAttribute('data-mxgraph', JSON.stringify({ resize: true, xml }))
  container.value.appendChild(div)

  if (window.GraphViewer) {
    window.GraphViewer.processElements()
  } else {
    const script = document.createElement('script')
    script.src = 'https://viewer.diagrams.net/js/viewer-static.min.js'
    document.head.appendChild(script)
  }
})
</script>

<template>
  <div ref="container" class="drawio-container"></div>
</template>
