<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useImageUpload } from '@/composables/useImageUpload'
import { useJsonImport } from '@/composables/useJsonImport'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const {
  isViewingOriginal,
  canViewOriginal,
  canExport,
  canImportDocument,
  isExportingImage,
  isImportingDocument,
  isCropEditing,
  hasImage,
  editDocument,
} = storeToRefs(store)

const {
  openFileDialog,
  onFileInputChange,
} = useImageUpload()

const {
  openJsonDialog,
  onJsonInputChange,
} = useJsonImport()

const exportDisabledReason = computed(() => {
  if (isCropEditing.value) {
    return 'Apply or cancel crop first'
  }

  return undefined
})

function uploadNewImage() {
  openFileDialog()
}
</script>

<template>
  <section class="editor-actions-panel">
    <h2 class="editor-actions-panel__title">
      Actions
    </h2>

    <input
      ref="fileInput"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      class="editor-actions-panel__hidden-input"
      @change="onFileInputChange"
    >

    <input
      ref="jsonInput"
      type="file"
      accept=".json,application/json"
      class="editor-actions-panel__hidden-input"
      @change="onJsonInputChange"
    >

    <div class="editor-actions-panel__grid">
      <v-btn
        stacked
        density="compact"
        class="editor-actions-panel__btn"
        variant="outlined"
        prepend-icon="mdi-upload"
        @click="uploadNewImage"
      >
        Upload new image
      </v-btn>

      <v-btn
        stacked
        density="compact"
        class="editor-actions-panel__btn"
        :variant="isViewingOriginal ? 'flat' : 'outlined'"
        :color="isViewingOriginal ? 'success' : undefined"
        prepend-icon="mdi-eye-outline"
        :disabled="!canViewOriginal"
        @click="store.toggleViewOriginal()"
      >
        View original
      </v-btn>

      <v-btn
        stacked
        density="compact"
        class="editor-actions-panel__btn"
        variant="outlined"
        prepend-icon="mdi-code-json"
        :disabled="!hasImage || !editDocument"
        @click="store.exportDocumentJson()"
      >
        Export JSON
      </v-btn>

      <v-btn
        stacked
        density="compact"
        class="editor-actions-panel__btn"
        variant="outlined"
        prepend-icon="mdi-file-import"
        :disabled="!canImportDocument"
        :loading="isImportingDocument"
        @click="openJsonDialog"
      >
        Import JSON
      </v-btn>
    </div>

    <v-btn
      block
      class="editor-actions-panel__export-btn"
      color="primary"
      prepend-icon="mdi-download"
      :disabled="!canExport"
      :loading="isExportingImage"
      :title="exportDisabledReason"
      @click="store.exportImage()"
    >
      Export image
    </v-btn>
  </section>
</template>

<style scoped lang="scss">
$action-btn-size: 5.375rem; // 86px

.editor-actions-panel__title {
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.43;
  margin: 0 0 0.5rem;
}

.editor-actions-panel__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, $action-btn-size);
  gap: 0.25rem;
}

.editor-actions-panel__btn {
  width: $action-btn-size !important;
  height: $action-btn-size !important;
  min-width: $action-btn-size !important;
  min-height: $action-btn-size !important;
  max-width: $action-btn-size;
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

.editor-actions-panel__export-btn {
  margin-top: .25rem;
}

.editor-actions-panel__hidden-input {
  display: none;
}
</style>
