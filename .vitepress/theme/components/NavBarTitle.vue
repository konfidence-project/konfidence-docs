<script setup lang="ts">
// Replaces the default theme's VPNavBarTitle (see the alias in config.mts) to
// put the version switcher next to the logo. The switcher sits after the
// logo link, not inside it, since a dropdown can't live inside a link.
// Apart from that, this matches VitePress 2.0.0-alpha.21.
import { computed } from "vue";
import { useData } from "vitepress";
import { useLayout, VPImage } from "vitepress/theme";
import { useLangs } from "vitepress/dist/client/theme-default/composables/langs.js";
import { normalizeLink } from "vitepress/dist/client/theme-default/support/utils.js";
import VersionSwitcher from "./VersionSwitcher.vue";

const { site, theme } = useData();
const { hasSidebar } = useLayout();
const { currentLang } = useLangs();
const link = computed(() =>
  typeof theme.value.logoLink === "string" ? theme.value.logoLink : theme.value.logoLink?.link,
);
const rel = computed(() =>
  typeof theme.value.logoLink === "string" ? undefined : theme.value.logoLink?.rel,
);
const target = computed(() =>
  typeof theme.value.logoLink === "string" ? undefined : theme.value.logoLink?.target,
);
const textTitle = computed(() => {
  if (theme.value.siteTitle === false) return undefined;
  const raw = theme.value.siteTitle ?? site.value.title;
  return raw.replace(/<[^>]+>/g, "").trim() || undefined;
});
</script>

<template>
  <div class="VPNavBarTitle" :class="{ 'has-sidebar': hasSidebar }">
    <a
      class="title"
      :href="link ?? normalizeLink(currentLang.link)"
      :rel
      :target
      :title="textTitle"
    >
      <slot name="nav-bar-title-before" />
      <VPImage v-if="theme.logo" class="logo" :image="theme.logo" />
      <span v-if="theme.siteTitle" dir="auto" v-html="theme.siteTitle"></span>
      <span v-else-if="theme.siteTitle === undefined">{{ site.title }}</span>
      <slot name="nav-bar-title-after" />
    </a>
    <VersionSwitcher />
  </div>
</template>

<style scoped>
.VPNavBarTitle {
  display: flex;
  align-items: center;
}

.title {
  display: flex;
  align-items: center;
  height: var(--vp-nav-height);
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  transition: opacity 0.25s;
}

.title > span {
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (min-width: 60rem) {
  .title {
    flex-shrink: 0;
  }

  .VPNavBarTitle.has-sidebar {
    max-width: calc(var(--vp-sidebar-width) - 4rem);
  }
}

:deep(.logo) {
  flex: none;
  margin-inline-end: 0.5rem;
  height: var(--vp-nav-logo-height);
}
</style>
