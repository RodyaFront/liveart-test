import { defineStore } from 'pinia'
import { revokeObjectUrl } from '@/lib/image/previewCache'
import { createEditorGuards, createEditorState } from './state'
import { useAdjustFilter } from './useAdjustFilter'
import { useCropFlow } from './useCropFlow'
import { useExportImport } from './useExportImport'
import { useLoadImage } from './useLoadImage'
import { usePreviewGetters } from './usePreviewGetters'

export const useEditorStore = defineStore('editor', () => {
  const core = createEditorState()
  const guards = createEditorGuards()

  const crop = useCropFlow(core, guards.cropGuard)
  const adjust = useAdjustFilter(core)
  const preview = usePreviewGetters(core)
  const load = useLoadImage(core, crop, preview, guards.loadGuard)
  const io = useExportImport(core, crop, preview, {
    exportGuard: guards.exportGuard,
    importGuard: guards.importGuard,
  })

  function reset() {
    guards.loadGuard.invalidate()
    guards.cropGuard.invalidate()
    guards.exportGuard.invalidate()
    guards.importGuard.invalidate()

    revokeObjectUrl(core.previewObjectUrl.value)

    core.originalBlob.value = null
    core.originalMeta.value = null
    core.previewObjectUrl.value = null
    crop.clearCrop()
    core.operations.value = []
    core.error.value = null
    core.isLoading.value = false
    core.isApplyingCrop.value = false
    core.isViewingOriginal.value = false
    core.isExportingImage.value = false
    core.isImportingDocument.value = false
  }

  return {
    originalBlob: core.originalBlob,
    originalMeta: core.originalMeta,
    previewObjectUrl: core.previewObjectUrl,
    croppedPreviewUrl: core.croppedPreviewUrl,
    isCropEditing: core.isCropEditing,
    cropDraft: core.cropDraft,
    appliedCrop: core.appliedCrop,
    operations: core.operations,
    error: core.error,
    isLoading: core.isLoading,
    isApplyingCrop: core.isApplyingCrop,
    isViewingOriginal: core.isViewingOriginal,
    isExportingImage: core.isExportingImage,
    isImportingDocument: core.isImportingDocument,

    hasPendingCrop: crop.hasPendingCrop,
    isCropApplied: crop.isCropApplied,
    canUndoLastCrop: crop.canUndoLastCrop,
    canApplyCrop: crop.canApplyCrop,
    applyCropPreviewState: crop.applyCropPreviewState,
    setCropDraft: crop.setCropDraft,
    startCropEditing: crop.startCropEditing,
    cancelCropEditing: crop.cancelCropEditing,
    applyCrop: crop.applyCrop,
    undoLastCrop: crop.undoLastCrop,
    clearCrop: crop.clearCrop,

    adjustValues: adjust.adjustValues,
    hasAdjustments: adjust.hasAdjustments,
    filterValue: adjust.filterValue,
    hasFilter: adjust.hasFilter,
    setAdjust: adjust.setAdjust,
    resetAdjustments: adjust.resetAdjustments,
    setFilter: adjust.setFilter,

    hasImage: preview.hasImage,
    displayPreviewUrl: preview.displayPreviewUrl,
    effectivePreviewUrl: preview.effectivePreviewUrl,
    cropperImageUrl: preview.cropperImageUrl,
    showCropper: preview.showCropper,
    imageDimensionsLabel: preview.imageDimensionsLabel,
    imageDimensionsTooltip: preview.imageDimensionsTooltip,
    previewCssFilter: preview.previewCssFilter,
    effectivePreviewCssFilter: preview.effectivePreviewCssFilter,
    canViewOriginal: preview.canViewOriginal,
    canExport: preview.canExport,
    canImportDocument: preview.canImportDocument,
    editDocument: preview.editDocument,
    clearError: preview.clearError,
    toggleViewOriginal: preview.toggleViewOriginal,
    setViewingOriginal: preview.setViewingOriginal,

    loadImage: load.loadImage,

    exportImage: io.exportImage,
    exportDocumentJson: io.exportDocumentJson,
    importEditDocument: io.importEditDocument,

    reset,
  }
})
