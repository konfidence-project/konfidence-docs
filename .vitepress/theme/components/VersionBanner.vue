<script setup lang="ts">
import { computed } from "vue";
import { useData, withBase } from "vitepress";
import { docsPage, switchLink } from "../versions";

const { page, theme } = useData();

// "0.1/docs/a.md" is a snapshot page, "docs/a.md" a development page; the
// unversioned ADRs and pages outside the docs get no banner
const version = computed(() => docsPage(page.value.relativePath)?.version);
const latest = computed<string>(() => theme.value.versions?.[0]?.version ?? "");
// the same page in the latest version, if it has one
const latestLink = computed(() =>
  switchLink(page.value.relativePath, latest.value, theme.value.versionPages ?? {}),
);

// an older snapshot, or unreleased development docs once a release exists
const kind = computed(() => {
  if (version.value === undefined || !latest.value) return "";
  if (version.value) return version.value === latest.value ? "" : "old";
  return "development";
});
</script>

<template>
  <div v-if="kind" class="version-banner">
    <template v-if="kind === 'old'">
      This is the documentation for version {{ version }}, an older version.
    </template>
    <template v-else>This is the unreleased development version of the documentation.</template>
    <a :href="withBase(latestLink)">View the latest version ({{ latest }})</a>.
  </div>
</template>
<style scoped>
.version-banner {
  margin-bottom: 24px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.5;
  background: var(--konfidence-gradient-action);
  color: #201100;
}

.version-banner a {
  color: inherit;
  text-decoration: underline;
}
</style>
