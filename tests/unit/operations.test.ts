import { describe, expect, it } from 'vitest'
import {
  findCropOperation,
  removeCropOperation,
  upsertCropOperation,
} from '@/lib/image/operations'
import type { EditOperation } from '@/types/editor'

describe('operations', () => {
  const crop = { x: 10, y: 20, width: 100, height: 80 }

  it('upsertCropOperation inserts a crop when none exists', () => {
    const operations: EditOperation[] = [
      { type: 'adjust', brightness: 0, contrast: 0, saturation: 0 },
    ]

    const next = upsertCropOperation(operations, crop)

    expect(next).toHaveLength(2)
    expect(findCropOperation(next)).toEqual({ type: 'crop', ...crop })
  })

  it('upsertCropOperation replaces an existing crop', () => {
    const operations: EditOperation[] = [
      { type: 'crop', x: 0, y: 0, width: 50, height: 50 },
      { type: 'filter', name: 'grayscale' },
    ]

    const next = upsertCropOperation(operations, crop)

    expect(next.filter((operation) => operation.type === 'crop')).toHaveLength(1)
    expect(findCropOperation(next)).toEqual({ type: 'crop', ...crop })
    expect(next[1]).toEqual({ type: 'filter', name: 'grayscale' })
  })

  it('removeCropOperation removes all crop operations', () => {
    const operations: EditOperation[] = [
      { type: 'crop', x: 1, y: 2, width: 3, height: 4 },
      { type: 'adjust', brightness: 1, contrast: 0, saturation: 0 },
    ]

    const next = removeCropOperation(operations)

    expect(next).toEqual([
      { type: 'adjust', brightness: 1, contrast: 0, saturation: 0 },
    ])
  })
})
