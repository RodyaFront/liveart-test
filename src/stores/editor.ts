import { nextTick } from 'vue'
import { defineStore } from 'pinia'
import { createAsyncGuard } from '@/lib/async/createAsyncGuard'
import { createCropSessionStart, hasPendingCrop as computeHasPendingCrop } from '@/lib/editor/cropSession'
import {
  buildImageDimensionsLabel,
  buildImageDimensionsTooltip,
} from '@/lib/editor/editorDimensions'
import { isDefaultAdjustments, mergeAdjustments } from '@/lib/image/adjustments'
import {
  assertDocumentMatchesSource,
  buildEditDocument,
  downloadEditDocument,
  EditDocumentParseError,
  EditDocumentSourceMismatchError,
  EditDocumentValidationError,
  parseEditDocument,
  validateEditDocument,
} from '@/lib/image/document'
import { downloadBlob } from '@/lib/image/downloadFile'
import { exportImageBlob, getExportImageFilename } from '@/lib/image/exportImage'
import {
  buildPreviewCssFilter,
  findAdjustOperationIndex,
  findCropOperation,
  findFilterOperationIndex,
  getAdjustmentsFromOperations,
  removeCropOperation,
  upsertCropOperation,
} from '@/lib/image/operations'
import {
  applyCropPreviewState as mergeCropPreviewState,
  revokeObjectUrl,
} from '@/lib/image/previewCache'
import { type CropPreviewState, syncCropPreviewFromOperations } from '@/lib/image/rebuildCropPreview'
import { readImageMeta } from '@/lib/image/readImageMeta'
import { READ_IMAGE_ERROR, validateImageFile } from '@/lib/image/validateImageFile'
import {
  type Adjustments,
  type CropRect,
  type EditOperation,
  type FilterValue,
  type ImageSourceMeta,
} from '@/types/editor'

interface EditorState {
  originalBlob: Blob | null
  originalMeta: ImageSourceMeta | null
  previewObjectUrl: string | null
  croppedPreviewUrl: string | null
  isCropEditing: boolean
  cropDraft: CropRect | null
  appliedCrop: CropRect | null
  operations: EditOperation[]
  error: string | null
  isLoading: boolean
  isApplyingCrop: boolean
  isViewingOriginal: boolean
  isExportingImage: boolean
  isImportingDocument: boolean
}

const loadGuard = createAsyncGuard()
const cropGuard = createAsyncGuard()
const exportGuard = createAsyncGuard()
const importGuard = createAsyncGuard()

