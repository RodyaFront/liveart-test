import { exportImageBlob } from '@/lib/image/exportImage'
import type { EditDocument } from '@/types/editor'

export function replayDocument(originalBlob: Blob, document: EditDocument): Promise<Blob> {
  return exportImageBlob(originalBlob, document.operations)
}
