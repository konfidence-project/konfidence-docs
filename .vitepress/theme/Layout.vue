<template>
  <DefaultTheme.Layout :class="{ 'landing-page': prerelease && isHome }">
    <template #layout-top>
      <PreReleaseBanner v-if="prerelease" />
    </template>
    <template #nav-bar-title-after>
      <span v-if="prerelease" class="prerelease-badge">pre-alpha</span>
    </template>
    <template #home-hero-info>
      <VPHeroInfo />
    </template>
    <template #home-hero-after>
      <div v-if="!prerelease" class="hero-action-area">
        <div class="button-container">
          <a href="/docs/getting-started/quickstart" class="hero-button hero-button--primary">Get Konfidence running</a>
          <a href="/docs/" class="hero-button hero-button--secondary">Browse the docs</a>
        </div>
      </div>
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

const prerelease = __PRERELEASE__

const { frontmatter } = useData()
const isHome = computed(() => frontmatter.value.layout === 'home')

// the theme registers cmd/ctrl+k and / hotkeys for search even when the
// search box is hidden; swallow them on the landing page (capture phase
// runs before the theme's bubble-phase window listener)
function blockSearchHotkey(e) {
  if (!prerelease || !isHome.value) return
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

.hero-action-area {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem 4rem;
}

.button-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  justify-content: flex-start;
}

.hero-button {
  padding: 0.78rem 1.35rem;
  font-size: 1rem;
  font-weight: 700;
  border-radius: 999px;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease;
  display: inline-block;
  text-decoration: none;
  line-height: 1.2;
}

.hero-button--primary {
  background: linear-gradient(135deg, var(--konfidence-orange), #FF960C);
  color: #201100;
  box-shadow: 0 12px 28px rgba(255, 150, 12, 0.22);
}

.hero-button--secondary {
  color: var(--konfidence-blue-dark);
  border: 1px solid rgba(19, 156, 199, 0.45);
  background: rgba(128, 210, 224, 0.12);
}

:global(.dark .hero-button--secondary) {
  color: var(--konfidence-blue-light);
  border-color: rgba(185, 230, 235, 0.38);
  background: rgba(31, 172, 208, 0.16);
}

.hero-button:hover {
  transform: translateY(-2px);
}

.hero-button--primary:hover {
  box-shadow: 0 16px 34px rgba(255, 150, 12, 0.3);
}

.hero-button--secondary:hover {
  border-color: var(--konfidence-blue);
  color: var(--konfidence-blue);
}

.hero-button:active {
  transform: translateY(0);
}

:global(.VPHome .VPHero) {
  padding-bottom: 1.25rem;
}

@media (min-width: 960px) {
  :global(.VPHome .VPHero) {
    padding-bottom: 1.5rem;
  }
}

@media (max-width: 640px) {
  .hero-action-area {
    padding: 0 1.5rem 3rem;
  }

  .button-container {
    gap: 0.65rem;
  }

  .hero-button {
    width: 100%;
    text-align: center;
  }
}

</style>
