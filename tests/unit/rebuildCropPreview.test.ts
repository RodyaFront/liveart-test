import { describe, expect, it, vi } from 'vitest'
import { syncCropPreviewFromOperations } from '@/lib/image/rebuildCropPreview'

vi.mock('@/lib/image/cropImageBlob', () => ({
  cropImageBlob: vi.fn(async (_blob: Blob, rect: { width: number; height: number }) => (
    new Blob([`cropped:${rect.width}x${rect.height}`], { type: 'image/png' })
  )),
}))

vi.mock('@/lib/image/preloadObjectUrl', () => ({
  preloadObjectUrl: vi.fn(async () => undefined),
}))

describe('syncCropPreviewFromOperations', () => {
  it('returns original preview state when no crop operation exists', async () => {
    const originalBlob = new Blob(['original'], { type: 'image/png' })

    const state = await syncCropPreviewFromOperations(originalBlob, [
      { type: 'adjust', brightness: 0, contrast: 0, saturation: 0 },
    ])

    expect(state.croppedPreviewUrl).toBeNull()
    expect(state.appliedCrop).toBeNull()
    expect(state.cropDraft).toBeNull()
  })

  it('rebuilds cropped preview from a crop operation', async () => {
    const originalBlob = new Blob(['original'], { type: 'image/png' })
    const crop = { type: 'crop' as const, x: 1, y: 2, width: 10, height: 8 }

    const state = await syncCropPreviewFromOperations(originalBlob, [crop])

    expect(state.appliedCrop).toEqual({ x: 1, y: 2, width: 10, height: 8 })
    expect(state.cropDraft).toEqual({ x: 1, y: 2, width: 10, height: 8 })
    expect(state.croppedPreviewUrl).toMatch(/^blob:/)
  })
})
