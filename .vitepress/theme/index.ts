import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import DocsCards from './components/DocsCards.vue'
import DrawioDiagram from './components/DrawioDiagram.vue'
import FeatureOverview from './components/FeatureOverview.vue'
import DrawioDiagram from './components/DrawioDiagram.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DocsCards', DocsCards)
    app.component('DrawioDiagram', DrawioDiagram)
    app.component('FeatureOverview', FeatureOverview)
    app.component('DrawioDiagram', DrawioDiagram)
  }
}
