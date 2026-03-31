<script setup lang="ts">
  import {
    computed,
    inject,
    nextTick,
    onBeforeUnmount,
    onMounted,
    reactive,
    ref,
    watch,
    withDefaults,
  } from 'vue';
  import PlainInlineTextInput from '~/components/custom/PlainInlineTextInput.vue';
  import PlainSingleSelectDropdown from '~/components/custom/PlainSingleSelectDropdown.vue';
  import PlainMultiSelectDropdown from '~/components/custom/PlainMultiSelectDropdown.vue';
  import PlainDateSelectDropdown from '~/components/custom/PlainDateSelectDropdown.vue';
  import AddressMapInput from '~/components/custom/AddressMapInput.vue';
  import MyToggleSwitch from '~/components/custom/MyToggleSwitch.vue';
  import MyCheckbox from '~/components/custom/MyCheckbox.vue';
  import {
    parseCandidateLinkUrl,
    type LocalCandidateCustomField,
  } from '@/types/candidateLocalCustomFields';

  const props = withDefaults(
    defineProps<{
      field: LocalCandidateCustomField;
      /** Показать ручку DnD и карандаш редактирования (после «Настроить») */
      layoutEditMode?: boolean;
    }>(),
    { layoutEditMode: false }
  );

  const emit = defineEmits<{
    edit: [field: LocalCandidateCustomField];
    deleteRequest: [field: LocalCandidateCustomField];
  }>();

  const showFieldsTabToast = inject<
    ((message: string, variant?: 'success' | 'error') => void) | undefined
  >('showFieldsTabToast', undefined);

  /** Красный пунктир у поля «ссылка» (по localId, если несколько полей) */
  const linkLineErrorById = reactive<Record<string, boolean>>({});

  const linkEditMode = ref(false);
  const linkMenuOpen = ref(false);
  const linkInputWrapRef = ref<HTMLElement | null>(null);

  const linkShowsClickableOverlay = computed(() => {
    if (props.field.fieldKind !== 'link') return false;
    const t = props.field.textValue.trim();
    return !!parseCandidateLinkUrl(t) && !linkEditMode.value;
  });

  function toggleLinkMenu() {
    linkMenuOpen.value = !linkMenuOpen.value;
  }

  function closeLinkMenu() {
    linkMenuOpen.value = false;
  }

  function onLinkMenuDocClick(e: MouseEvent) {
    if (!linkMenuOpen.value) return;
    const el = linkInputWrapRef.value;
    const t = e.target;
    if (el && t instanceof Node && el.contains(t)) return;
    closeLinkMenu();
  }

  onMounted(() =>
    document.addEventListener('click', onLinkMenuDocClick, true)
  );
  onBeforeUnmount(() =>
    document.removeEventListener('click', onLinkMenuDocClick, true)
  );

  function linkActionGo() {
    const t = props.field.textValue.trim();
    const u = parseCandidateLinkUrl(t);
    if (u) window.open(u.href, '_blank', 'noopener,noreferrer');
    closeLinkMenu();
  }

  async function linkActionCopy() {
    const t = props.field.textValue.trim();
    try {
      await navigator.clipboard.writeText(t);
      showFieldsTabToast?.('Скопировано', 'success');
    } catch {
      showFieldsTabToast?.('Не удалось скопировать', 'error');
    }
    closeLinkMenu();
  }

  function linkActionEdit() {
    closeLinkMenu();
    linkEditMode.value = true;
    nextTick(() => {
      const input = linkInputWrapRef.value?.querySelector?.('input');
      if (input instanceof HTMLInputElement) {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }
    });
  }

  function onLocalLinkBlur() {
    if (props.field.fieldKind !== 'link') return;
    const id = props.field.localId;
    linkEditMode.value = false;
    const t = props.field.textValue.trim();
    if (!t) {
      linkLineErrorById[id] = false;
      return;
    }
    if (!parseCandidateLinkUrl(t)) {
      props.field.textValue = '';
      linkLineErrorById[id] = false;
      showFieldsTabToast?.(
        'Введите корректную ссылку (например, https://example.com)'
      );
    } else {
      linkLineErrorById[id] = false;
    }
  }

  const linkFieldInputTextClass = computed(() => {
    if (props.field.fieldKind !== 'link') return undefined;
    const id = props.field.localId;
    const t = props.field.textValue.trim();
    if (linkLineErrorById[id]) return undefined;
    if (linkEditMode.value) return undefined;
    if (t && parseCandidateLinkUrl(t)) return 'text-dodger hover:underline';
    return undefined;
  });

  watch(
    () => props.field.textValue,
    () => {
      if (props.field.fieldKind !== 'link') return;
      const id = props.field.localId;
      if (linkLineErrorById[id] && parseCandidateLinkUrl(props.field.textValue)) {
        linkLineErrorById[id] = false;
      }
    }
  );

  const listOptions = computed(() =>
    props.field.options.map(o => o.trim()).filter(Boolean)
  );

  /** id 1..n по строкам options (как у рекрутеров) */
  const multiOptions = computed(() =>
    props.field.options.map((name, i) => ({
      id: i + 1,
      name: name.trim() || `Вариант ${i + 1}`,
    }))
  );

  const toggleId = computed(
    () => `local-cf-switch-${props.field.localId.slice(0, 8)}`
  );

