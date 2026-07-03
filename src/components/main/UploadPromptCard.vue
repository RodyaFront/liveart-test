<script setup lang="ts">
import { useImageUpload } from '@/composables/useImageUpload'
import {
  ACCEPTED_FILE_ACCEPT,
  ACCEPTED_FORMATS_LABEL,
} from '@/lib/image/validateImageFile'

const {
  store,
  isDragOver,
  openFileDialog,
  onFileInputChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
} = useImageUpload()
</script>

<template>
  <div class="upload-prompt">
    <div
      ref="dropZone"
      class="upload-prompt__drop-zone"
      @dragenter.prevent="onDragEnter"
      @dragover.prevent="onDragOver"
      @dragleave="onDragLeave"
      @drop.prevent="onDrop"
    >
      <v-sheet
        class="upload-prompt__sheet"
        :class="{ 'upload-prompt__sheet--dragover': isDragOver }"
      >
      <v-progress-linear
        v-if="store.isLoading"
        indeterminate
        color="primary"
        class="upload-prompt__progress"
      />

      <div class="upload-prompt__body">
        <v-icon
          icon="mdi-file-image-outline"
          size="24"
          class="upload-prompt__icon"
        />

        <h1 class="upload-prompt__title">
          Upload image
        </h1>

        <p class="upload-prompt__description">
          Drag and drop your file here, or choose from your device.
        </p>

        <input
          ref="fileInput"
          type="file"
          :accept="ACCEPTED_FILE_ACCEPT"
          class="upload-prompt__file-input"
          tabindex="-1"
          @change="onFileInputChange"
        >

        <v-btn
          color="primary"
          prepend-icon="mdi-upload"
          :loading="store.isLoading"
          :disabled="store.isLoading"
          @click="openFileDialog"
        >
          Choose file
        </v-btn>

        <v-alert
          v-if="store.error"
          type="error"
          variant="tonal"
          density="compact"
          class="upload-prompt__alert"
          closable
          @click:close="store.clearError()"
        >
          {{ store.error }}
        </v-alert>

        <p class="upload-prompt__hint">
          {{ ACCEPTED_FORMATS_LABEL }}
        </p>
      </div>
      </v-sheet>
    </div>
  </div>
</template>

<style scoped lang="scss">
$upload-sheet-radius: 12px;
$upload-sheet-tint: 5%;

.upload-prompt {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  padding: 1rem;
}

.upload-prompt__drop-zone {
  width: min(100%, 30rem);
  aspect-ratio: 1 / 1;
}

.upload-prompt__sheet {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  box-sizing: border-box;
  position: relative;
  border-radius: $upload-sheet-radius;
  background-color: transparent;
  border: 1px dashed currentColor;
  transition: background-color 0.15s ease;

  &--dragover {
    background-color: color-mix(in srgb, currentColor $upload-sheet-tint, transparent);
  }
}

.upload-prompt__progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
}

.upload-prompt__body {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 1.5rem;
  width: 100%;
  min-height: 0;
}

.upload-prompt__icon {
  flex-shrink: 0;
  width: 1.5rem;
  height: 1.5rem;
  margin-bottom: 1rem;
}

.upload-prompt__title {
  font-size: 1rem;
  font-weight: 500;
}

.upload-prompt__description {
  font-size: 0.875rem;
  line-height: 1.43;
  margin: 0 0 1rem;
  opacity: 0.7;
}

.upload-prompt__file-input {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
}

.upload-prompt__alert {
  width: 100%;
  margin-top: 1rem;
  text-align: left;
}

.upload-prompt__hint {
  font-size: 0.75rem;
  line-height: 1.33;
  margin: 0.5rem 0 0;
  opacity: 0.7;
}
</style>
