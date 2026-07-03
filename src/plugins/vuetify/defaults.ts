import type { DefaultsInstance } from 'vuetify'

export const vuetifyDefaults: DefaultsInstance = {
  global: {
    ripple: true,
  },
  VBtn: {
    variant: 'flat',
  },
  VCard: {
    rounded: 'lg',
    elevation: 0,
  },
  VSlider: {
    color: 'primary',
    hideDetails: true,
    thumbSize: 16,
    trackSize: 4,
  },
  VTextField: {
    variant: 'outlined',
    density: 'compact',
    hideDetails: true,
  },
  VSelect: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: true,
    singleLine: true,
    centerAffix: true,
  },
  VFileInput: {
    variant: 'outlined',
    density: 'comfortable',
    hideDetails: true,
  },
  VToolbar: {
    flat: true,
  },
  VChip: {
    size: 'small',
  },
}
