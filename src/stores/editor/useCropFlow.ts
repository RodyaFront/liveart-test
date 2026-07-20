import { computed, nextTick } from 'vue'
import {
  cancelCropSession,
  createCropSessionStart,
  hasPendingCrop as computeHasPendingCrop,
} from '@/lib/editor/cropSession'
import {
  findCropOperation,
  removeCropOperation,
  upsertCropOperation,
} from '@/lib/image/operations'
import {
  applyCropPreviewState as mergeCropPreviewState,
  revokeObjectUrl,
} from '@/lib/image/previewCache'
import { type CropPreviewState, syncCropPreviewFromOperations } from '@/lib/image/rebuildCropPreview'
import type { CropRect } from '@/types/editor'
import type { AsyncGuard } from '@/lib/async/createAsyncGuard'
import type { EditorCore } from './state'

export function useCropFlow(core: EditorCore, cropGuard: AsyncGuard) {
  const {
    originalBlob,
    operations,
    croppedPreviewUrl,
    isCropEditing,
    cropDraft,
    appliedCrop,
    isApplyingCrop,
    isViewingOriginal,
    error,
  } = core

  const hasPendingCrop = computed(() => computeHasPendingCrop(
    cropDraft.value,
    appliedCrop.value,
    isCropEditing.value,
  ))

  const isCropApplied = computed(() => (
    !isCropEditing.value && findCropOperation(operations.value) !== null
  ))

  const canUndoLastCrop = computed(() => findCropOperation(operations.value) !== null)

  const canApplyCrop = computed(() => (
    isCropEditing.value
    && cropDraft.value !== null
    && originalBlob.value !== null
    && !isApplyingCrop.value
  ))

  function applyCropPreviewState(cropState: CropPreviewState) {
    const next = mergeCropPreviewState(croppedPreviewUrl.value, cropState)
    croppedPreviewUrl.value = next.croppedPreviewUrl
    appliedCrop.value = next.appliedCrop
    cropDraft.value = next.cropDraft
  }

  function setCropDraft(rect: CropRect) {
    cropDraft.value = rect
  }

  function startCropEditing() {
    if (!originalBlob.value) {
      return
    }

    const session = createCropSessionStart(operations.value)

    isCropEditing.value = true
    isViewingOriginal.value = false
    appliedCrop.value = session.appliedCrop
    cropDraft.value = session.cropDraft
  }

  function cancelCropEditing() {
    if (!isCropEditing.value || isApplyingCrop.value) {
      return
    }

    const session = cancelCropSession(appliedCrop.value)
    isCropEditing.value = false
    cropDraft.value = session.cropDraft
  }

  async function applyCrop() {
    if (!cropDraft.value || !originalBlob.value) {
      return
    }

    const seq = cropGuard.next()
    const draft = { ...cropDraft.value }

    isApplyingCrop.value = true

    try {
      operations.value = upsertCropOperation(operations.value, draft)

      const cropState = await syncCropPreviewFromOperations(originalBlob.value, operations.value)

      if (!cropGuard.isCurrent(seq)) {
        return
      }

      applyCropPreviewState(cropState)
      isCropEditing.value = false

      await nextTick()
    }
    catch (caught) {
      if (cropGuard.isCurrent(seq)) {
        console.error(caught)
        error.value = 'Failed to apply crop'
      }
    }
    finally {
      if (cropGuard.isCurrent(seq)) {
        isApplyingCrop.value = false
      }
    }
  }

  async function undoLastCrop() {
    if (!canUndoLastCrop.value || !originalBlob.value) {
      return
    }

    const seq = cropGuard.next()
    isApplyingCrop.value = true

    try {
      operations.value = removeCropOperation(operations.value)

      const cropState = await syncCropPreviewFromOperations(originalBlob.value, operations.value)

      if (!cropGuard.isCurrent(seq)) {
        return
      }

      applyCropPreviewState(cropState)
      isCropEditing.value = false
    }
    catch (caught) {
      if (cropGuard.isCurrent(seq)) {
        console.error(caught)
        error.value = 'Failed to undo crop'
      }
    }
    finally {
      if (cropGuard.isCurrent(seq)) {
        isApplyingCrop.value = false
      }
    }
  }

  function clearCrop() {
    revokeObjectUrl(croppedPreviewUrl.value)

    croppedPreviewUrl.value = null
    isCropEditing.value = false
    cropDraft.value = null
    appliedCrop.value = null
    operations.value = removeCropOperation(operations.value)
  }

  return {
    hasPendingCrop,
    isCropApplied,
    canUndoLastCrop,
    canApplyCrop,
    applyCropPreviewState,
    setCropDraft,
    startCropEditing,
    cancelCropEditing,
    applyCrop,
    undoLastCrop,
    clearCrop,
  }
}

export type CropFlow = ReturnType<typeof useCropFlow>
