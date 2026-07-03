import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useEditorStore } from '@/stores/editor'

export function useImageUpload() {
  const store = useEditorStore()
  const fileInputRef = useTemplateRef<HTMLInputElement>('fileInput')
  const dropZoneRef = useTemplateRef<HTMLElement>('dropZone')
  const isDragOver = ref(false)

  function clearDragOver() {
    isDragOver.value = false
  }

  function isStillInsideDropZone(relatedTarget: EventTarget | null) {
    const zone = dropZoneRef.value
    if (!zone) {
      return false
    }

    return relatedTarget instanceof Node && zone.contains(relatedTarget)
  }

  function openFileDialog() {
    fileInputRef.value?.click()
  }

  async function handleFile(file: File | undefined) {
    if (!file || store.isLoading) {
      return
    }

    await store.loadImage(file)
  }

  async function onFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    await handleFile(file)
    input.value = ''
  }

  function onDragEnter(event: DragEvent) {
    if (store.isLoading) {
      return
    }

    if (isStillInsideDropZone(event.relatedTarget)) {
      return
    }

    isDragOver.value = true
  }

  function onDragOver(event: DragEvent) {
    event.preventDefault()
  }

  function onDragLeave(event: DragEvent) {
    if (isStillInsideDropZone(event.relatedTarget)) {
      return
    }

    clearDragOver()
  }

  async function onDrop(event: DragEvent) {
    clearDragOver()

    const file = event.dataTransfer?.files[0]
    await handleFile(file)
  }

  onMounted(() => {
    window.addEventListener('dragend', clearDragOver)
  })

  onUnmounted(() => {
    window.removeEventListener('dragend', clearDragOver)
  })

  return {
    store,
    fileInputRef,
    dropZoneRef,
    isDragOver,
    openFileDialog,
    onFileInputChange,
    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop,
  }
}
