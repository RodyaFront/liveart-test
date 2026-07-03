import type { ImageMimeType } from '@/types/editor'

export const ACCEPTED_MIME_TYPES: readonly ImageMimeType[] = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

export const ACCEPTED_FILE_ACCEPT = ACCEPTED_MIME_TYPES.join(',')

export const ACCEPTED_FORMATS_LABEL = 'JPG, PNG, WebP'

export const READ_IMAGE_ERROR = 'Could not read image'

export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024

export type ValidateImageFileResult =
  | { ok: true }
  | { ok: false; message: string }

export function validateImageFile(file: File): ValidateImageFileResult {
  if (file.size === 0) {
    return { ok: false, message: 'File is empty' }
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, message: 'File is too large (max 20 MB)' }
  }

  if (!ACCEPTED_MIME_TYPES.includes(file.type as ImageMimeType)) {
    return { ok: false, message: 'Please upload a JPG, PNG or WebP image' }
  }

  return { ok: true }
}
