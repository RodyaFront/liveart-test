import { ref, type Ref } from 'vue'
import { createAsyncGuard, type AsyncGuard } from '@/lib/async/createAsyncGuard'
import type {
  CropRect,
  EditOperation,
  ImageSourceMeta,
} from '@/types/editor'

export type EditorCore = {
  originalBlob: Ref<Blob | null>
  originalMeta: Ref<ImageSourceMeta | null>
  previewObjectUrl: Ref<string | null>
  croppedPreviewUrl: Ref<string | null>
  isCropEditing: Ref<boolean>
  cropDraft: Ref<CropRect | null>
  appliedCrop: Ref<CropRect | null>
  operations: Ref<EditOperation[]>
  error: Ref<string | null>
  isLoading: Ref<boolean>
  isApplyingCrop: Ref<boolean>
  isViewingOriginal: Ref<boolean>
  isExportingImage: Ref<boolean>
  isImportingDocument: Ref<boolean>
}

export type EditorGuards = {
  loadGuard: AsyncGuard
  cropGuard: AsyncGuard
  exportGuard: AsyncGuard
  importGuard: AsyncGuard
}

export function createEditorGuards(): EditorGuards {
  return {
    loadGuard: createAsyncGuard(),
    cropGuard: createAsyncGuard(),
    exportGuard: createAsyncGuard(),
    importGuard: createAsyncGuard(),
  }
}

export function createEditorState(): EditorCore {
  return {
    originalBlob: ref<Blob | null>(null),
    originalMeta: ref<ImageSourceMeta | null>(null),
    previewObjectUrl: ref<string | null>(null),
    croppedPreviewUrl: ref<string | null>(null),
    isCropEditing: ref(false),
    cropDraft: ref<CropRect | null>(null),
    appliedCrop: ref<CropRect | null>(null),
    operations: ref<EditOperation[]>([]),
    error: ref<string | null>(null),
    isLoading: ref(false),
    isApplyingCrop: ref(false),
    isViewingOriginal: ref(false),
    isExportingImage: ref(false),
    isImportingDocument: ref(false),
  }
}
