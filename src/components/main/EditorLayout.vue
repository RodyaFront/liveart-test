<script setup lang="ts">
import { storeToRefs } from 'pinia'
import EditorPreview from '@/components/main/EditorPreview.vue'
import EditorSidebar from '@/components/main/EditorSidebar.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { imageDimensionsLabel, imageDimensionsTooltip, isViewingOriginal, error } = storeToRefs(store)
</script>

<template>
  <div class="editor-layout">
    <v-alert
      v-if="error"
      class="editor-layout__error"
      type="error"
      variant="tonal"
      closable
      density="compact"
      @click:close="store.clearError()"
    >
      {{ error }}
    </v-alert>

    <div class="editor-layout__body">
      <div class="editor-layout__preview">
        <div
          v-if="imageDimensionsLabel || isViewingOriginal"
          class="editor-layout__info-chips"
        >
          <v-tooltip
            v-if="imageDimensionsLabel"
            location="bottom"
            content-class="editor-layout__dimensions-tooltip"
            :text="imageDimensionsTooltip ?? imageDimensionsLabel"
          >
            <template #activator="{ props: tooltipProps }">
              <v-chip
                v-bind="tooltipProps"
                class="editor-layout__info-chip editor-layout__info-chip--dimensions"
                size="small"
                variant="flat"
                color="surface-bright"
              >
                {{ imageDimensionsLabel }}
              </v-chip>
            </template>
          </v-tooltip>

          <v-chip
            v-if="isViewingOriginal"
            class="editor-layout__info-chip editor-layout__info-chip--original"
            size="small"
            variant="flat"
            color="success"
          >
            Viewing original
          </v-chip>
        </div>

        <div class="editor-layout__preview-body">
          <EditorPreview />
        </div>
      </div>

      <div class="editor-layout__sidebar">
        <EditorSidebar />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-layout {
  display: flex;
  flex-direction: column;
  background-color: var(--editor-bg);
  gap: var(--editor-panel-gap);
  box-sizing: border-box;
  height: 100vh;
  min-height: 100vh;
  padding: 0.5rem;
}

.editor-layout__body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 25rem);
  flex: 1;
  gap: var(--editor-panel-gap);
  min-height: 0;
}

.editor-layout__sidebar {
  max-width: 25rem;
  height: 100%;
  min-height: 0;
  overflow: hidden;
}

.editor-layout__error {
  flex-shrink: 0;
}

.editor-layout__preview {
  position: relative;
  height: 100%;
  min-height: 0;
  background: #000;
  border-radius: var(--editor-preview-radius);
}

.editor-layout__preview-body {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 0;
  padding: var(--editor-preview-padding);
  border-radius: inherit;
  overflow: hidden;
}

.editor-layout__info-chips {
  position: absolute;
  top: var(--editor-preview-chip-inset);
  right: var(--editor-preview-chip-inset);
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.editor-layout__info-chip {
  border-radius: var(--editor-preview-chip-corner-radius) !important;

  :deep(.v-chip__underlay),
  :deep(.v-chip__overlay) {
    opacity: 0;
  }
}

.editor-layout__info-chip--dimensions {
  font-variant-numeric: tabular-nums;
  background-color: var(--editor-preview-chip-bg) !important;
  color: var(--editor-preview-chip-fg) !important;

  :deep(.v-chip__content) {
    color: inherit;
  }
}

.editor-layout__info-chip--original {
  background-color: rgb(var(--v-theme-success)) !important;
  color: #fff !important;

  :deep(.v-chip__content) {
    color: inherit;
  }
}

@media (max-width: 960px) {
  .editor-layout {
    height: auto;
    min-height: 100vh;
  }

  .editor-layout__body {
    grid-template-columns: 1fr;
    grid-template-rows: 100vh 100vh;
  }

  .editor-layout__preview {
    order: 1;
    height: 100vh;
    min-height: 0;
  }

  .editor-layout__sidebar {
    order: 2;
    max-width: none;
    height: 100vh;
    max-height: 100vh;
  }
}
</style>

<style lang="scss">
/* Teleported tooltip — outside scoped tree */
.editor-layout__dimensions-tooltip {
  background-color: rgb(26, 26, 26) !important;
  color: #fff !important;
  font-size: 0.75rem;
  line-height: 1.33;
  padding: 0.375rem 0.625rem !important;
  border-radius: 0.375rem;
  box-shadow: 0 0.125rem 0.5rem rgb(0 0 0 / 0.35);
}
</style>
