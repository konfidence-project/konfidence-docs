import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({


  title: "Konfidence",
  description: "Public Documentation for Project Konfidence",
  ignoreDeadLinks:true,
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config

    logo: {
      light: '/assets/logo/full/SVG/400_konfidence_logo_light.svg',
        dark: '/assets/logo/full/SVG/400_konfidence_logo_dark.svg'},
    siteTitle:false,

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
          link: '/docs/getting-started/'
        },
        {
          text: 'Introduction',
          link: '/docs/introduction/'
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Overview', link: '/docs/core-concepts/' },
            { text: 'Architecture', link: '/docs/core-concepts/architecture-overview' },
            { text: 'Key Objects', link: '/docs/core-concepts/key-objects' },
            { text: 'Glossary', link: '/docs/core-concepts/glossary' }
          ]
        },
        {
          text: 'User Guide',
          link: '/docs/user-guide/'
        },
        {
          text: 'Operator Guide',
          link: '/docs/operator-guide/'
        },
        {
          text: 'Contributor Guide',
          link: '/docs/contributor-guide/'
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
