import { computed } from 'vue'
import { isDefaultAdjustments, mergeAdjustments } from '@/lib/image/adjustments'
import {
  findAdjustOperationIndex,
  findFilterOperationIndex,
  getAdjustmentsFromOperations,
} from '@/lib/image/operations'
import type { Adjustments, EditOperation, FilterValue } from '@/types/editor'
import type { EditorCore } from './state'

export function useAdjustFilter(core: EditorCore) {
  const { operations } = core

  const adjustValues = computed(() => getAdjustmentsFromOperations(operations.value))

  const hasAdjustments = computed(() => (
    !isDefaultAdjustments(getAdjustmentsFromOperations(operations.value))
  ))

  const filterValue = computed(() => {
    const filterOperation = operations.value.find((operation) => operation.type === 'filter')
    return filterOperation?.type === 'filter' ? filterOperation.name : null
  })

  const hasFilter = computed(() => operations.value.some((operation) => operation.type === 'filter'))

  function setAdjust(partial: Partial<Adjustments>) {
    const nextValues = mergeAdjustments(adjustValues.value, partial)
    const adjustIndex = findAdjustOperationIndex(operations.value)

    if (isDefaultAdjustments(nextValues)) {
      if (adjustIndex >= 0) {
        operations.value.splice(adjustIndex, 1)
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
      operations.value.splice(adjustIndex, 1, adjustOperation)
    }
    else {
      operations.value.push(adjustOperation)
    }
  }

  function resetAdjustments() {
    const adjustIndex = findAdjustOperationIndex(operations.value)
    if (adjustIndex >= 0) {
      operations.value.splice(adjustIndex, 1)
    }
  }

  function setFilter(value: FilterValue) {
    const filterIndex = findFilterOperationIndex(operations.value)

    if (value === null) {
      if (filterIndex >= 0) {
        operations.value.splice(filterIndex, 1)
      }
      return
    }

    const filterOperation: EditOperation = {
      type: 'filter',
      name: value,
    }

    if (filterIndex >= 0) {
      operations.value.splice(filterIndex, 1, filterOperation)
    }
    else {
      operations.value.push(filterOperation)
    }
  }

  return {
    adjustValues,
    hasAdjustments,
    filterValue,
    hasFilter,
    setAdjust,
    resetAdjustments,
    setFilter,
  }
}
