<script setup lang="ts">
import { computed } from 'vue'
import { useData, withBase } from 'vitepress'
import { data as adrs } from '../adrs.data.mts'
import AdrStatus from './AdrStatus.vue'

const { frontmatter } = useData()
const fm = computed(() => frontmatter.value)

const byId = Object.fromEntries(adrs.map((a) => [a.id, a]))

function day(v: unknown): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

const status = computed(() => String(fm.value.status ?? 'draft').toLowerCase())
const authors = computed(() => fm.value.authors ?? [])
const deps = computed(() =>
  (fm.value.dependencies ?? []).map((id: string) => ({ id, adr: byId[id] })),
)
const supersededBy = computed(() =>
  fm.value.superseded_by ? { id: fm.value.superseded_by, adr: byId[fm.value.superseded_by] } : null,
)
</script>

<template>
  <div class="adr-header">
    <dl>
      <div>
        <dt>Status</dt>
        <dd><AdrStatus :status="status" /></dd>
      </div>
      <div v-if="day(fm.date_proposed)">
        <dt>Proposed</dt>
        <dd>{{ day(fm.date_proposed) }}</dd>
      </div>
      <div v-if="day(fm.date_approved)">
        <dt>Accepted</dt>
        <dd>{{ day(fm.date_approved) }}</dd>
      </div>
      <div v-if="authors.length">
        <dt>{{ authors.length > 1 ? 'Authors' : 'Author' }}</dt>
        <dd class="adr-authors">
          <span v-for="a in authors" :key="a">
            <a :href="`https://github.com/${a}`" target="_blank" rel="noreferrer">@{{ a }}</a>
          </span>
        </dd>
      </div>
      <div v-if="fm.category">
        <dt>Category</dt>
        <dd>{{ fm.category }}</dd>
      </div>
      <div v-if="fm.impact">
        <dt>Impact</dt>
        <dd>{{ fm.impact }}</dd>
      </div>
      <div v-if="deps.length">
        <dt>Related</dt>
        <dd class="adr-deps">
          <span v-for="d in deps" :key="d.id">
            <a v-if="d.adr" :href="withBase(d.adr.url)" :title="d.adr.title">{{ d.id }}</a>
            <template v-else>{{ d.id }}</template>
          </span>
        </dd>
      </div>
    </dl>
    <div v-if="supersededBy" class="custom-block warning">
      <p>
        Superseded by
        <a v-if="supersededBy.adr" :href="withBase(supersededBy.adr.url)">{{ supersededBy.id }}: {{ supersededBy.adr.title }}</a>
        <template v-else>{{ supersededBy.id }}</template>.
        This record is kept to explain how the current design came about.
      </p>
    </div>
    <div v-else-if="status === 'deprecated'" class="custom-block warning">
      <p>This decision no longer describes how Konfidence works. It is kept to explain how the current design came about.</p>
    </div>
    <div v-else-if="status === 'draft' || status === 'proposed'" class="custom-block info">
      <p>This decision is still under discussion and may change before it is accepted.</p>
    </div>
  </div>
</template>

<style scoped>
.adr-header {
  margin: 16px 0 32px;
}

.adr-header dl {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px 24px;
  margin: 0;
  padding: 16px 20px;
  border: 1px solid var(--konfidence-surface-border);
  border-radius: 8px;
  background: var(--konfidence-gradient-surface);
}

.adr-header dt {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--vp-c-text-2);
}

.adr-header dd {
  margin: 2px 0 0;
  font-size: 14px;
}

.adr-authors span + span::before,
.adr-deps span + span::before {
  content: ', ';
}
</style>
