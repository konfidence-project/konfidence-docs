<template>
  <DefaultTheme.Layout :class="{ 'landing-page': isHome }">
    <template #layout-top>
      <PreReleaseBanner />
    </template>
    <template #nav-bar-title-after>
      <span class="prerelease-badge">pre-alpha</span>
    </template>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #home-hero-after>
      <FeatureOverview />
    </template>
    <template #home-features-after>
      <VPFooter />
    </template>
    <template #doc-after>
      <VPFooter />
    </template>
  </DefaultTheme.Layout>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useData } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import VPFooter from './components/VPFooter.vue'
import VPHeroInfo from './components/VPHeroInfo.vue'
import FeatureOverview from './components/FeatureOverview.vue'
import PreReleaseBanner from './components/PreReleaseBanner.vue'

const { frontmatter } = useData()
const isHome = computed(() => frontmatter.value.layout === 'home')

// the theme registers cmd/ctrl+k and / hotkeys for search even when the
// search box is hidden; swallow them on the landing page (capture phase
// runs before the theme's bubble-phase window listener)
function blockSearchHotkey(e) {
  if (!isHome.value) return
  const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
  const slash = e.key === '/' && !/^(?:input|textarea)$/i.test(e.target?.tagName ?? '')
  if (!cmdK && !slash) return
  e.preventDefault()
  e.stopImmediatePropagation()
}

onMounted(() => window.addEventListener('keydown', blockSearchHotkey, true))
onUnmounted(() => window.removeEventListener('keydown', blockSearchHotkey, true))
</script>

<style scoped>
.prerelease-badge {
  margin-left: 0.5rem;
  padding: 0.1rem 0.5rem;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  border-radius: 999px;
  background: rgba(255, 170, 0, 0.18);
  border: 1px solid var(--konfidence-orange);
  color: #9A6700;
}

:global(.dark) .prerelease-badge {
  color: var(--konfidence-orange);
}

/* the landing page must not link into the unfinished docs: hide the
   nav menu (desktop + mobile hamburger) and search there */
:global(.landing-page .VPNavBarMenu),
:global(.landing-page .VPNavBarSearch),
:global(.landing-page .VPNavScreenMenu) {
  display: none !important;
}

:global(.VPHome .VPHero) {
  padding-bottom: 1.25rem;
}

@media (min-width: 960px) {
  :global(.VPHome .VPHero) {
    padding-bottom: 1.5rem;
  }
}

</style>
