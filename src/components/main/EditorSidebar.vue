<template>
  <aside class="editor-sidebar">
    <section class="editor-sidebar__section">
      <EditorCropPanel />
    </section>

    <section class="editor-sidebar__section">
      <EditorAdjustmentsPanel />
    </section>

    <section class="editor-sidebar__section">
      <EditorFilterPanel />
    </section>

    <section class="editor-sidebar__section">
      <EditorActionsPanel />
    </section>
  </aside>
</template>

<script setup lang="ts">
import EditorActionsPanel from '@/components/main/EditorActionsPanel.vue'
import EditorAdjustmentsPanel from '@/components/main/EditorAdjustmentsPanel.vue'
import EditorCropPanel from '@/components/main/EditorCropPanel.vue'
import EditorFilterPanel from '@/components/main/EditorFilterPanel.vue'
</script>

<style scoped lang="scss">
.editor-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--editor-panel-gap);
  height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.editor-sidebar__section {
  padding: 1rem;
  background-color: var(--editor-panel-bg);
  border: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  border-radius: 0.75rem;
}
</style>
