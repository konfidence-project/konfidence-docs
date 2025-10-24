import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({

  
  title: "Konfidence",
  description: "Public Documentation for Project Konfidence",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    socialLinks: [
      { icon: 'github', link: 'https://github.com/konfidence-project/konfidence-docs' }
    ],
    logo: {src: '/assets/logo/Icon_only/SVG/512_konfidence_icon_color.svg'},
    
  }
})
