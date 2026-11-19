import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { MermaidMarkdown, MermaidPlugin } from 'vitepress-plugin-mermaid'
import { navigationSources } from '../prepare.mjs'
import { sidebar } from './navigation.mts'

const documentation = { text: 'Documentation', link: '/start/quickstart', activeMatch: '^/(start|core|reference)/' }
const deployers = { text: 'Deployers', link: '/deployers/', activeMatch: '^/deployers/' }
const community = { text: 'Community', link: '/community/index', activeMatch: '^/community/' }
const insideDocs = { themeConfig: { nav: [documentation, deployers, community] } }
const draftRoot = fileURLToPath(new URL('../', import.meta.url))

export default defineConfig({
  title: 'Konfidence',
  description: 'Konfidence documentation',
  base: '/platforms/',
  srcDir: './.generated',
  head: [['meta', { name: 'robots', content: 'noindex, nofollow' }]],
  ignoreDeadLinks: [/^https?:\/\/localhost(:\d+)?/],
  markdown: { config: MermaidMarkdown },
  vite: {
    publicDir: fileURLToPath(new URL('../../../public', import.meta.url)),
    plugins: [navigationSources(draftRoot), MermaidPlugin({ securityLevel: 'strict' })],
    // Prebundle Mermaid with its CommonJS dependencies from the pnpm tree.
    optimizeDeps: { include: ['mermaid', 'lucide-vue-next', 'vitepress-openapi/client'] },
    ssr: { noExternal: ['vitepress-openapi'] },
  },
  themeConfig: {
    logo: {
      light: '/assets/logo/full/SVG/400_konfidence_logo_light.svg',
      dark: '/assets/logo/full/SVG/400_konfidence_logo_dark.svg',
      alt: 'Konfidence home',
    },
    siteTitle: false,
    productPrerelease: process.env.KONFIDENCE_PRERELEASE !== 'false',
    nav: [documentation, community],
    sidebar,
    sidebarMenuLabel: 'Sections',
    outline: { level: [2, 3] },
    socialLinks: [{ icon: 'github', link: 'https://github.com/konfidence-project' }],
    docFooter: { prev: false, next: false },
    search: {
      provider: 'local',
      options: {
        miniSearch: {
          searchOptions: {
            boost: { title: 8, titles: 4, text: 1 },
            boostDocument(id) {
              if (id.includes('/community/decisions/adr-')) return 0.15
              if (id.includes('/community/guide-templates')) return 0.25
              return 1
            },
          },
        },
      },
    },
  },
  additionalConfig: {
    '/start/': insideDocs, '/core/': insideDocs, '/reference/': insideDocs,
    '/deployers/': insideDocs, '/community/': insideDocs,
  },
})
