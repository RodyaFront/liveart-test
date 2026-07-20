import { computed } from 'vue'
import {
  buildImageDimensionsLabel,
  buildImageDimensionsTooltip,
} from '@/lib/editor/editorDimensions'
import { buildEditDocument } from '@/lib/image/document'
import { buildPreviewCssFilter } from '@/lib/image/operations'
import type { EditorCore } from './state'

export function usePreviewGetters(core: EditorCore) {
  const {
    originalBlob,
    originalMeta,
    previewObjectUrl,
    croppedPreviewUrl,
    isCropEditing,
    cropDraft,
    operations,
    error,
    isApplyingCrop,
    isViewingOriginal,
    isExportingImage,
    isImportingDocument,
  } = core

  const hasImage = computed(() => originalBlob.value !== null)

  const displayPreviewUrl = computed(() => croppedPreviewUrl.value ?? previewObjectUrl.value)

  const effectivePreviewUrl = computed(() => {
    if (isViewingOriginal.value) {
      return previewObjectUrl.value
    }

    return croppedPreviewUrl.value ?? previewObjectUrl.value
  })

  const cropperImageUrl = computed(() => {
    if (isCropEditing.value) {
      return previewObjectUrl.value
    }

    return croppedPreviewUrl.value ?? previewObjectUrl.value
  })

  const showCropper = computed(() => (
    isCropEditing.value
    && originalBlob.value !== null
    && previewObjectUrl.value !== null
    && !isViewingOriginal.value
  ))

  const dimensionsInput = computed(() => ({
    originalBlob: originalBlob.value,
    originalMeta: originalMeta.value,
    cropDraft: cropDraft.value,
    operations: operations.value,
  }))

  const imageDimensionsLabel = computed(() => buildImageDimensionsLabel(dimensionsInput.value))

  const imageDimensionsTooltip = computed(() => buildImageDimensionsTooltip(dimensionsInput.value))

  const previewCssFilter = computed(() => buildPreviewCssFilter(operations.value))

  const effectivePreviewCssFilter = computed(() => {
    if (isViewingOriginal.value) {
      return null
    }

    return buildPreviewCssFilter(operations.value)
  })

  const canViewOriginal = computed(() => originalBlob.value !== null && !isCropEditing.value)

  const canExport = computed(() => (
    originalBlob.value !== null
    && !isCropEditing.value
    && !isApplyingCrop.value
    && !isExportingImage.value
    && !isImportingDocument.value
  ))

  const canImportDocument = computed(() => (
    originalBlob.value !== null
    && !isApplyingCrop.value
    && !isImportingDocument.value
  ))

  const editDocument = computed(() => {
    if (!originalMeta.value) {
      return null
    }

    return buildEditDocument(originalMeta.value, operations.value)
  })

  function clearError() {
    error.value = null
  }

  function toggleViewOriginal() {
    if (!canViewOriginal.value) {
      return
    }

    isViewingOriginal.value = !isViewingOriginal.value
  }

  function setViewingOriginal(value: boolean) {
    isViewingOriginal.value = value
  }

  return {
    hasImage,
    displayPreviewUrl,
    effectivePreviewUrl,
    cropperImageUrl,
    showCropper,
    imageDimensionsLabel,
    imageDimensionsTooltip,
    previewCssFilter,
    effectivePreviewCssFilter,
    canViewOriginal,
    canExport,
    canImportDocument,
    editDocument,
    clearError,
    toggleViewOriginal,
    setViewingOriginal,
  }
}

export type PreviewGetters = ReturnType<typeof usePreviewGetters>
