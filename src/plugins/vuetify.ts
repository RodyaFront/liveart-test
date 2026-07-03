import '@mdi/font/css/materialdesignicons.css'
import '@/styles/main.scss'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import { vuetifyDefaults } from './vuetify/defaults'
import { vuetifyTheme } from './vuetify/theme'

export default createVuetify({
  components,
  directives,
  theme: vuetifyTheme,
  defaults: vuetifyDefaults,
})
