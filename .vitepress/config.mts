import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: './src',
  vite: {
    publicDir: '../public'
  },
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', rel: 'stylesheet' }]
  ],
  title: "Konfidence",
  description: "Public Documentation for Project Konfidence",
  ignoreDeadLinks: true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: '/assets/logo/full/SVG/400_konfidence_logo_light.svg',
      dark: '/assets/logo/full/SVG/400_konfidence_logo_dark.svg'
    },
    siteTitle: false,

    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Docs', link: '/docs/' },
      { text: 'GitHub', link: 'https://github.com/konfidence-project' }
    ],

    // Sidebar navigation
    sidebar: {
      '/docs/': [
        {
          text: 'Getting Started',
          collapsed: false,
          items: [
            { text: 'Quickstart', link: '/docs/getting-started/quickstart' }
          ]
        },
        {
          text: 'Introduction',
          collapsed: false,
          items: [
            { text: 'What is Konfidence?', link: '/docs/introduction/what-is-konfidence' }
          ]
        },
        {
          text: 'Core Concepts',
          collapsed: false,
          items: [
            { text: 'Konfidence Core Concepts', link: '/docs/core-concepts/konfidence-core-concepts' },
            { text: 'Architecture', link: '/docs/core-concepts/architecture-overview' },
            { text: 'Glossary', link: '/docs/core-concepts/glossary' }
          ]
        },
        {
          text: 'User Guide',
          collapsed: false,
          items: []
        },
        {
          text: 'Operator Guide',
          collapsed: false,
          items: []
        },
        {
          text: 'Contributor Guide',
          collapsed: false,
          items: []
        }
      ]
    },

    // Edit link configuration
    editLink: {
      pattern: 'https://github.com/konfidence-project/konfidence-docs/edit/main/:path',
      text: 'Edit this page on GitHub'
    }
  }
})
