import DefaultTheme from 'vitepress/theme'
import { theme as openapiTheme, useOpenapi } from 'vitepress-openapi/client'
import 'vitepress-openapi/dist/style.css'
import AdrHeader from '../../../../.vitepress/theme/components/AdrHeader.vue'
import DrawioDiagram from '../../../../.vitepress/theme/components/DrawioDiagram.vue'
import spec from '../../../../src/docs/reference/api.json'
import Layout from './Layout.vue'
import DeliveryPath from './DeliveryPath.vue'
import TaskCards from './TaskCards.vue'
import './custom.css'

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    app.component('AdrHeader', AdrHeader)
    app.component('DrawioDiagram', DrawioDiagram)
    app.component('DeliveryPath', DeliveryPath)
    app.component('TaskCards', TaskCards)
    useOpenapi({ spec, config: { operation: { hiddenSlots: ['playground', 'try-it'] } } })
    openapiTheme.enhanceApp({ app })
  },
}
