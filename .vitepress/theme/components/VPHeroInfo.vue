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
      <h2 class="heading">Built for fast, safe deployment.</h2>
      <p class="tagline">Reliable. Reproducible. Sovereign.</p>
    </div>


    <img class="hero-logo" :src="logoUrl" alt="" />
  </section>
</template>

<style scoped>
.hero-announce {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.heading {
  margin: 0 0 0.4rem 0;
  display: block;
  font-size: 2rem;
  line-height: 1.2;
  font-weight: 600;
}

.tagline {
  font-size: 1.125rem;
  margin-top: 0.85rem;
}

.announcement {
  font-size: 2rem;
  margin-top: 2rem;
  text-shadow: 0 0 15px rgba(247, 162, 26, 0.417);
}
</style>
