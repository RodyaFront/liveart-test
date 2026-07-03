import { cropImageBlob } from '@/lib/image/cropImageBlob'
import { cropOperationToRect, findCropOperation } from '@/lib/image/operations'
import { preloadObjectUrl } from '@/lib/image/preloadObjectUrl'
import type { CropHistoryEntry, CropRect, EditOperation } from '@/types/editor'

export interface CropPreviewState {
  workingBlob: Blob
  croppedPreviewUrl: string | null
  cropApplyHistory: CropHistoryEntry[]
  appliedCrop: CropRect | null
  cropDraft: CropRect | null
}

export async function rebuildCropPreviewState(
  originalBlob: Blob,
  cropOperation: Extract<EditOperation, { type: 'crop' }> | null,
): Promise<CropPreviewState> {
  if (!cropOperation) {
    return {
      workingBlob: originalBlob,
      croppedPreviewUrl: null,
      cropApplyHistory: [],
      appliedCrop: null,
      cropDraft: null,
    }
  }

  const cropRect = cropOperationToRect(cropOperation)
  const croppedBlob = await cropImageBlob(originalBlob, cropRect)
  const croppedPreviewUrl = URL.createObjectURL(croppedBlob)

  await preloadObjectUrl(croppedPreviewUrl)

  return {
    workingBlob: croppedBlob,
    croppedPreviewUrl,
    cropApplyHistory: [{
      workingBlob: croppedBlob,
      croppedPreviewUrl,
    }],
    appliedCrop: cropRect,
    cropDraft: cropRect,
  }
}

export async function syncCropPreviewFromOperations(
  originalBlob: Blob,
  operations: EditOperation[],
): Promise<CropPreviewState> {
  return rebuildCropPreviewState(originalBlob, findCropOperation(operations))
}
