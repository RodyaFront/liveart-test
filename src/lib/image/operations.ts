import { adjustmentsToCssFilter } from '@/lib/image/adjustments'
import { combineCssFilters, filterToCssFilter } from '@/lib/image/filters'
import {
  DEFAULT_ADJUSTMENTS,
  type Adjustments,
  type CropRect,
  type EditOperation,
  type FilterValue,
} from '@/types/editor'

export function findCropOperationIndex(operations: EditOperation[]): number {
  for (let index = operations.length - 1; index >= 0; index -= 1) {
    if (operations[index]?.type === 'crop') {
      return index
    }
  }

  return -1
}

export function findCropOperation(
  operations: EditOperation[],
): Extract<EditOperation, { type: 'crop' }> | null {
  const index = findCropOperationIndex(operations)
  const operation = index >= 0 ? operations[index] : null
  return operation?.type === 'crop' ? operation : null
}

export function findAdjustOperationIndex(operations: EditOperation[]): number {
  return operations.findIndex((operation) => operation.type === 'adjust')
}

export function findFilterOperationIndex(operations: EditOperation[]): number {
  return operations.findIndex((operation) => operation.type === 'filter')
}

export function getAdjustmentsFromOperations(operations: EditOperation[]): Adjustments {
  const adjustOperation = operations.find((operation) => operation.type === 'adjust')

  if (adjustOperation?.type === 'adjust') {
    return {
      brightness: adjustOperation.brightness,
      contrast: adjustOperation.contrast,
      saturation: adjustOperation.saturation,
    }
  }

  return { ...DEFAULT_ADJUSTMENTS }
}

export function getFilterFromOperations(operations: EditOperation[]): FilterValue {
  const filterOperation = operations.find((operation) => operation.type === 'filter')

  if (filterOperation?.type === 'filter') {
    return filterOperation.name
  }

  return null
}

export function buildPreviewCssFilter(operations: EditOperation[]): string | null {
  return combineCssFilters(
    adjustmentsToCssFilter(getAdjustmentsFromOperations(operations)),
    filterToCssFilter(getFilterFromOperations(operations)),
  )
}

export function cropOperationToRect(
  operation: Extract<EditOperation, { type: 'crop' }>,
): CropRect {
  return {
    x: operation.x,
    y: operation.y,
    width: operation.width,
    height: operation.height,
  }
}

export function upsertCropOperation(
  operations: EditOperation[],
  crop: CropRect,
): EditOperation[] {
  const cropOperation: EditOperation = {
    type: 'crop',
    x: crop.x,
    y: crop.y,
    width: crop.width,
    height: crop.height,
  }
  const cropIndex = findCropOperationIndex(operations)

  if (cropIndex >= 0) {
    return operations.map((operation, index) => (
      index === cropIndex ? cropOperation : operation
    ))
  }

  return [...operations, cropOperation]
}

export function removeCropOperation(operations: EditOperation[]): EditOperation[] {
  return operations.filter((operation) => operation.type !== 'crop')
}
