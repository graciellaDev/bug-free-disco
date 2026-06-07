<template>
  <div>
    <section
      v-if="editor && props.showToolbar"
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
  import { Node, mergeAttributes } from '@tiptap/core';
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
    showToolbar: {
      type: Boolean,
      default: true,
    },
    editorClass: {
      type: String,
      default: '',
    },
    singleLine: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(['update:modelValue', 'blur', 'focus']);

  const editor = ref(null);
  const VariableChip = Node.create({
    name: 'variableChip',
    group: 'inline',
    inline: true,
    atom: true,
    selectable: true,
    addAttributes() {
      return {
        token: {
          default: '',
          parseHTML: (element) => element.getAttribute('data-var-token') || '',
          renderHTML: (attributes) => ({
            'data-var-token': String(attributes.token ?? ''),
          }),
        },
        label: {
          default: '',
          parseHTML: (element) =>
            element.getAttribute('data-var-label') ||
            element.textContent ||
            '',
          renderHTML: (attributes) => ({
            'data-var-label': String(attributes.label ?? ''),
          }),
        },
      };
    },
    parseHTML() {
      return [{ tag: 'span[data-var-token]' }];
    },
    renderHTML({ HTMLAttributes }) {
      const token = String(HTMLAttributes.token ?? '');
      const rawLabel = String(HTMLAttributes.label ?? '').trim();
      const label = rawLabel !== '' ? rawLabel : token;
      return [
        'span',
        mergeAttributes(HTMLAttributes, {
          class: 'variable-chip',
          contenteditable: 'false',
        }),
        label,
      ];
    },
    renderText({ node }) {
      return String(node.attrs?.token ?? '');
    },
    addNodeView() {
      return ({ node }) => {
        const token = String(node.attrs?.token ?? '').trim();
        const rawLabel = String(node.attrs?.label ?? '').trim();
        const label = rawLabel !== '' ? rawLabel : token;

        const dom = document.createElement('span');
        dom.className = 'variable-chip';
        dom.setAttribute('contenteditable', 'false');
        dom.setAttribute('data-var-token', token);
        dom.setAttribute('data-var-label', label);
        dom.textContent = label;

        return { dom };
      };
    },
  });

  const insertContentAtCursor = (content) => {
    if (!editor.value) return false;
    return editor.value.chain().focus().insertContent(content).run();
  };

  defineExpose({
    insertText(text) {
      return insertContentAtCursor(String(text ?? ''));
    },
    insertVariable(variable) {
      const token = typeof variable === 'object'
        ? String(variable?.key ?? '').trim()
        : String(variable ?? '').trim();
      const label = typeof variable === 'object'
        ? String(variable?.label ?? variable?.key ?? '').trim()
        : token;
      if (!token || !label || !editor.value) return false;
      return editor.value
        .chain()
        .focus()
        .insertContent([
          {
            type: 'variableChip',
            attrs: {
              token,
              label,
            },
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    },
  });

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
    const editorCssClass = props.singleLine
      ? `popup-scroll border border-athens min-h-10 h-10 max-h-10 overflow-x-auto overflow-y-hidden outline-none max-w-none rounded-ten bg-athens-gray text-sm leading-normal tiptap-single-line ${props.editorClass}`
      : `popup-scroll border border-athens py-15px px-3.5 min-h-[460px] max-h-[460px] overflow-y-auto outline-none prose max-w-none bg-athens-gray ${props.showToolbar ? 'rounded-b-fifteen' : 'rounded-ten'} ${props.editorClass}`;

    editor.value = new Editor({
      editable: !props.disabled,
      editorProps: {
        attributes: {
          class: editorCssClass,
        },
        handleDOMEvents: {
          focus: () => {
            emit('focus');
          },
          blur: () => {
            emit('blur');
          },
        },
        handleKeyDown: (_view, event) => {
          if (props.singleLine && event.key === 'Enter') {
            event.preventDefault();
            return true;
          }
          return false;
        },
      },
      content: props.modelValue || defaultContent.value,
      extensions: [
        StarterKit,
        VariableChip,
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

  :deep(.tiptap-single-line p) {
    margin: 0;
    display: inline;
    white-space: nowrap;
    line-height: 40px;
  }

  :deep(.tiptap-single-line) {
    padding: 0 15px;
    white-space: nowrap;
  }

  :deep(.tiptap-single-line .variable-chip) {
    vertical-align: middle;
  }

</style>
