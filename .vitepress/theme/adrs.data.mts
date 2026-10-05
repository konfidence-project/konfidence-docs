import { createContentLoader } from 'vitepress'

export interface Adr {
  id: string
  title: string
  status: string
  url: string
  category?: string
  impact?: string
  date_proposed?: string
  date_approved?: string
  // GitHub handles only; real names stay out of the public docs
  authors: string[]
  dependencies: string[]
  superseded_by?: string
}

declare const data: Adr[]
export { data }

// YAML parses bare dates into Date objects; render them as plain ISO days
function day(v: unknown): string | undefined {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

export default createContentLoader('docs/extend-customize/decisions/adr-*.md', {
  transform(raw): Adr[] {
    return raw
      .map(({ url, frontmatter: fm }) => ({
        id: fm.id,
        title: fm.title,
        status: String(fm.status ?? 'draft').toLowerCase(),
        url,
        category: fm.category,
        impact: fm.impact,
        date_proposed: day(fm.date_proposed),
        date_approved: day(fm.date_approved),
        authors: fm.authors ?? [],
        dependencies: fm.dependencies ?? [],
        superseded_by: fm.superseded_by,
      }))
      .sort((a, b) => a.id.localeCompare(b.id))
  },
})
