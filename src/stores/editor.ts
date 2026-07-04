import { nextTick } from 'vue'
import { defineStore } from 'pinia'
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
  cropOperationToRect,
  findAdjustOperationIndex,
  findCropOperation,
  findFilterOperationIndex,
  getAdjustmentsFromOperations,
  removeCropOperation,
  upsertCropOperation,
} from '@/lib/image/operations'
import { type CropPreviewState, syncCropPreviewFromOperations } from '@/lib/image/rebuildCropPreview'
import { cropRectsEqual } from '@/lib/image/cropRect'
import { readImageMeta } from '@/lib/image/readImageMeta'
import { READ_IMAGE_ERROR, validateImageFile } from '@/lib/image/validateImageFile'
import {
  type Adjustments,
  type CropHistoryEntry,
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
  cropApplyHistory: CropHistoryEntry[]
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

let loadSeq = 0
let cropSeq = 0
let exportSeq = 0
let importSeq = 0

function formatImageDimensions(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)} px`
}

function resolveDisplayedDimensions(state: EditorState): { width: number; height: number } | null {
  if (!state.originalBlob) {
    return null
  }

  if (state.cropDraft) {
    return {
      width: state.cropDraft.width,
      height: state.cropDraft.height,
    }
  }

  const cropOperation = findCropOperation(state.operations)
  if (cropOperation) {
    return {
      width: cropOperation.width,
      height: cropOperation.height,
    }
  }

  if (state.originalMeta) {
    return {
      width: state.originalMeta.width,
      height: state.originalMeta.height,
    }
  }

  return null
}

export const useEditorStore = defineStore('editor', {
  state: (): EditorState => ({
    originalBlob: null,
    originalMeta: null,
    previewObjectUrl: null,
    croppedPreviewUrl: null,
    cropApplyHistory: [],
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

    imageDimensionsLabel: (state) => {
      const dimensions = resolveDisplayedDimensions(state)
      if (!dimensions) {
        return null
      }

      return formatImageDimensions(dimensions.width, dimensions.height)
    },

    imageDimensionsTooltip(state): string | null {
      if (!state.originalMeta) {
        return null
      }

      const displayed = resolveDisplayedDimensions(state)
      if (!displayed) {
        return null
      }

      const original = formatImageDimensions(state.originalMeta.width, state.originalMeta.height)
      const current = formatImageDimensions(displayed.width, displayed.height)
      const hasCropOutput = displayed.width !== state.originalMeta.width
        || displayed.height !== state.originalMeta.height

      if (hasCropOutput) {
        return `Cropped output: ${current}. Original: ${original}.`
      }

      return `Original image dimensions: ${original}`
    },

    hasPendingCrop: (state) => {
      if (!state.cropDraft || !state.isCropEditing) {
        return false
      }

      if (!state.appliedCrop) {
        return true
      }

      return !cropRectsEqual(state.cropDraft, state.appliedCrop)
    },

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
      if (this.croppedPreviewUrl) {
        URL.revokeObjectURL(this.croppedPreviewUrl)
      }

      for (const entry of this.cropApplyHistory) {
        URL.revokeObjectURL(entry.croppedPreviewUrl)
      }

      this.cropApplyHistory = []
      this.croppedPreviewUrl = cropState.croppedPreviewUrl
      this.cropApplyHistory = cropState.cropApplyHistory
      this.appliedCrop = cropState.appliedCrop
      this.cropDraft = cropState.cropDraft
    },

    async loadImage(file: File) {
      const seq = ++loadSeq
      this.clearError()
      this.isLoading = true

      try {
        const validation = validateImageFile(file)
        if (!validation.ok) {
          if (seq === loadSeq) {
            this.error = validation.message
          }
          return
        }

        const meta = await readImageMeta(file)

        if (seq !== loadSeq) {
          return
        }

        if (this.previewObjectUrl) {
          URL.revokeObjectURL(this.previewObjectUrl)
        }

        this.clearCrop()
        this.operations = []
        this.isViewingOriginal = false
        this.originalBlob = file
        this.originalMeta = meta
        this.previewObjectUrl = URL.createObjectURL(file)
        this.isCropEditing = false
      }
      catch {
        if (seq === loadSeq) {
          this.error = READ_IMAGE_ERROR
        }
      }
      finally {
        if (seq === loadSeq) {
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

      const existingCrop = findCropOperation(this.operations)
      const cropRect = existingCrop ? cropOperationToRect(existingCrop) : null

      this.isCropEditing = true
      this.isViewingOriginal = false
      this.appliedCrop = cropRect
      this.cropDraft = cropRect ? { ...cropRect } : null
    },

    async applyCrop() {
      if (!this.cropDraft || !this.originalBlob) {
        return
      }

      const seq = ++cropSeq
      const cropDraft = { ...this.cropDraft }

      this.isApplyingCrop = true

      try {
        this.operations = upsertCropOperation(this.operations, cropDraft)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, this.operations)

        if (seq !== cropSeq) {
          return
        }

        this.applyCropPreviewState(cropState)
        this.isCropEditing = false

        await nextTick()
      }
      catch (error) {
        if (seq === cropSeq) {
          console.error(error)
          this.error = 'Failed to apply crop'
        }
      }
      finally {
        if (seq === cropSeq) {
          this.isApplyingCrop = false
        }
      }
    },

    async undoLastCrop() {
      if (!this.canUndoLastCrop || !this.originalBlob) {
        return
      }

      const seq = ++cropSeq
      this.isApplyingCrop = true

      try {
        this.operations = removeCropOperation(this.operations)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, this.operations)

        if (seq !== cropSeq) {
          return
        }

        this.applyCropPreviewState(cropState)
        this.isCropEditing = false
      }
      catch (error) {
        if (seq === cropSeq) {
          console.error(error)
          this.error = 'Failed to undo crop'
        }
      }
      finally {
        if (seq === cropSeq) {
          this.isApplyingCrop = false
        }
      }
    },

    clearCropHistory() {
      for (const entry of this.cropApplyHistory) {
        URL.revokeObjectURL(entry.croppedPreviewUrl)
      }

      this.cropApplyHistory = []
    },

    clearCrop() {
      if (this.croppedPreviewUrl) {
        URL.revokeObjectURL(this.croppedPreviewUrl)
      }

      this.clearCropHistory()
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

      const seq = ++exportSeq
      this.clearError()
      this.isExportingImage = true

      try {
        const blob = await exportImageBlob(this.originalBlob, this.operations)

        if (seq !== exportSeq) {
          return
        }

        const filename = getExportImageFilename(this.originalMeta.name)
        downloadBlob(blob, filename)
      }
      catch (error) {
        if (seq === exportSeq) {
          console.error(error)
          this.error = 'Failed to export image'
        }
      }
      finally {
        if (seq === exportSeq) {
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

      const seq = ++importSeq
      this.clearError()
      this.isImportingDocument = true

      try {
        const text = await file.text()
        const document = validateEditDocument(parseEditDocument(text))
        assertDocumentMatchesSource(this.originalMeta, document)

        const cropState = await syncCropPreviewFromOperations(this.originalBlob, document.operations)

        if (seq !== importSeq) {
          return
        }

        this.operations = document.operations
        this.applyCropPreviewState(cropState)
        this.isCropEditing = false
        this.isViewingOriginal = false
      }
      catch (error) {
        if (seq !== importSeq) {
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
        if (seq === importSeq) {
          this.isImportingDocument = false
        }
      }
    },

    reset() {
      loadSeq += 1
      cropSeq += 1
      exportSeq += 1
      importSeq += 1

      if (this.previewObjectUrl) {
        URL.revokeObjectURL(this.previewObjectUrl)
      }

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
