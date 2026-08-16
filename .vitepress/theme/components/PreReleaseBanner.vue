<template>
  <div class="prerelease-banner">
    Konfidence is pre-release software. Concepts and APIs are unstable and subject to change.
  </div>
</template>

<style>
/* only reserve layout space while the banner is actually rendered */
:root:has(.prerelease-banner) {
  --vp-layout-top-height: 32px;
}

@media (max-width: 640px) {
  :root:has(.prerelease-banner) {
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
  background: var(--konfidence-gradient-action);
  color: #201100;
}
</style>
