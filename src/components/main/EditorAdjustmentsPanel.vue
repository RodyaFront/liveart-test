<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import type { Adjustments } from '@/types/editor'

const store = useEditorStore()
const {
  adjustValues,
  hasAdjustments,
  isApplyingCrop,
} = storeToRefs(store)

const sliders = [
  { key: 'brightness' as const, label: 'Brightness', icon: 'mdi-brightness-6' },
  { key: 'contrast' as const, label: 'Contrast', icon: 'mdi-contrast-circle' },
  { key: 'saturation' as const, label: 'Saturation', icon: 'mdi-palette' },
]

function onSliderUpdate(key: keyof Adjustments, value: number) {
  store.setAdjust({ [key]: value })
}
</script>

<template>
  <section class="editor-adjustments-panel">
    <h2 class="editor-adjustments-panel__title">
      Adjustments
    </h2>

    <div
      v-for="slider in sliders"
      :key="slider.key"
      class="editor-adjustments-panel__slider"
    >
      <div class="editor-adjustments-panel__slider-header">
        <span class="editor-adjustments-panel__slider-label">
          <v-icon
            :icon="slider.icon"
            size="small"
            class="mr-2"
          />
          {{ slider.label }}
        </span>
        <span class="editor-adjustments-panel__slider-value">
          {{ adjustValues[slider.key] }}
        </span>
      </div>
      <v-slider
        :model-value="adjustValues[slider.key]"
        :min="-100"
        :max="100"
        :step="1"
        :disabled="isApplyingCrop"
        hide-details
        color="primary"
        @update:model-value="onSliderUpdate(slider.key, $event)"
      />
    </div>

    <v-btn
      block
      variant="outlined"
      prepend-icon="mdi-refresh"
      class="editor-adjustments-panel__reset-btn"
      :disabled="!hasAdjustments || isApplyingCrop"
      @click="store.resetAdjustments()"
    >
      Reset adjustments
    </v-btn>
  </section>
</template>

<style scoped lang="scss">
.editor-adjustments-panel__title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.43;
  margin: 0 0 0.75rem;
}

.editor-adjustments-panel__slider {
  margin-bottom: 0.25rem;

  &:last-of-type {
    margin-bottom: 0.75rem;
  }
}

.editor-adjustments-panel__slider-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.editor-adjustments-panel__slider-label {
  display: flex;
  align-items: center;
  font-size: 0.8125rem;
}

.editor-adjustments-panel__slider-value {
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}
</style>
