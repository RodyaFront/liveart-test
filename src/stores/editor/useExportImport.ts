import {
  assertDocumentMatchesSource,
  downloadEditDocument,
  EditDocumentParseError,
  EditDocumentSourceMismatchError,
  EditDocumentValidationError,
  parseEditDocument,
  validateEditDocument,
} from '@/lib/image/document'
import { downloadBlob } from '@/lib/image/downloadFile'
import { exportImageBlob, getExportImageFilename } from '@/lib/image/exportImage'
import { syncCropPreviewFromOperations } from '@/lib/image/rebuildCropPreview'
import type { AsyncGuard } from '@/lib/async/createAsyncGuard'
import type { EditorCore } from './state'
import type { CropFlow } from './useCropFlow'
import type { PreviewGetters } from './usePreviewGetters'

export function useExportImport(
  core: EditorCore,
  crop: Pick<CropFlow, 'applyCropPreviewState'>,
  preview: Pick<PreviewGetters, 'canExport' | 'canImportDocument' | 'editDocument' | 'clearError'>,
  guards: { exportGuard: AsyncGuard; importGuard: AsyncGuard },
) {
  const {
    originalBlob,
    originalMeta,
    operations,
    error,
    isCropEditing,
    isExportingImage,
    isImportingDocument,
    isViewingOriginal,
  } = core

  const { exportGuard, importGuard } = guards

  async function exportImage() {
    if (!preview.canExport.value || !originalBlob.value || !originalMeta.value) {
      return
    }

    const seq = exportGuard.next()
    preview.clearError()
    isExportingImage.value = true

    try {
      const blob = await exportImageBlob(originalBlob.value, operations.value)

      if (!exportGuard.isCurrent(seq)) {
        return
      }

      const filename = getExportImageFilename(originalMeta.value.name)
      downloadBlob(blob, filename)
    }
    catch (caught) {
      if (exportGuard.isCurrent(seq)) {
        console.error(caught)
        error.value = 'Failed to export image'
      }
    }
    finally {
      if (exportGuard.isCurrent(seq)) {
        isExportingImage.value = false
      }
    }
  }

  function exportDocumentJson() {
    const document = preview.editDocument.value
    if (!document) {
      return
    }

    preview.clearError()
    downloadEditDocument(document)
  }

  async function importEditDocument(file: File) {
    if (!originalBlob.value || !originalMeta.value || !preview.canImportDocument.value) {
      return
    }

    const seq = importGuard.next()
    preview.clearError()
    isImportingDocument.value = true

    try {
      const text = await file.text()
      const document = validateEditDocument(parseEditDocument(text))
      assertDocumentMatchesSource(originalMeta.value, document)

      const cropState = await syncCropPreviewFromOperations(originalBlob.value, document.operations)

      if (!importGuard.isCurrent(seq)) {
        return
      }

      operations.value = document.operations
      crop.applyCropPreviewState(cropState)
      isCropEditing.value = false
      isViewingOriginal.value = false
    }
    catch (caught) {
      if (!importGuard.isCurrent(seq)) {
        return
      }

      if (
        caught instanceof EditDocumentParseError
        || caught instanceof EditDocumentValidationError
        || caught instanceof EditDocumentSourceMismatchError
      ) {
        error.value = caught.message
      }
      else {
        console.error(caught)
        error.value = 'Failed to import JSON'
      }
    }
    finally {
      if (importGuard.isCurrent(seq)) {
        isImportingDocument.value = false
      }
    }
  }

  return {
    exportImage,
    exportDocumentJson,
    importEditDocument,
  }
}
