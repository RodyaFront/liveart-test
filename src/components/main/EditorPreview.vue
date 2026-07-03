<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCropper } from '@/composables/useCropper'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const {
  effectivePreviewUrl,
  cropperImageUrl,
  originalMeta,
  showCropper,
  isCropEditing,
  effectivePreviewCssFilter,
  appliedCrop,
  cropDraft,
} = storeToRefs(store)

const imageRef = ref<HTMLImageElement | null>(null)

const previewUrl = computed(() => (
  isCropEditing.value ? cropperImageUrl.value : effectivePreviewUrl.value
))

const filterStyle = computed(() => (
  effectivePreviewCssFilter.value ? { filter: effectivePreviewCssFilter.value } : undefined
))

const { init, destroy } = useCropper(imageRef, {
  getInitialCrop: () => appliedCrop.value ?? cropDraft.value,
  onCrop: (rect) => store.setCropDraft(rect),
})

function onImageLoad() {
  if (showCropper.value) {
    init()
  }
  else {
    destroy()
  }
}

watch(isCropEditing, async (editing) => {
  if (editing) {
    await nextTick()
    if (imageRef.value?.complete) {
      init()
    }
  }
  else {
    destroy()
  }
})

watch(previewUrl, (url, oldUrl) => {
  if (oldUrl && url !== oldUrl) {
    destroy()
  }
})
</script>

<template>
  <div class="editor-preview">
    <div
      class="editor-preview__stage"
      :style="filterStyle"
    >
      <img
        v-if="previewUrl"
        ref="imageRef"
        :src="previewUrl"
        :alt="originalMeta?.name ?? 'Uploaded image'"
        class="editor-preview__image"
        @load="onImageLoad"
      >
    </div>
  </div>
</template>

<style scoped lang="scss">
.editor-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: #000;
}

.editor-preview__stage {
  position: relative;
  width: fit-content;
  max-width: 100%;
  max-height: 100%;
  line-height: 0;
}

.editor-preview__image {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.editor-preview__stage :deep(.cropper-container) {
  max-width: 100%;
  max-height: 100%;
}
</style>
