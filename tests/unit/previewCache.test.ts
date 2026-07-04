import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyCropPreviewState,
  replaceCropPreviewUrl,
  revokeObjectUrl,
} from '@/lib/image/previewCache'

describe('previewCache', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('revokes a non-null object URL', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    revokeObjectUrl('blob:preview')

    expect(revoke).toHaveBeenCalledWith('blob:preview')
  })

  it('replaces the current preview URL and revokes the old one', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const nextUrl = replaceCropPreviewUrl('blob:old', 'blob:new')

    expect(revoke).toHaveBeenCalledWith('blob:old')
    expect(nextUrl).toBe('blob:new')
  })

  it('applies crop preview state with URL replacement', () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)

    const next = applyCropPreviewState('blob:old', {
      croppedPreviewUrl: 'blob:new',
      appliedCrop: { x: 1, y: 2, width: 10, height: 8 },
      cropDraft: { x: 1, y: 2, width: 10, height: 8 },
    })

    expect(revoke).toHaveBeenCalledWith('blob:old')
    expect(next.croppedPreviewUrl).toBe('blob:new')
    expect(next.appliedCrop).toEqual({ x: 1, y: 2, width: 10, height: 8 })
  })
})
