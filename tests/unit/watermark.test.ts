import { beforeEach, describe, expect, it, vi } from 'vitest'
import { applyWatermark, DEFAULT_WATERMARK_TEXT } from '@/lib/image/watermark'

describe('applyWatermark', () => {
  const drawImage = vi.fn()
  const fillText = vi.fn()
  const save = vi.fn()
  const restore = vi.fn()
  let lastCanvas: {
    width: number
    height: number
    getContext: ReturnType<typeof vi.fn>
    toBlob: ReturnType<typeof vi.fn>
  }

  beforeEach(() => {
    vi.restoreAllMocks()
    drawImage.mockClear()
    fillText.mockClear()
    save.mockClear()
    restore.mockClear()

    lastCanvas = {
      width: 0,
      height: 0,
      getContext: vi.fn(() => ({
        drawImage,
        fillText,
        save,
        restore,
        font: '',
        textAlign: '',
        textBaseline: '',
        globalAlpha: 1,
        shadowColor: '',
        shadowBlur: 0,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        fillStyle: '',
      })),
      toBlob: vi.fn((callback: BlobCallback) => {
        callback(new Blob(['watermarked'], { type: 'image/png' }))
      }),
    }

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return lastCanvas as unknown as HTMLCanvasElement
      }
      return document.createElement(tagName)
    })

    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    vi.spyOn(globalThis, 'Image').mockImplementation(function ImageMock(this: HTMLImageElement) {
      Object.defineProperty(this, 'naturalWidth', { get: () => 200 })
      Object.defineProperty(this, 'naturalHeight', { get: () => 100 })
      Object.defineProperty(this, 'src', {
        set() {
          queueMicrotask(() => this.onload?.(new Event('load')))
        },
      })
      return this
    } as unknown as typeof Image)
  })

  it('draws centered default watermark text and returns a blob', async () => {
    const source = new Blob(['source'], { type: 'image/png' })
    const result = await applyWatermark(source)

    expect(result).toBeInstanceOf(Blob)
    expect(result.size).toBeGreaterThan(0)
    expect(lastCanvas.width).toBe(200)
    expect(lastCanvas.height).toBe(100)
    expect(drawImage).toHaveBeenCalled()
    expect(fillText).toHaveBeenCalledWith(DEFAULT_WATERMARK_TEXT, 100, 50)
  })

  it('uses a custom watermark text when provided', async () => {
    const source = new Blob(['source'], { type: 'image/png' })
    await applyWatermark(source, { text: 'Custom Mark' })

    expect(fillText).toHaveBeenCalledWith('Custom Mark', 100, 50)
  })
})
