import { cropImageBlob } from '@/lib/image/cropImageBlob'
import {
  findCropOperation,
  getAdjustmentsFromOperations,
  getFilterFromOperations,
} from '@/lib/image/operations'
import { adjustmentsToCssFilter } from '@/lib/image/adjustments'
import { combineCssFilters, filterToCssFilter } from '@/lib/image/filters'
import type { EditOperation } from '@/types/editor'

// Preview uses CSS filters; export uses Canvas ctx.filter — same filter strings, minor rendering differences possible.

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    image.src = url
  })
}

async function applyCanvasFilter(blob: Blob, cssFilter: string): Promise<Blob> {
  const image = await loadImageFromBlob(blob)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas not supported')
  }

  context.filter = cssFilter
  context.drawImage(image, 0, 0)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        }
        else {
          reject(new Error('Export failed'))
        }
      },
      blob.type || 'image/png',
    )
  })
}

export function getExportImageFilename(sourceName: string): string {
  const dotIndex = sourceName.lastIndexOf('.')
  if (dotIndex <= 0) {
    return `${sourceName}-edited.png`
  }

  const basename = sourceName.slice(0, dotIndex)
  const extension = sourceName.slice(dotIndex)
  return `${basename}-edited${extension}`
}

export async function exportImageBlob(
  originalBlob: Blob,
  operations: EditOperation[],
): Promise<Blob> {
  const cropOperation = findCropOperation(operations)
  let currentBlob = originalBlob

  if (cropOperation) {
    currentBlob = await cropImageBlob(originalBlob, {
      x: cropOperation.x,
      y: cropOperation.y,
      width: cropOperation.width,
      height: cropOperation.height,
    })
  }

  const adjustments = getAdjustmentsFromOperations(operations)
  const filterValue = getFilterFromOperations(operations)
  const cssFilter = combineCssFilters(
    adjustmentsToCssFilter(adjustments),
    filterToCssFilter(filterValue),
  )

  if (!cssFilter) {
    return currentBlob
  }

  return applyCanvasFilter(currentBlob, cssFilter)
}
