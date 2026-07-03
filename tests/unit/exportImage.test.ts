import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cropImageBlob } from '@/lib/image/cropImageBlob'
import { exportImageBlob } from '@/lib/image/exportImage'
import { replayDocument } from '@/lib/image/replayDocument'
import type { EditDocument } from '@/types/editor'

vi.mock('@/lib/image/cropImageBlob', () => ({
  cropImageBlob: vi.fn(async (_blob: Blob, rect: { width: number; height: number }) => (
    new Blob([`cropped:${rect.width}x${rect.height}`], { type: 'image/png' })
  )),
}))

const fixturePath = join(process.cwd(), 'tests/fixtures/32x32.png')

async function loadFixtureBlob(): Promise<Blob> {
  const buffer = await readFile(fixturePath)
  return new Blob([buffer], { type: 'image/png' })
}

describe('exportImage', () => {
  beforeEach(() => {
    vi.mocked(cropImageBlob).mockClear()
  })

  it('crops from the original blob and returns a non-empty result', async () => {
    const originalBlob = await loadFixtureBlob()
    const operations = [
      { type: 'crop' as const, x: 4, y: 8, width: 16, height: 12 },
    ]

    const exported = await exportImageBlob(originalBlob, operations)

    expect(exported.size).toBeGreaterThan(0)
    expect(cropImageBlob).toHaveBeenCalledWith(
      originalBlob,
      { x: 4, y: 8, width: 16, height: 12 },
    )
  })

  it('replayDocument uses the same export pipeline', async () => {
    const originalBlob = await loadFixtureBlob()
    const document: EditDocument = {
      version: 1,
      source: { name: '32x32.png', width: 32, height: 32 },
      operations: [
        { type: 'crop', x: 2, y: 2, width: 20, height: 18 },
      ],
    }

    const exported = await exportImageBlob(originalBlob, document.operations)
    const replayed = await replayDocument(originalBlob, document)

    expect(replayed.size).toBe(exported.size)
    expect(cropImageBlob).toHaveBeenCalledTimes(2)
  })
})
