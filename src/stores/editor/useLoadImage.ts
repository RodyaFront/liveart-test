import { revokeObjectUrl } from '@/lib/image/previewCache'
import { readImageMeta } from '@/lib/image/readImageMeta'
import { READ_IMAGE_ERROR, validateImageFile } from '@/lib/image/validateImageFile'
import type { AsyncGuard } from '@/lib/async/createAsyncGuard'
import type { EditorCore } from './state'
import type { CropFlow } from './useCropFlow'
import type { PreviewGetters } from './usePreviewGetters'

export function useLoadImage(
  core: EditorCore,
  crop: Pick<CropFlow, 'clearCrop'>,
  preview: Pick<PreviewGetters, 'clearError'>,
  loadGuard: AsyncGuard,
) {
  const {
    originalBlob,
    originalMeta,
    previewObjectUrl,
    operations,
    error,
    isLoading,
    isCropEditing,
    isViewingOriginal,
  } = core

  async function loadImage(file: File) {
    const seq = loadGuard.next()
    preview.clearError()
    isLoading.value = true

    try {
      const validation = validateImageFile(file)
      if (!validation.ok) {
        if (loadGuard.isCurrent(seq)) {
          error.value = validation.message
        }
        return
      }

      const meta = await readImageMeta(file)

      if (!loadGuard.isCurrent(seq)) {
        return
      }

      revokeObjectUrl(previewObjectUrl.value)

      crop.clearCrop()
      operations.value = []
      isViewingOriginal.value = false
      originalBlob.value = file
      originalMeta.value = meta
      previewObjectUrl.value = URL.createObjectURL(file)
      isCropEditing.value = false
    }
    catch {
      if (loadGuard.isCurrent(seq)) {
        error.value = READ_IMAGE_ERROR
      }
    }
    finally {
      if (loadGuard.isCurrent(seq)) {
        isLoading.value = false
      }
    }
  }

  return {
    loadImage,
  }
}