</script>

<template>
  <div
    class="fields-tab-line mb-5 transition-opacity duration-150"
    :class="
      layoutEditMode
        ? 'local-cf-row--layout-edit relative pl-[22px] pr-[3.5rem]'
        : ''
    "
  >
    <div
      v-if="layoutEditMode"
      class="local-cf-drag-handle absolute left-0 top-1/2 z-[1] flex w-[22px] shrink-0 select-none items-center justify-center leading-none"
      aria-hidden="true"
    >
      <svg
        class="block text-bali"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M3 4h8M3 7h8M3 10h8"
          stroke="currentColor"
          stroke-width="1.2"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <!-- Подпись: те же классы, что у «Источник»; карандаш — отдельная колонка справа после значения -->
    <div
      class="fields-tab-line__label shrink-0 self-end -translate-y-[2px] text-sm font-normal leading-normal text-bali"
    >
      <span>{{ field.name }}</span>
    </div>

    <template v-if="field.fieldKind === 'text'">
      <PlainInlineTextInput
        v-model="field.textValue"
        leader-full-width
        type="text"
        placeholder=""
        autocomplete="off"
      />
    </template>

    <template v-else-if="field.fieldKind === 'address'">
      <div class="flex min-w-0 flex-1 justify-end">
        <ClientOnly>
          <AddressMapInput
            layout="inline"
            :model-value="field.textValue"
            placeholder=""
            @update:model-value="field.textValue = $event"
          />
          <template #fallback>
            <div class="w-[280px] max-w-full shrink-0">
              <PlainInlineTextInput
                v-model="field.textValue"
                leader-full-width
                type="text"
                placeholder=""
                autocomplete="street-address"
              />
            </div>
          </template>
        </ClientOnly>
      </div>
    </template>

    <template v-else-if="field.fieldKind === 'number'">
      <PlainInlineTextInput
        v-model="field.numberValue"
        leader-full-width
        digits-only
        type="text"
        placeholder=""
        autocomplete="off"
      />
    </template>

    <template v-else-if="field.fieldKind === 'link'">
      <div ref="linkInputWrapRef" class="relative min-w-0 flex-1">
        <PlainInlineTextInput
          v-model="field.textValue"
          leader-full-width
          type="text"
          placeholder="https://…"
          autocomplete="url"
          :line-error="!!linkLineErrorById[field.localId]"
          :input-text-class="linkFieldInputTextClass"
          @blur="onLocalLinkBlur"
        />
        <button
          v-if="linkShowsClickableOverlay"
          type="button"
          class="absolute inset-0 z-[2] cursor-pointer border-0 bg-transparent p-0 shadow-none outline-none"
          :aria-label="`Действия со ссылкой: ${field.name}`"
          @click.stop="toggleLinkMenu"
        />
        <Transition name="local-link-dd">
          <div
            v-if="linkMenuOpen"
            class="local-link-dropdown absolute right-0 top-full z-[101] mt-1 min-w-[200px] max-w-[min(100vw-32px,280px)] overflow-hidden rounded-fifteen bg-white py-1 shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
            role="menu"
            @click.stop
          >
            <button
              type="button"
              role="menuitem"
              class="local-link-dropdown__item"
              @click="linkActionCopy"
            >
              Копировать
            </button>
            <button
              type="button"
              role="menuitem"
              class="local-link-dropdown__item"
              @click="linkActionEdit"
            >
              Редактировать
            </button>
            <button
              type="button"
              role="menuitem"
              class="local-link-dropdown__item"
              @click="linkActionGo"
            >
              Перейти
            </button>
          </div>
        </Transition>
      </div>
    </template>

    <template v-else-if="field.fieldKind === 'flag'">
      <span class="fields-tab-line__dots" aria-hidden="true" />
      <div class="fields-tab-line__value -translate-y-[3px]">
        <MyCheckbox
          :id="`local-cf-flag-${field.localId}`"
          v-model="field.boolValue"
          label=""
          :empty-label="true"
          compact
        />
      </div>
    </template>

    <!-- Как строка «Источник» в Системных полях: пунктир + PlainSingleSelectDropdown справа -->
    <template v-else-if="field.fieldKind === 'list'">
      <span class="fields-tab-line__dots" aria-hidden="true" />
      <div class="fields-tab-line__value">
        <PlainSingleSelectDropdown
          :model-value="field.listValue || ''"
          :options="listOptions"
          placeholder="Выбрать"
          @update:model-value="v => (field.listValue = v)"
        />
      </div>
    </template>

    <template v-else-if="field.fieldKind === 'multilist'">
      <span class="fields-tab-line__dots" aria-hidden="true" />
      <div class="fields-tab-line__value">
        <PlainMultiSelectDropdown
          v-model="field.multiIds"
          :options="multiOptions"
          placeholder="Выбрать"
        />
      </div>
    </template>

    <template v-else-if="field.fieldKind === 'date'">
      <PlainDateSelectDropdown v-model="field.dateValue" />
    </template>

    <template v-else-if="field.fieldKind === 'datetime'">
      <PlainDateSelectDropdown v-model="field.dateValue" with-time />
    </template>

    <template v-else-if="field.fieldKind === 'switch'">
      <div class="flex min-w-0 flex-1 items-center">
        <MyToggleSwitch :id="toggleId" v-model="field.boolValue" />
      </div>
    </template>

    <div
      v-if="layoutEditMode"
      class="local-cf-actions-slot absolute right-0 top-1/2 z-[1] flex w-[3.5rem] shrink-0 -translate-y-1/2 items-center justify-end gap-0.5 pl-1 leading-none"
    >
      <!-- Иконки как на вкладке «Лента событий» (CandidateLog.vue) -->
      <button
        type="button"
        class="group/btn inline-flex shrink-0 cursor-pointer items-center rounded border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
        aria-label="Удалить поле"
        @click.stop="emit('deleteRequest', field)"
      >
        <span
          class="flex h-6 w-6 items-center justify-center text-red-500 transition-colors group-hover/btn:text-red-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path
              d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z"
            />
            <line x1="10" y1="11" x2="10" y2="17" />
            <line x1="14" y1="11" x2="14" y2="17" />
          </svg>
        </span>
      </button>
      <button
        type="button"
        class="group/btn inline-flex shrink-0 cursor-pointer items-center rounded border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-dodger"
        aria-label="Изменить поле"
        @click.stop="emit('edit', field)"
      >
        <span
          class="flex h-6 w-6 items-center justify-center text-dodger transition-colors group-hover/btn:text-dodger"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
  .local-link-dropdown__item {
    display: block;
    width: 100%;
    border: 0;
    background: transparent;
    padding: 10px 16px;
    text-align: left;
    font-size: 0.875rem;
    font-weight: 400;
    line-height: 1.5;
    color: #79869a;
    outline: none;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease;
  }
  .local-link-dropdown__item:hover,
  .local-link-dropdown__item:focus-visible {
    background-color: #eef5ff;
    color: #212936;
  }

  .local-link-dd-enter-active,
  .local-link-dd-leave-active {
    transition:
      opacity 0.12s ease,
      transform 0.12s ease;
  }
  .local-link-dd-enter-from,
  .local-link-dd-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }

  /* По центру строки, +2px вверх (не участвует в высоте flex — абсолютное позиционирование) */
  .local-cf-drag-handle {
    transform: translateY(calc(-50% - 2px));
  }

</style>
