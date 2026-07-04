import type { CropPreviewState } from '@/lib/image/rebuildCropPreview'

export function revokeObjectUrl(url: string | null): void {
  if (url) {
    URL.revokeObjectURL(url)
  }
}

export function replaceCropPreviewUrl(
  currentUrl: string | null,
  nextUrl: string | null,
): string | null {
  revokeObjectUrl(currentUrl)
  return nextUrl
}

export function applyCropPreviewState(
  currentUrl: string | null,
  cropState: CropPreviewState,
): Pick<CropPreviewState, 'croppedPreviewUrl' | 'appliedCrop' | 'cropDraft'> {
  return {
    croppedPreviewUrl: replaceCropPreviewUrl(currentUrl, cropState.croppedPreviewUrl),
    appliedCrop: cropState.appliedCrop,
    cropDraft: cropState.cropDraft,
  }
}
