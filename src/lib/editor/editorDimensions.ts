import { findCropOperation } from '@/lib/image/operations'
import type { CropRect, EditOperation, ImageSourceMeta } from '@/types/editor'

export interface DisplayDimensionsInput {
  originalBlob: Blob | null
  originalMeta: ImageSourceMeta | null
  cropDraft: CropRect | null
  operations: EditOperation[]
}

export function formatImageDimensions(width: number, height: number): string {
  return `${Math.round(width)} × ${Math.round(height)} px`
}

export function resolveDisplayedDimensions(
  input: DisplayDimensionsInput,
): { width: number; height: number } | null {
  if (!input.originalBlob) {
    return null
  }

  if (input.cropDraft) {
    return {
      width: input.cropDraft.width,
      height: input.cropDraft.height,
    }
  }

  const cropOperation = findCropOperation(input.operations)
  if (cropOperation) {
    return {
      width: cropOperation.width,
      height: cropOperation.height,
    }
  }

  if (input.originalMeta) {
    return {
      width: input.originalMeta.width,
      height: input.originalMeta.height,
    }
  }

  return null
}

export function buildImageDimensionsLabel(input: DisplayDimensionsInput): string | null {
  const dimensions = resolveDisplayedDimensions(input)
  if (!dimensions) {
    return null
  }

  return formatImageDimensions(dimensions.width, dimensions.height)
}

export function buildImageDimensionsTooltip(input: DisplayDimensionsInput): string | null {
  if (!input.originalMeta) {
    return null
  }

  const displayed = resolveDisplayedDimensions(input)
  if (!displayed) {
    return null
  }

  const original = formatImageDimensions(input.originalMeta.width, input.originalMeta.height)
  const current = formatImageDimensions(displayed.width, displayed.height)
  const hasCropOutput = displayed.width !== input.originalMeta.width
    || displayed.height !== input.originalMeta.height

  if (hasCropOutput) {
    return `Cropped output: ${current}. Original: ${original}.`
  }

  return `Original image dimensions: ${original}`
}
