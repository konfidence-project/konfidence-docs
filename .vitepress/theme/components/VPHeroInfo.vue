<script setup lang="ts">
import { withBase, useData } from "vitepress";

const { isDark } = useData();

</script>

<template>
    <h1 class="konfidence-brand">Konfidence</h1>

    <h1 class="heading"> Immutable by design. </h1>
    <h1 class="heading">Automated by nature. </h1>
    <h1 class="heading"> Built for teams that move fast and deploy safely.</h1>
    <p class="tagline">Reliable. Reproducible. Ready soon.</p>
    
    <div class="hero-logo">
      <img
        :src="withBase(isDark ? '/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg' : '/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg')"
        alt="Konfidence Logo"
      />
    </div>

</template>

<!--

name: Konfidence
  text: Immutable by design. Automated by nature. Built for teams that move fast and deploy safely.
  tagline: Reliable. Reproducible. Ready soon.
  image:
    dark: /assets/logo/full/SVG/1200_konfidence_logo_dark.svg
    light: /assets/logo/full/SVG/1200_konfidence_logo_light.svg


-->

<style scoped>
.hero-image {
    width: 600px;
}

.heading {
    margin-left: 0;
    padding-top: 1rem;
    display: block;
    font-size: 2rem;
    font-weight: 600;
}

.tagline {
    font-size: 1.2rem;
    padding-top: 1rem;

}

</style>