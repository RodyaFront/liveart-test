import type { CropRect } from '@/types/editor'

export function cropImageBlob(blob: Blob, rect: CropRect): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()

    image.onload = () => {
      const canvas = document.createElement('canvas')
      const width = Math.round(rect.width)
      const height = Math.round(rect.height)
      canvas.width = width
      canvas.height = height

      const context = canvas.getContext('2d')
      if (!context) {
        URL.revokeObjectURL(url)
        reject(new Error('Canvas not supported'))
        return
      }

      context.drawImage(
        image,
        rect.x,
        rect.y,
        rect.width,
        rect.height,
        0,
        0,
        width,
        height,
      )

      URL.revokeObjectURL(url)

      canvas.toBlob(
        (result) => {
          if (result) {
            resolve(result)
          }
          else {
            reject(new Error('Crop failed'))
          }
        },
        blob.type || 'image/png',
      )
    }

    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    image.src = url
  })
}
