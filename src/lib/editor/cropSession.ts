import { cropOperationToRect, findCropOperation } from '@/lib/image/operations'
import { cropRectsEqual } from '@/lib/image/cropRect'
import type { CropRect, EditOperation } from '@/types/editor'

export function createCropSessionStart(
  operations: EditOperation[],
): { appliedCrop: CropRect | null; cropDraft: CropRect | null } {
  const existingCrop = findCropOperation(operations)
  const cropRect = existingCrop ? cropOperationToRect(existingCrop) : null

  return {
    appliedCrop: cropRect,
    cropDraft: cropRect ? { ...cropRect } : null,
  }
}

export function hasPendingCrop(
  cropDraft: CropRect | null,
  appliedCrop: CropRect | null,
  isCropEditing: boolean,
): boolean {
  if (!cropDraft || !isCropEditing) {
    return false
  }

  if (!appliedCrop) {
    return true
  }

  return !cropRectsEqual(cropDraft, appliedCrop)
}

export function cancelCropSession(
  appliedCrop: CropRect | null,
): { cropDraft: CropRect | null } {
  return {
    cropDraft: appliedCrop ? { ...appliedCrop } : null,
  }
}
