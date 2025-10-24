<script setup lang="ts">
import { withBase, useData } from "vitepress";
import { computed } from "vue";

const { isDark } = useData();

const logoUrl = computed(() =>
  withBase(
    isDark.value
      ? "/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg"
      : "/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg"
  )
);

</script>

<template>
  <section class="hero-announce">
  <h1 class="konfidence-brand">Konfidence</h1>

  <div class="hero-copy">
    <h2 class="heading">Immutable by design.</h2>
    <h2 class="heading">Automated by nature.</h2>
    <h2 class="heading">Built for fast, safe delivery.</h2>
    <p class="tagline">Reliable. Reproducible. Ready soon.</p>
  </div>

  <div class="hero-logo" :style="{ backgroundImage: `url(${logoUrl})` }"></div>
</section>
</template>

<style scoped>

.heading {
  margin: 0;
  display: block;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
}
.heading + .heading { margin-top: 0.25rem; }
.tagline { font-size: 1.125rem; margin-top: 0.85rem; }
</style>
