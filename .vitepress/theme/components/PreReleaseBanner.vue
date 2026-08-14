<template>
  <div class="prerelease-banner">
    Konfidence is pre-release software — concepts and APIs are unstable and subject to change.
  </div>
</template>

<style>
:root {
  --vp-layout-top-height: 32px;
}

@media (max-width: 640px) {
  :root {
    --vp-layout-top-height: 48px;
  }
}

.prerelease-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--vp-z-index-layout-top);
  height: var(--vp-layout-top-height);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 1rem;
  text-align: center;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  background: linear-gradient(135deg, var(--konfidence-orange), #FF960C);
  color: #201100;
}
</style>
