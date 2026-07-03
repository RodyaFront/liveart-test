<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const {
  hasPendingCrop,
  isCropApplied,
  isCropEditing,
  canApplyCrop,
  canUndoLastCrop,
} = storeToRefs(store)
</script>

<template>
  <section class="editor-crop-panel">
    <div class="editor-crop-panel__media">
      <div class="editor-crop-panel__media-figure">
        <v-icon
          icon="mdi-crop"
          class="editor-crop-panel__media-icon"
        />
      </div>

      <div class="editor-crop-panel__media-body">
        <h2 class="editor-crop-panel__title">
          Crop
        </h2>

        <p class="editor-crop-panel__hint">
          <template v-if="isCropEditing">
            Drag the handles on the preview to adjust the crop area.
          </template>
          <template v-else-if="isCropApplied">
            Crop applied. Click Adjust crop to refine the result.
          </template>
          <template v-else>
            Click Crop to select an area on the preview.
          </template>
        </p>
      </div>
    </div>

    <div
      v-if="isCropApplied && !hasPendingCrop && isCropEditing"
      class="editor-crop-panel__meta"
    >
      <v-chip
        size="x-small"
        variant="tonal"
        color="success"
      >
        Applied
      </v-chip>
    </div>

    <v-btn
      v-if="isCropEditing"
      block
      variant="flat"
      class="editor-crop-panel__apply-btn"
      prepend-icon="mdi-crop"
      :disabled="!canApplyCrop"
      :loading="store.isApplyingCrop"
      @click="store.applyCrop()"
    >
      Apply crop
    </v-btn>

    <div
      v-else
      class="editor-crop-panel__actions"
    >
      <v-btn
        class="editor-crop-panel__action-btn"
        variant="tonal"
        prepend-icon="mdi-crop"
        @click="store.startCropEditing()"
      >
        {{ isCropApplied ? 'Adjust crop' : 'Crop' }}
      </v-btn>
      <v-btn
        class="editor-crop-panel__action-btn"
        variant="outlined"
        prepend-icon="mdi-undo"
        :disabled="!canUndoLastCrop"
        @click="store.undoLastCrop()"
      >
        Undo crop
      </v-btn>
    </div>
  </section>
</template>

<style scoped lang="scss">
.editor-crop-panel__media {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.editor-crop-panel__media-figure {
  display: flex;
  flex-shrink: 0;
  align-items: center;
}

.editor-crop-panel__media-icon {
  font-size: 2.25rem;
  opacity: 0.7;
}

.editor-crop-panel__media-body {
  min-width: 0;
}

.editor-crop-panel__title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.43;
  margin: 0;
}

.editor-crop-panel__hint {
  font-size: 0.75rem;
  line-height: 1.33;
  margin: 0;
  opacity: 0.7;
}

.editor-crop-panel__meta {
  margin-bottom: 0.75rem;
}

.editor-crop-panel__apply-btn {
  background: color-mix(in srgb, rgb(var(--v-theme-success)) 10%, transparent);
  color: rgb(var(--v-theme-success));

  &:hover:not(:disabled) {
    background: color-mix(in srgb, rgb(var(--v-theme-success)) 15%, transparent);
  }
}

.editor-crop-panel__actions {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 0.5rem;
}

.editor-crop-panel__action-btn {
  width: 100%;
  min-width: 0;
}
</style>
