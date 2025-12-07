import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import DocsCards from './components/DocsCards.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DocsCards', DocsCards)
  }
}
