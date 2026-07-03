import { describe, expect, it } from 'vitest'
import {
  EditDocumentValidationError,
  validateEditDocument,
} from '@/lib/image/documentValidation'

function buildDocument(operations: unknown[]) {
  return {
    version: 1,
    source: { name: 'test.png', width: 200, height: 100 },
    operations,
  }
}

describe('validateEditDocument', () => {
  it('accepts a valid document', () => {
    const document = validateEditDocument(buildDocument([
      { type: 'crop', x: 10, y: 10, width: 50, height: 40 },
      { type: 'adjust', brightness: 0, contrast: 10, saturation: -5 },
    ]))

    expect(document.operations).toHaveLength(2)
  })

  it('rejects unsupported versions', () => {
    expect(() => validateEditDocument({ ...buildDocument([]), version: 2 }))
      .toThrow(EditDocumentValidationError)
  })

  it('rejects duplicate crop operations', () => {
    expect(() => validateEditDocument(buildDocument([
      { type: 'crop', x: 0, y: 0, width: 10, height: 10 },
      { type: 'crop', x: 1, y: 1, width: 10, height: 10 },
    ]))).toThrow('Duplicate operation types are not supported')
  })

  it('rejects crop operations outside source bounds', () => {
    expect(() => validateEditDocument(buildDocument([
      { type: 'crop', x: 150, y: 0, width: 60, height: 40 },
    ]))).toThrow('Crop operation is outside source image bounds')
  })

  it('clamps adjust values into supported range', () => {
    const document = validateEditDocument(buildDocument([
      { type: 'adjust', brightness: 500, contrast: -500, saturation: 0 },
    ]))

    const adjust = document.operations[0]
    expect(adjust).toEqual({
      type: 'adjust',
      brightness: 100,
      contrast: -100,
      saturation: 0,
    })
  })
})
