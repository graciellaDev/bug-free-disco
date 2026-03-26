<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: number[];
      options: { id: number; name: string }[];
      placeholder?: string;
      disabled?: boolean;
    }>(),
    {
      placeholder: 'Выбрать',
      disabled: false,
    }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: number[]];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);

  const selectedIds = computed(() =>
    Array.isArray(props.modelValue) ? [...new Set(props.modelValue)] : []
  );

  const isEmpty = computed(() => selectedIds.value.length === 0);

  const nameById = computed(() => {
    const m = new Map<number, string>();
    for (const o of props.options) {
      m.set(o.id, (o.name ?? '').trim());
    }
    return m;
  });

  const triggerLabel = computed(() => {
    if (isEmpty.value) return props.placeholder;
    const parts = selectedIds.value
      .map(id => nameById.value.get(id) || String(id))
      .filter(Boolean);
    return parts.join(', ');
  });

  const menuOptions = computed(() => {
    const opts = [...props.options].filter(o => (o.name ?? '').trim() !== '');
    const known = new Set(opts.map(o => o.id));
    for (const id of selectedIds.value) {
      if (!known.has(id)) {
        opts.push({ id, name: nameById.value.get(id) || `ID ${id}` });
      }
    }
    return opts;
  });

  function isSelected(id: number): boolean {
    return selectedIds.value.includes(id);
  }

  function toggle() {
    if (props.disabled) return;
    open.value = !open.value;
  }

  function toggleOption(id: number) {
    const cur = new Set(selectedIds.value);
    if (cur.has(id)) {
      cur.delete(id);
    } else {
      cur.add(id);
    }
    const next = [...cur].sort((a, b) => a - b);
    emit('update:modelValue', next);
  }

  function onDocClick(e: MouseEvent) {
    const el = rootRef.value;
    if (!el || !open.value) return;
    const t = e.target;
    if (t instanceof Node && !el.contains(t)) {
      open.value = false;
    }
  }

  onMounted(() => document.addEventListener('click', onDocClick, true));
  onBeforeUnmount(() =>
    document.removeEventListener('click', onDocClick, true)
  );

</script>

<template>
  <div
    ref="rootRef"
    class="relative inline-flex max-w-full min-w-0 justify-end text-right"
  >
    <button
      type="button"
      class="inline-flex max-w-full min-w-0 -translate-y-[2px] items-center gap-1 border-0 bg-transparent p-0 text-right shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-0"
      :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
      :disabled="disabled"
      @click.stop="toggle"
    >
      <span
        class="min-w-0 truncate text-sm font-normal leading-normal"
        :class="isEmpty ? 'text-bali' : 'text-space'"
      >
        {{ triggerLabel }}
      </span>
      <svg-icon
        name="dropdown-arrow"
        width="14"
        height="14"
        class="shrink-0 text-bali transition-transform duration-200"
        :class="{ 'rotate-180': open }"
      />
    </button>

    <Transition name="pmsd-fade">
      <div
        v-if="open"
        role="menu"
        class="plain-multi-select-panel absolute right-0 top-full z-[100] mt-1 max-h-[min(320px,50vh)] w-max min-w-[min(100%,260px)] max-w-[min(100vw-32px,320px)] overflow-y-auto rounded-fifteen bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        @click.stop
      >
        <button
          v-for="opt in menuOptions"
          :key="opt.id"
          type="button"
          class="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm font-normal leading-normal transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          :class="
            isSelected(opt.id)
              ? 'bg-athens-gray text-space'
              : 'text-slate-custom hover:bg-catskill'
          "
          :disabled="disabled"
          role="menuitemcheckbox"
          :aria-checked="isSelected(opt.id)"
          @click.stop="toggleOption(opt.id)"
        >
          <span
            class="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-solid transition-colors"
            :class="
              isSelected(opt.id)
                ? 'border-space bg-space text-white'
                : 'border-athens-gray bg-white'
            "
            aria-hidden="true"
          >
            <svg
              v-if="isSelected(opt.id)"
              class="h-2.5 w-2.5"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 6l3 3 5-6"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </span>
          <span class="min-w-0 flex-1 truncate">{{ opt.name }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .plain-multi-select-panel {
    scrollbar-width: thin;
    scrollbar-color: #e8eaef transparent;
  }
  .plain-multi-select-panel::-webkit-scrollbar {
    width: 6px;
  }
  .plain-multi-select-panel::-webkit-scrollbar-thumb {
    background-color: #e8eaef;
    border-radius: 6px;
  }

  .pmsd-fade-enter-active,
  .pmsd-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .pmsd-fade-enter-from,
  .pmsd-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
