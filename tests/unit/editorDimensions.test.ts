import { describe, expect, it } from 'vitest'
import {
  buildImageDimensionsLabel,
  buildImageDimensionsTooltip,
  resolveDisplayedDimensions,
} from '@/lib/editor/editorDimensions'

const originalMeta = {
  name: 'photo.jpg',
  mimeType: 'image/jpeg' as const,
  size: 1000,
  width: 200,
  height: 100,
}

describe('editorDimensions', () => {
  it('returns null when no image is loaded', () => {
    expect(resolveDisplayedDimensions({
      originalBlob: null,
      originalMeta: null,
      cropDraft: null,
      operations: [],
    })).toBeNull()
  })

  it('prefers crop draft dimensions during editing', () => {
    expect(resolveDisplayedDimensions({
      originalBlob: new Blob(['x']),
      originalMeta,
      cropDraft: { x: 0, y: 0, width: 80, height: 60 },
      operations: [{ type: 'crop', x: 10, y: 10, width: 50, height: 40 }],
    })).toEqual({ width: 80, height: 60 })
  })

  it('uses committed crop dimensions when no draft exists', () => {
    expect(resolveDisplayedDimensions({
      originalBlob: new Blob(['x']),
      originalMeta,
      cropDraft: null,
      operations: [{ type: 'crop', x: 10, y: 10, width: 50, height: 40 }],
    })).toEqual({ width: 50, height: 40 })
  })

  it('builds label and tooltip text', () => {
    const input = {
      originalBlob: new Blob(['x']),
      originalMeta,
      cropDraft: null,
      operations: [{ type: 'crop' as const, x: 10, y: 10, width: 50, height: 40 }],
    }

    expect(buildImageDimensionsLabel(input)).toBe('50 × 40 px')
    expect(buildImageDimensionsTooltip(input)).toBe(
      'Cropped output: 50 × 40 px. Original: 200 × 100 px.',
    )
  })
})
