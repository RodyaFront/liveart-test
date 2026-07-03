import { useTemplateRef } from 'vue'
import { useEditorStore } from '@/stores/editor'

export function useJsonImport() {
  const store = useEditorStore()
  const jsonInputRef = useTemplateRef<HTMLInputElement>('jsonInput')

  function openJsonDialog() {
    jsonInputRef.value?.click()
  }

  async function onJsonInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (file) {
      await store.importEditDocument(file)
    }

    input.value = ''
  }

  return {
    store,
    jsonInputRef,
    openJsonDialog,
    onJsonInputChange,
  }
}
