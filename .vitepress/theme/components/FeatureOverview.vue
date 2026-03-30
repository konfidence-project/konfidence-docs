<template>
  <div class="feature-overview-wrapper">
    <div class="feature-tiles">
      <div class="feature-tile">
        <h3><RefreshCcw class="tile-icon" />Reuse</h3>
        <p>Deploy once, run everywhere: Immutable vectors guarantee that what you test is exactly what runs in production, eliminating environment inconsistencies.</p>
      </div>

      <div class="feature-tile">
        <h3><TrendingUp class="tile-icon" />Scale</h3>
        <p>Scale releases without losing control: Automated delivery controls ensure every release follows the same reliable process, even as release frequency increases and teams grow.</p>
      </div>

      <div class="feature-tile">
        <h3><Zap class="tile-icon" />Accelerate</h3>
        <p>Improve delivery performance: Teams see measurable improvements in deployment frequency and change failure rates through predictable, repeatable delivery pipelines.</p>
      </div>

      <div class="feature-tile">
        <h3><Layers class="tile-icon" />Integrate</h3>
        <p>The framework runs natively on Kubernetes, using native APIs and patterns to manage delivery workflows. There is no extra infrastructure layer to install or maintain.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RefreshCcw, TrendingUp, Zap, Layers } from 'lucide-vue-next'
</script>

<style scoped>
.feature-overview-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}

.feature-tiles {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2rem;
}

.feature-tile {
  background: var(--vp-c-bg-soft);
  border: 2px solid transparent;
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  background-clip: padding-box;
  outline: 2px solid transparent;
  position: relative;
}

.feature-tile::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: 14px;
  background: linear-gradient(135deg, #139CC7, #80D2E0);
  z-index: -1;
}

.feature-tile:hover {
}

.feature-tile h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: var(--vp-c-text-1);
  font-weight: 600;
  line-height: 1.4;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tile-icon {
  width: 1.2rem;
  height: 1.2rem;
  flex-shrink: 0;
  color: #139CC7;
}

.feature-tile p {
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
  flex-grow: 1;
  font-size: 0.9rem;
}

@media (max-width: 1024px) {
  .feature-tiles {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .feature-overview-wrapper {
    padding: 3rem 1.5rem;
  }

  .feature-tiles {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .feature-tile h3 {
    font-size: 1rem;
  }

  .feature-tile p {
    font-size: 0.85rem;
  }
}
</style>
