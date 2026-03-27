<template>
  <div class="feature-overview-wrapper">
    <div class="feature-tiles">
      <div class="feature-tile">
        <h3>Deploy once, run everywhere</h3>
        <p>Immutable vectors guarantee that what you test is exactly what runs in production, eliminating environment inconsistencies.</p>
      </div>

      <div class="feature-tile">
        <h3>Scale releases without losing control</h3>
        <p>Maintains delivery consistency even as release frequency increases and teams grow.</p>
      </div>

      <div class="feature-tile">
        <h3>Improve delivery performance</h3>
        <p>Teams see measurable improvements in deployment frequency and change failure rates through predictable, repeatable delivery pipelines.</p>
      </div>

      <div class="feature-tile">
        <h3>Run natively on Kubernetes</h3>
        <p>Built specifically for Kubernetes environments, leveraging native APIs and patterns. No additional infrastructure overhead.</p>
      </div>
    </div>
  </div>
</template>

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
  border: 2px solid var(--vp-c-brand-1);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
}

.feature-tile:hover {
}

.feature-tile h3 {
  font-size: 1.1rem;
  margin: 0 0 1rem 0;
  color: var(--vp-c-brand-1);
  font-weight: 600;
  line-height: 1.4;
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
