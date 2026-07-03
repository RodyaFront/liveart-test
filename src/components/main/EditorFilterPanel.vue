<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'
import type { FilterValue } from '@/types/editor'

const store = useEditorStore()
const {
  filterValue,
  isApplyingCrop,
} = storeToRefs(store)

const filterChoices: Array<{ title: string; value: FilterValue; icon: string }> = [
  { title: 'None', value: null, icon: 'mdi-filter-off-outline' },
  { title: 'Grayscale', value: 'grayscale', icon: 'mdi-image-filter-black-white' },
  { title: 'Sepia', value: 'sepia', icon: 'mdi-image-filter-vintage' },
]

function isSelected(value: FilterValue): boolean {
  return filterValue.value === value
}
</script>

<template>
  <section class="editor-filter-panel">
    <h2 class="editor-filter-panel__title">
      Filter
    </h2>

    <div class="editor-filter-panel__grid">
      <v-btn
        v-for="option in filterChoices"
        :key="option.title"
        stacked
        density="compact"
        class="editor-filter-panel__btn"
        :variant="isSelected(option.value) ? 'flat' : 'outlined'"
        :color="isSelected(option.value) ? 'primary' : undefined"
        :prepend-icon="option.icon"
        :disabled="isApplyingCrop"
        @click="store.setFilter(option.value)"
      >
        {{ option.title }}
      </v-btn>
    </div>
  </section>
</template>

<style scoped lang="scss">
$filter-btn-size: 4rem; // 64px

.editor-filter-panel__title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.43;
  margin: 0 0 0.50rem;
}

.editor-filter-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, $filter-btn-size);
  gap: 0.25rem;
}

.editor-filter-panel__btn {
  width: $filter-btn-size !important;
  height: $filter-btn-size !important;
  min-width: $filter-btn-size !important;
  min-height: $filter-btn-size !important;
  max-width: $filter-btn-size;
  padding: 0.25rem !important;

  :deep(.v-btn__prepend) {
    margin-bottom: 0.125rem;
  }

  :deep(.v-btn__content) {
    font-size: 0.625rem;
    line-height: 1.15;
    letter-spacing: normal;
    text-align: center;
    white-space: normal;
  }

  :deep(.v-icon) {
    font-size: 1.125rem;
  }
}
</style>
