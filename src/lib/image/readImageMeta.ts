import type { ImageMimeType, ImageSourceMeta } from '@/types/editor'

export async function readImageDimensions(file: File): Promise<{ width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
      const dimensions = {
        width: bitmap.width,
        height: bitmap.height,
      }
      bitmap.close()
      return dimensions
    }
    catch {
      // Fall back to Image() when createImageBitmap fails
    }
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    return await new Promise((resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
        })
      }

      image.onerror = () => {
        reject(new Error('Could not read image'))
      }

      image.src = objectUrl
    })
  }
  finally {
    URL.revokeObjectURL(objectUrl)
  }
}

export async function readImageMeta(file: File): Promise<ImageSourceMeta> {
  const dimensions = await readImageDimensions(file)

  return {
    name: file.name,
    mimeType: file.type as ImageMimeType,
    size: file.size,
    width: dimensions.width,
    height: dimensions.height,
  }
}
