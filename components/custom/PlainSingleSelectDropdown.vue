<script setup lang="ts">
  import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string | null | undefined;
      options: string[];
      placeholder?: string;
      disabled?: boolean;
      /** Показывать первую строку меню «placeholder» (сброс на пустое). false — только реальные опции */
      showPlaceholderInMenu?: boolean;
      /** Узкое меню: без колонки ✓, ширина по тексту, меньше горизонтальных отступов */
      compactMenu?: boolean;
    }>(),
    {
      placeholder: 'Выбрать',
      disabled: false,
      showPlaceholderInMenu: true,
      compactMenu: false,
    }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);

  const displayValue = computed(() => (props.modelValue ?? '').trim());

  const isEmpty = computed(() => !displayValue.value);

  const triggerLabel = computed(() =>
    isEmpty.value ? props.placeholder : displayValue.value
  );

  /** Опции меню: заданный список + текущее значение, если его ещё нет в списке */
  const menuOptions = computed(() => {
    const cur = displayValue.value;
    const opts = props.options.map(o => o.trim()).filter(Boolean);
    if (cur && !opts.includes(cur)) {
      return [cur, ...opts];
    }
    return opts;
  });

  function toggle() {
    if (props.disabled) return;
    open.value = !open.value;
  }

  function selectClear() {
    emit('update:modelValue', '');
    open.value = false;
  }

  function selectOption(opt: string) {
    emit('update:modelValue', opt);
    open.value = false;
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
      class="inline-flex max-w-full min-w-0 -translate-y-[2px] items-center gap-1 border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-0"
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

    <Transition name="psd-fade">
      <div
        v-if="open"
        class="plain-select-panel absolute right-0 top-full z-[100] mt-1 max-h-[min(280px,50vh)] overflow-y-auto rounded-fifteen bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
        :class="
          compactMenu
            ? 'w-max max-w-[min(100vw-32px,420px)]'
            : 'w-max min-w-[min(100%,260px)] max-w-[min(100vw-32px,320px)]'
        "
        @click.stop
      >
        <button
          v-if="showPlaceholderInMenu"
          type="button"
          class="flex w-full items-center text-left text-sm font-normal leading-normal transition-colors"
          :class="[
            compactMenu ? 'gap-0 px-2.5 py-2.5' : 'gap-2 px-3 py-2.5',
            isEmpty
              ? 'bg-athens-gray text-space'
              : 'text-slate-custom hover:bg-catskill',
          ]"
          @click="selectClear"
        >
          <span
            v-if="!compactMenu"
            class="flex w-4 shrink-0 justify-center"
          >
            <span v-if="isEmpty" class="text-sm leading-none text-space">✓</span>
          </span>
          <span
            class="min-w-0"
            :class="compactMenu ? 'whitespace-nowrap' : 'truncate'"
            >{{ placeholder }}</span
          >
        </button>
        <button
          v-for="opt in menuOptions"
          :key="opt"
          type="button"
          class="flex w-full items-center text-left text-sm font-normal leading-normal transition-colors"
          :class="
            [
              compactMenu ? 'gap-0 px-2.5 py-2.5' : 'gap-2 px-3 py-2.5',
              opt === displayValue
                ? 'bg-athens-gray text-space'
                : 'text-slate-custom hover:bg-catskill',
            ]
          "
          @click="selectOption(opt)"
        >
          <span
            v-if="!compactMenu"
            class="flex w-4 shrink-0 justify-center"
          >
            <span
              v-if="opt === displayValue"
              class="text-sm leading-none text-space"
              >✓</span
            >
          </span>
          <span
            class="min-w-0"
            :class="compactMenu ? 'whitespace-nowrap' : 'flex-1 truncate'"
            >{{ opt }}</span
          >
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
  .plain-select-panel {
    scrollbar-width: thin;
    scrollbar-color: #e8eaef transparent;
  }
  .plain-select-panel::-webkit-scrollbar {
    width: 6px;
  }
  .plain-select-panel::-webkit-scrollbar-thumb {
    background-color: #e8eaef;
    border-radius: 6px;
  }

  .psd-fade-enter-active,
  .psd-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .psd-fade-enter-from,
  .psd-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
