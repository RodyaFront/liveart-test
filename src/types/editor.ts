export type ImageMimeType = 'image/jpeg' | 'image/png' | 'image/webp'

export interface ImageSourceMeta {
  name: string
  mimeType: ImageMimeType
  size: number
  width: number
  height: number
}

export interface CropRect {
  x: number
  y: number
  width: number
  height: number
}

export interface CropHistoryEntry {
  workingBlob: Blob
  croppedPreviewUrl: string
}

export interface Adjustments {
  brightness: number
  contrast: number
  saturation: number
}

export const DEFAULT_ADJUSTMENTS: Adjustments = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
}

export type FilterName = 'grayscale' | 'sepia'
export type FilterValue = FilterName | null

export const FILTER_OPTIONS: Array<{ title: string; value: FilterValue }> = [
  { title: 'None', value: null },
  { title: 'Grayscale', value: 'grayscale' },
  { title: 'Sepia', value: 'sepia' },
]

export type EditOperation =
  | { type: 'crop'; x: number; y: number; width: number; height: number }
  | { type: 'adjust'; brightness: number; contrast: number; saturation: number }
  | { type: 'filter'; name: FilterName }

export interface EditDocument {
  version: 1
  source: {
    name: string
    width: number
    height: number
  }
  operations: EditOperation[]
}
