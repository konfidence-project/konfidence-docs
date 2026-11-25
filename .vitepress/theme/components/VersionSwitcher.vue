<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import VPFlyout from "vitepress/dist/client/theme-default/components/VPFlyout.vue";
import { docsPage } from "../versions";

// the version dropdown next to the logo. Each entry is a VersionMenuLink,
// which opens the current page in that version
const { page, theme } = useData();
const versions = computed<{ version: string }[]>(() => theme.value.versions ?? []);

const items = computed(() => [
  { component: "VersionMenuLink", props: { version: "", text: "main (Development)" } },
  ...versions.value.map(({ version }, index) => ({
    component: "VersionMenuLink",
    props: { version, text: index ? version : `${version} (Latest)` },
  })),
]);

// the version of the page; pages outside the versioned docs, such as the home
// page and the ADRs, show the latest version, where the "Docs" link leads
const current = computed(() => {
  const version = docsPage(page.value.relativePath)?.version ?? versions.value[0]?.version;
  return version || "main";
});
</script>

<template>
  <VPFlyout
    v-if="versions.length"
    class="VersionSwitcher"
    :button="current"
    :label="`Documentation version ${current}`"
    :items
  />
</template>

<style scoped>
.VersionSwitcher {
  flex: none;
  margin-inline-start: 0.25rem;
}

.VersionSwitcher :deep(.button) {
  padding: 0 0.5rem;
  height: 1.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  font-size: 0.8125rem;
}

/* the flyout places its panel for a full-height nav button. This button is
   shorter, so the panel starts right below it. The gap is padding inside
   the panel, so the pointer never leaves button or panel on the way down,
   which would close a hover-opened menu */
.VersionSwitcher :deep(.menu) {
  top: 100%;
  right: auto;
  left: 0;
  padding-top: 0.25rem;
}
</style>
