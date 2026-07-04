import { cropImageBlob } from '@/lib/image/cropImageBlob'
import { cropOperationToRect, findCropOperation } from '@/lib/image/operations'
import { preloadObjectUrl } from '@/lib/image/preloadObjectUrl'
import type { CropRect, EditOperation } from '@/types/editor'

export interface CropPreviewState {
  croppedPreviewUrl: string | null
  appliedCrop: CropRect | null
  cropDraft: CropRect | null
}

export async function rebuildCropPreviewState(
  originalBlob: Blob,
  cropOperation: Extract<EditOperation, { type: 'crop' }> | null,
): Promise<CropPreviewState> {
  if (!cropOperation) {
    return {
      croppedPreviewUrl: null,
      appliedCrop: null,
      cropDraft: null,
    }
  }

  const cropRect = cropOperationToRect(cropOperation)
  const croppedBlob = await cropImageBlob(originalBlob, cropRect)
  const croppedPreviewUrl = URL.createObjectURL(croppedBlob)

  await preloadObjectUrl(croppedPreviewUrl)

  return {
    croppedPreviewUrl,
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
