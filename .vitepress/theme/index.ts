import DefaultTheme from 'vitepress/theme'
import Layout from './Layout.vue'
import DocsCards from './components/DocsCards.vue'
import FeatureOverview from './components/FeatureOverview.vue'
import DrawioDiagram from './components/DrawioDiagram.vue'
import { theme as openapiTheme, useOpenapi } from 'vitepress-openapi/client'
import 'vitepress-openapi/dist/style.css'
import spec from '../../src/docs/reference/api.json'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('DocsCards', DocsCards)
    app.component('DrawioDiagram', DrawioDiagram)
    app.component('FeatureOverview', FeatureOverview)
    useOpenapi({
      spec,
      config: {
        operation: {
          hiddenSlots: ['playground', 'try-it'],
        },
        codeSamples: {
          defaultLang: 'curl',
          availableLanguages: [
            { lang: 'curl', label: 'cURL', target: 'shell', client: 'curl', highlighter: 'bash' },
            { lang: 'javascript', label: 'JavaScript', target: 'js', client: 'fetch', highlighter: 'javascript' },
            { lang: 'go', label: 'Go', target: 'go', client: 'native', highlighter: 'go' },
          ],
        },
      },
    })
    openapiTheme.enhanceApp({ app })
  }
}
