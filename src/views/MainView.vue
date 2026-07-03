<script setup lang="ts">
import { onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import MainEditor from '@/components/main/MainEditor.vue'
import UploadPromptCard from '@/components/main/UploadPromptCard.vue'
import { useEditorStore } from '@/stores/editor'

const store = useEditorStore()
const { hasImage } = storeToRefs(store)

onUnmounted(() => {
  store.reset()
})
</script>

<template>
  <v-main class="main-view">
    <MainEditor v-if="hasImage" />
    <UploadPromptCard v-else />
  </v-main>
</template>

<style scoped>
.main-view {
  min-height: 100vh;
  padding: 0;
}
</style>
