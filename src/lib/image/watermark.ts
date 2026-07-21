export const DEFAULT_WATERMARK_TEXT = 'LiveArt'

export interface WatermarkOptions {
  text?: string
  /** 0–1, default 0.55 */
  opacity?: number
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, mimeType: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result)
        }
        else {
          reject(new Error('Watermark export failed'))
        }
      },
      mimeType,
    )
  })
}

/**
 * Burns a text watermark into the image (export-only; not an edit operation).
 * Centered, semi-transparent white fill with a light shadow.
 */
export async function applyWatermark(
  blob: Blob,
  options: WatermarkOptions = {},
): Promise<Blob> {
  const text = options.text ?? DEFAULT_WATERMARK_TEXT
  const opacity = options.opacity ?? 0.55

  const image = await loadImageFromBlob(blob)
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Canvas not supported')
  }

  context.drawImage(image, 0, 0)

  const shorterSide = Math.min(canvas.width, canvas.height)
  const fontSize = Math.max(24, Math.round(shorterSide * 0.12))

  context.font = `600 ${fontSize}px system-ui, sans-serif`
  context.textAlign = 'center'
  context.textBaseline = 'middle'

  const x = canvas.width / 2
  const y = canvas.height / 2

  context.save()
  context.globalAlpha = opacity
  context.shadowColor = 'rgba(0, 0, 0, 0.45)'
  context.shadowBlur = Math.max(4, Math.round(fontSize * 0.18))
  context.shadowOffsetX = Math.max(1, Math.round(fontSize * 0.04))
  context.shadowOffsetY = Math.max(1, Math.round(fontSize * 0.04))
  context.fillStyle = '#ffffff'
  context.fillText(text, x, y)
  context.restore()

  return canvasToBlob(canvas, blob.type || 'image/png')
}
