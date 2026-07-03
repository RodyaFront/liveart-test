import type { ThemeDefinition } from 'vuetify'

const light: ThemeDefinition = {
  dark: false,
  colors: {
    background: '#FFFFFF',
    surface: '#FAFAFA',
    'surface-variant': '#F0F0F0',
    'surface-bright': '#FFFFFF',
    'on-surface': '#1A1A1A',
    primary: '#000000',
    'on-primary': '#FFFFFF',
    secondary: '#4A5568',
    'on-secondary': '#FFFFFF',
    error: '#B00020',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FB8C00',
  },
}

export const vuetifyTheme = {
  defaultTheme: 'light' as const,
  themes: {
    light,
    // dark: { ... } — add when needed
  },
}
