import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  srcDir: "docs",
  
  title: "Konfidence Docs",
  description: "Public Documentation for Project Konfidence",
  themeConfig: {
    footer: {
      message: 'Funded by the European Union - Part of the ApeiroRA projec  - TODO: add real footer',
    },
    // https://vitepress.dev/reference/default-theme-config
    socialLinks: [
      { icon: 'github', link: 'https://github.com/konfidence-project/konfidence-docs' }
    ]
  }
})
