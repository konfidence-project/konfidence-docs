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
    siteTitle:false    
  }
})
