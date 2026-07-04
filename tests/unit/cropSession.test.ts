import { describe, expect, it } from 'vitest'
import { createCropSessionStart, hasPendingCrop } from '@/lib/editor/cropSession'

describe('cropSession', () => {
  it('starts a crop session from an existing crop operation', () => {
    const session = createCropSessionStart([
      { type: 'crop', x: 1, y: 2, width: 10, height: 8 },
    ])

    expect(session.appliedCrop).toEqual({ x: 1, y: 2, width: 10, height: 8 })
    expect(session.cropDraft).toEqual({ x: 1, y: 2, width: 10, height: 8 })
  })

  it('starts a crop session without an existing crop operation', () => {
    const session = createCropSessionStart([])

    expect(session.appliedCrop).toBeNull()
    expect(session.cropDraft).toBeNull()
  })

  it('detects pending crop changes during editing', () => {
    expect(hasPendingCrop(
      { x: 0, y: 0, width: 10, height: 10 },
      null,
      true,
    )).toBe(true)

    expect(hasPendingCrop(
      { x: 0, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
      true,
    )).toBe(false)

    expect(hasPendingCrop(
      { x: 1, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
      true,
    )).toBe(true)

    expect(hasPendingCrop(
      { x: 1, y: 0, width: 10, height: 10 },
      { x: 0, y: 0, width: 10, height: 10 },
      false,
    )).toBe(false)
  })
})
