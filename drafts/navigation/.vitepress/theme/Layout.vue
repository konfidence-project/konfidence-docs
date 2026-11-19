<script setup>
import { computed } from 'vue'
import DefaultTheme from 'vitepress/theme'
import { useData, withBase } from 'vitepress'
import BrandHero from '../../../../.vitepress/theme/components/VPHeroInfo.vue'
import BrandFeatures from '../../../../.vitepress/theme/components/FeatureOverview.vue'
import BrandFooter from '../../../../.vitepress/theme/components/VPFooter.vue'
import PreReleaseBanner from '../../../../.vitepress/theme/components/PreReleaseBanner.vue'
const { frontmatter, theme, page } = useData()

const platformNames = { kubernetes: 'Kubernetes', s3: 'S3', 'cloud-foundry': 'Cloud Foundry' }
const platform = computed(() => {
  const [section, name] = page.value.relativePath.split('/')
  return section === 'deployers' && name in platformNames ? name : ''
})
const directory = computed(() => page.value.relativePath === 'deployers/index.md')
const sidebarTitle = computed(() => {
  if (platform.value) return platformNames[platform.value]
  if (page.value.relativePath.startsWith('community/')) return 'Community'
  return 'Konfidence core'
})
</script>

<template>
  <DefaultTheme.Layout>
    <template #layout-top><PreReleaseBanner v-if="theme.productPrerelease" /></template>
    <template #home-hero-info><BrandHero quickstart-link="/start/quickstart" /></template>
    <template #home-hero-after><BrandFeatures quickstart-link="/start/quickstart" /></template>
    <template #home-features-after><BrandFooter /></template>
    <template #nav-bar-title-after>
      <span v-if="theme.productPrerelease" class="release-label">pre-alpha</span>
    </template>
    <template #sidebar-nav-before>
      <p class="sidebar-area">{{ sidebarTitle }}</p>
    </template>
    <template #doc-before>
      <nav v-if="platform" class="platform-path" aria-label="Breadcrumb">
        <a :href="withBase('/deployers/')">Deployers</a>
        <span aria-hidden="true">/</span>
        <a :href="withBase('/deployers/#' + platform)">{{ platformNames[platform] }}</a>
      </nav>
      <div v-else-if="!directory && frontmatter.scope && frontmatter.scope !== 'Konfidence core'" class="page-context">
        <span class="scope-dot" />
        <span>{{ frontmatter.scope }}</span>
      </div>
      <p v-if="page.relativePath === 'reference/crd.md'" class="reference-context">Shared Konfidence resources. Deployer-owned configuration belongs in the corresponding deployer reference.</p>
    </template>
    <template #doc-after>
      <footer class="reading-footer">
        <p v-if="theme.productPrerelease">Konfidence is pre-release software. Concepts and APIs are unstable and subject to change.</p>
        <a :href="withBase('/start/quickstart')">Documentation</a>
        <a href="https://github.com/konfidence-project">GitHub</a>
      </footer>
    </template>
  </DefaultTheme.Layout>
</template>

<style scoped>
:global(.VPHome .VPHero) { padding: 0; }
:global(.VPHome .VPHero .container),
:global(.VPHome .VPHero .main) { max-width: none; width: 100%; }
:global(.VPHome .VPHero .main) { order: 0; }
</style>
