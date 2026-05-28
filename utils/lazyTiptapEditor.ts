import { defineAsyncComponent } from 'vue'

/** Tiptap + @tiptap/* — отдельный async-чанк, не в initial bundle. */
export const LazyTiptapEditor = defineAsyncComponent(
  () => import('~/components/TiptapEditor.vue'),
)