function dimensionsInput(state: EditorState) {
  return {
    originalBlob: state.originalBlob,
    originalMeta: state.originalMeta,
    cropDraft: state.cropDraft,
    operations: state.operations,
  }
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    originalBlob: null,
    originalMeta: null,
    previewObjectUrl: null,
    croppedPreviewUrl: null,
    isCropEditing: false,
    cropDraft: null,
    appliedCrop: null,
    operations: [],
    error: null,
    isLoading: false,
    isApplyingCrop: false,
    isViewingOriginal: false,
    isExportingImage: false,
    isImportingDocument: false,
  }),

  getters: {
    hasImage: (state) => state.originalBlob !== null,

    displayPreviewUrl: (state) => state.croppedPreviewUrl ?? state.previewObjectUrl,

    effectivePreviewUrl(state) {
      if (state.isViewingOriginal) {
        return state.previewObjectUrl
      }

      return state.croppedPreviewUrl ?? state.previewObjectUrl
    },

    cropperImageUrl(state) {
      if (state.isCropEditing) {
        return state.previewObjectUrl
      }

      return state.croppedPreviewUrl ?? state.previewObjectUrl
    },

    showCropper: (state) => state.isCropEditing
      && state.originalBlob !== null
      && state.previewObjectUrl !== null
      && !state.isViewingOriginal,

    imageDimensionsLabel: (state) => buildImageDimensionsLabel(dimensionsInput(state)),

    imageDimensionsTooltip: (state) => buildImageDimensionsTooltip(dimensionsInput(state)),

    hasPendingCrop: (state) => computeHasPendingCrop(
      state.cropDraft,
      state.appliedCrop,
      state.isCropEditing,
    ),

    isCropApplied: (state) => !state.isCropEditing && findCropOperation(state.operations) !== null,

    canUndoLastCrop: (state) => findCropOperation(state.operations) !== null,

    canApplyCrop(state): boolean {
      return state.isCropEditing
        && state.cropDraft !== null
        && state.originalBlob !== null
        && !state.isApplyingCrop
    },

    adjustValues: (state) => getAdjustmentsFromOperations(state.operations),

    hasAdjustments: (state) => !isDefaultAdjustments(getAdjustmentsFromOperations(state.operations)),

    filterValue: (state) => {
      const filterOperation = state.operations.find((operation) => operation.type === 'filter')
      return filterOperation?.type === 'filter' ? filterOperation.name : null
    },

    hasFilter: (state) => state.operations.some((operation) => operation.type === 'filter'),

    previewCssFilter(): string | null {
      return buildPreviewCssFilter(this.operations)
    },

    effectivePreviewCssFilter(state): string | null {
      if (state.isViewingOriginal) {
        return null
      }

      return buildPreviewCssFilter(state.operations)
    },

    canViewOriginal: (state) => state.originalBlob !== null && !state.isCropEditing,

    canExport: (state) => state.originalBlob !== null
      && !state.isCropEditing
      && !state.isApplyingCrop
      && !state.isExportingImage
      && !state.isImportingDocument,

    canImportDocument: (state) => state.originalBlob !== null
      && !state.isApplyingCrop
      && !state.isImportingDocument,

    editDocument(state) {
      if (!state.originalMeta) {
        return null
      }

      return buildEditDocument(state.originalMeta, state.operations)
    },
  },

  actions: {
    applyCropPreviewState(cropState: CropPreviewState) {
      const next = mergeCropPreviewState(this.croppedPreviewUrl, cropState)
      this.croppedPreviewUrl = next.croppedPreviewUrl
      this.appliedCrop = next.appliedCrop
      this.cropDraft = next.cropDraft
    },

    async loadImage(file: File) {
      const seq = loadGuard.next()
      this.clearError()
      this.isLoading = true

      try {
        const validation = validateImageFile(file)
        if (!validation.ok) {
          if (loadGuard.isCurrent(seq)) {
            this.error = validation.message
          }
          return
        }

        const meta = await readImageMeta(file)

        if (!loadGuard.isCurrent(seq)) {
          return
        }

        revokeObjectUrl(this.previewObjectUrl)

        this.clearCrop()
        this.operations = []
        this.isViewingOriginal = false
        this.originalBlob = file
        this.originalMeta = meta
        this.previewObjectUrl = URL.createObjectURL(file)
        this.isCropEditing = false
      }
      catch {
        if (loadGuard.isCurrent(seq)) {
          this.error = READ_IMAGE_ERROR
        }
      }
      finally {
        if (loadGuard.isCurrent(seq)) {
          this.isLoading = false
        }
      }
    },

    setCropDraft(rect: CropRect) {
      this.cropDraft = rect
    },

    startCropEditing() {
      if (!this.originalBlob) {
        return
      }

      const session = createCropSessionStart(this.operations)

      this.isCropEditing = true
      this.isViewingOriginal = false
      this.appliedCrop = session.appliedCrop
      this.cropDraft = session.cropDraft
    },

    async applyCrop() {
      if (!this.cropDraft || !this.originalBlob) {
        return
      }

      const seq = cropGuard.next()
      const cropDraft = { ...this.cropDraft }

      this.isApplyingCrop = true

      try {
        this.operations = upsertCropOperation(this.operations, cropDraft)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, this.operations)

        if (!cropGuard.isCurrent(seq)) {
          return
        }

        this.applyCropPreviewState(cropState)
        this.isCropEditing = false

        await nextTick()
      }
      catch (error) {
        if (cropGuard.isCurrent(seq)) {
          console.error(error)
          this.error = 'Failed to apply crop'
        }
      }
      finally {
        if (cropGuard.isCurrent(seq)) {
          this.isApplyingCrop = false
        }
      }
    },

    async undoLastCrop() {
      if (!this.canUndoLastCrop || !this.originalBlob) {
        return
      }

      const seq = cropGuard.next()
      this.isApplyingCrop = true

      try {
        this.operations = removeCropOperation(this.operations)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, this.operations)

        if (!cropGuard.isCurrent(seq)) {
          return
        }

        this.applyCropPreviewState(cropState)
        this.isCropEditing = false
      }
      catch (error) {
        if (cropGuard.isCurrent(seq)) {
          console.error(error)
          this.error = 'Failed to undo crop'
        }
      }
      finally {
        if (cropGuard.isCurrent(seq)) {
          this.isApplyingCrop = false
        }
      }
    },

    clearCrop() {
      revokeObjectUrl(this.croppedPreviewUrl)

      this.croppedPreviewUrl = null
      this.isCropEditing = false
      this.cropDraft = null
      this.appliedCrop = null
      this.operations = removeCropOperation(this.operations)
    },

    setAdjust(partial: Partial<Adjustments>) {
      const nextValues = mergeAdjustments(this.adjustValues, partial)
      const adjustIndex = findAdjustOperationIndex(this.operations)

      if (isDefaultAdjustments(nextValues)) {
        if (adjustIndex >= 0) {
          this.operations.splice(adjustIndex, 1)
        }
        return
      }

      const adjustOperation: EditOperation = {
        type: 'adjust',
        brightness: nextValues.brightness,
        contrast: nextValues.contrast,
        saturation: nextValues.saturation,
      }

      if (adjustIndex >= 0) {
        this.operations.splice(adjustIndex, 1, adjustOperation)
      }
      else {
        this.operations.push(adjustOperation)
      }
    },

    resetAdjustments() {
      const adjustIndex = findAdjustOperationIndex(this.operations)
      if (adjustIndex >= 0) {
        this.operations.splice(adjustIndex, 1)
      }
    },

    setFilter(value: FilterValue) {
      const filterIndex = findFilterOperationIndex(this.operations)

      if (value === null) {
        if (filterIndex >= 0) {
          this.operations.splice(filterIndex, 1)
        }
        return
      }

      const filterOperation: EditOperation = {
        type: 'filter',
        name: value,
      }

      if (filterIndex >= 0) {
        this.operations.splice(filterIndex, 1, filterOperation)
      }
      else {
        this.operations.push(filterOperation)
      }
    },

    clearError() {
      this.error = null
    },

    toggleViewOriginal() {
      if (!this.canViewOriginal) {
        return
      }

      this.isViewingOriginal = !this.isViewingOriginal
    },

    setViewingOriginal(value: boolean) {
      this.isViewingOriginal = value
    },

    async exportImage() {
      if (!this.canExport || !this.originalBlob || !this.originalMeta) {
        return
      }

      const seq = exportGuard.next()
      this.clearError()
      this.isExportingImage = true

      try {
        const blob = await exportImageBlob(this.originalBlob, this.operations)

        if (!exportGuard.isCurrent(seq)) {
          return
        }

        const filename = getExportImageFilename(this.originalMeta.name)
        downloadBlob(blob, filename)
      }
      catch (error) {
        if (exportGuard.isCurrent(seq)) {
          console.error(error)
          this.error = 'Failed to export image'
        }
      }
      finally {
        if (exportGuard.isCurrent(seq)) {
          this.isExportingImage = false
        }
      }
    },

    exportDocumentJson() {
      const document = this.editDocument
      if (!document) {
        return
      }

      this.clearError()
      downloadEditDocument(document)
    },

    async importEditDocument(file: File) {
      if (!this.originalBlob || !this.originalMeta || !this.canImportDocument) {
        return
      }

      const seq = importGuard.next()
      this.clearError()
      this.isImportingDocument = true

      try {
        const text = await file.text()
        const document = validateEditDocument(parseEditDocument(text))
        assertDocumentMatchesSource(this.originalMeta, document)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, document.operations)

        if (!importGuard.isCurrent(seq)) {
          return
        }

        this.operations = document.operations
        this.applyCropPreviewState(cropState)
        this.isCropEditing = false
        this.isViewingOriginal = false
      }
      catch (error) {
        if (!importGuard.isCurrent(seq)) {
          return
        }

        if (
          error instanceof EditDocumentParseError
          || error instanceof EditDocumentValidationError
          || error instanceof EditDocumentSourceMismatchError
        ) {
          this.error = error.message
        }
        else {
          console.error(error)
          this.error = 'Failed to import JSON'
        }
      }
      finally {
        if (importGuard.isCurrent(seq)) {
          this.isImportingDocument = false
        }
      }
    },

    reset() {
      loadGuard.invalidate()
      cropGuard.invalidate()
      exportGuard.invalidate()
      importGuard.invalidate()

      revokeObjectUrl(this.previewObjectUrl)

      this.originalBlob = null
      this.originalMeta = null
      this.previewObjectUrl = null
      this.clearCrop()
      this.operations = []
      this.error = null
      this.isLoading = false
      this.isApplyingCrop = false
      this.isViewingOriginal = false
      this.isExportingImage = false
      this.isImportingDocument = false
    },
  },
})
