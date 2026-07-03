import { downloadTextFile } from '@/lib/image/downloadFile'
import type { EditDocument, EditOperation, ImageSourceMeta } from '@/types/editor'

export {
  assertDocumentMatchesSource,
  EditDocumentParseError,
  EditDocumentSourceMismatchError,
  EditDocumentValidationError,
  parseEditDocument,
  validateEditDocument,
} from '@/lib/image/documentValidation'

export { findCropOperation } from '@/lib/image/operations'

export function buildEditDocument(
  meta: ImageSourceMeta,
  operations: EditOperation[],
): EditDocument {
  return {
    version: 1,
    source: {
      name: meta.name,
      width: meta.width,
      height: meta.height,
    },
    operations: JSON.parse(JSON.stringify(operations)) as EditOperation[],
  }
}

export function serializeEditDocument(document: EditDocument): string {
  return JSON.stringify(document, null, 2)
}

function getJsonExportFilename(sourceName: string): string {
  const dotIndex = sourceName.lastIndexOf('.')
  if (dotIndex <= 0) {
    return `${sourceName}.json`
  }

  return `${sourceName.slice(0, dotIndex)}.json`
}

export function downloadEditDocument(document: EditDocument): void {
  const content = serializeEditDocument(document)
  const filename = getJsonExportFilename(document.source.name)
  downloadTextFile(content, filename)
}
