<script setup lang="ts">
import { computed } from "vue";
import { useData } from "vitepress";
import VPMenuLink from "vitepress/dist/client/theme-default/components/VPMenuLink.vue";
import { switchLink } from "../versions";

// one entry of the version menu; it opens the reader's current page in that
// version, so switching versions keeps their place
const props = defineProps<{ version: string; text: string }>();
const { page, theme } = useData();

const item = computed(() => ({
  text: props.text,
  link: switchLink(page.value.relativePath, props.version, theme.value.versionPages ?? {}),
  activeMatch: props.version ? `^/${props.version}/docs/` : "^/docs/",
}));
</script>

<template>
  <VPMenuLink :item />
</template>
