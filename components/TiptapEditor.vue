<template>
  <div>
    <section
      v-if="editor"
      class="buttons flex flex-wrap items-center gap-x-2.5 rounded-t-fifteen border-l border-r border-t border-athens bg-athens-gray px-3.5 py-15px"
    >
      <button
        @click="editor.chain().focus().toggleBold().run()"
        :disabled="!editor.can().chain().focus().toggleBold().run()"
        :class="{
          'is-active border-dodger bg-dodger text-white':
            editor.isActive('bold'),
        }"
        class="flex-center h-10 w-10 rounded-ten border border-athens bg-white p-1 transition-all hover:border-border-editor hover:bg-zumthor hover:text-dodger active:border-dodger active:bg-dodger active:text-white"
      >
        <svg-icon name="bold" width="20" height="20" />
      </button>
      <button
        @click="editor.chain().focus().toggleItalic().run()"
        :class="{
          'is-active border-dodger bg-dodger text-white':
            editor.isActive('italic'),
        }"
        class="flex-center h-10 w-10 rounded-ten border border-athens bg-white p-1 transition-all hover:border-border-editor hover:bg-zumthor hover:text-dodger active:border-dodger active:bg-dodger active:text-white"
      >
        <svg-icon name="italic" width="20" height="20" />
      </button>
      <button
        @click="editor.chain().focus().toggleBulletList().run()"
        :class="{
          'is-active border-dodger bg-dodger text-white':
            editor.isActive('bulletList'),
        }"
        class="flex-center h-10 w-10 rounded-ten border border-athens bg-white p-1 transition-all hover:border-border-editor hover:bg-zumthor hover:text-dodger active:border-dodger active:bg-dodger active:text-white"
      >
        <svg-icon name="list" width="20" height="20" />
      </button>
      <button
        @click="editor.chain().focus().undo().run()"
        :disabled="!editor.can().chain().focus().undo().run()"
        class="flex-center h-10 w-10 rounded-ten border border-athens bg-white p-1 transition-all hover:border-border-editor hover:bg-zumthor hover:text-dodger active:border-dodger active:bg-dodger active:text-white disabled:text-gray-400 disabled:hover:border-athens disabled:hover:bg-white"
      >
        <svg-icon name="undo" width="20" height="20" />
      </button>
      <button
        @click="editor.chain().focus().redo().run()"
        :disabled="!editor.can().chain().focus().redo().run()"
        class="flex-center h-10 w-10 rounded-ten border border-athens bg-white p-1 transition-all hover:border-border-editor hover:bg-zumthor hover:text-dodger active:border-dodger active:bg-dodger active:text-white disabled:text-gray-400 disabled:hover:border-athens disabled:hover:bg-white"
      >
        <svg-icon name="redo" width="20" height="20" />
      </button>
    </section>
    <editor-content :editor="editor" class="list-unreset" />
  </div>
</template>

<script setup>
  import { Editor, EditorContent } from '@tiptap/vue-3';
  import StarterKit from '@tiptap/starter-kit';
  import Placeholder from '@tiptap/extension-placeholder';
  import Link from '@tiptap/extension-link';
  import { ref, watch } from 'vue';

  const defaultContent = `<p>Обязанности:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>
      <p>Требования:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>
      <p>Условия:</p>
      <ul>
        <li></li>
        <li></li>
      </ul>`;

  const props = defineProps({
    modelValue: {
      type: String,
      default: defaultContent,
    },
    newVacancy: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue', 'blur']);

  const editor = ref(null);

  watch(
    () => props.newVacancy,
    () => {
      if (editor.value) {
        editor.value.commands.setContent(
          props.modelValue || defaultContent.value
        );
      }
    }
  );

  watch(
    () => props.modelValue,
    newValue => {
      // Проверяем, отличается ли новое значение от текущего в редакторе, чтобы избежать цикла
      if (newValue !== editor.value?.getHTML()) {
        editor.value?.commands.setContent(newValue);
      }
    },
    { immediate: true } // Немедленно применяем при инициализации
  );

  onMounted(() => {
    editor.value = new Editor({
      editable: !props.disabled,
      editorProps: {
        attributes: {
          class:
            'border border-athens py-15px px-3.5 min-h-[460px] max-h-[460px] overflow-y-auto outline-none prose max-w-none rounded-b-fifteen bg-athens-gray',
        },
        handleDOMEvents: {
          blur: () => {
            emit('blur');
          },
        },
      },
      content: props.modelValue || defaultContent.value,
      extensions: [
        StarterKit,
        Link.configure({
          openOnClick: true,
          defaultProtocol: 'https',
        }),
        Placeholder.configure({
          placeholder: 'Начните вводить...',
        }),
      ],
      onUpdate: () => {
        emit('update:modelValue', editor.value.getHTML());
      },
    });
  });

  onUnmounted(() => {
    if (editor.value) {
      editor.value.destroy();
    }
  });

  watch(
    () => props.disabled,
    newValue => {
      if (editor.value) {
        editor.value.setEditable(!newValue);
      }
    }
  );
</script>

<style lang="scss" scoped>
  .is-active.bg-dodger {
    background-color: #5898ff;
  }

  .is-active.bg-dodger:hover {
    color: #ffffff;
  }

  :deep(.ProseMirror p.is-editor-empty:first-child::before) {
    color: #79869a;
    font-size: 14px;
    font-weight: 400;
    content: attr(data-placeholder);
    height: 0;
    pointer-events: none;
    position: absolute;
    top: 17px;
    left: 14px;
  }

</style>
