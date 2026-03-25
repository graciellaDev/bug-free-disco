<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import { parseDate, type DateValue } from '@internationalized/date';
  import CalendarBarStatic from '@/components/custom/CalendarBarStatic.vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string | null | undefined;
      placeholder?: string;
      disabled?: boolean;
    }>(),
    {
      placeholder: '',
      disabled: false,
    }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);
  const draft = ref('');
  const isEmpty = computed(() => !draft.value.trim());
  const textReservePx = ref(6);
  const calendarValue = ref<DateValue | undefined>(undefined);
  const panelStyle = ref<Record<string, string>>({});

  function isoFromRaw(raw: string): string {
    const s = raw.trim();
    if (!s) return '';
    const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (iso) {
      return isValidIsoDate(`${iso[1]}-${iso[2]}-${iso[3]}`)
        ? `${iso[1]}-${iso[2]}-${iso[3]}`
        : '';
    }
    const ru = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(s);
    if (ru) {
      const asIso = `${ru[3]}-${ru[2]}-${ru[1]}`;
      return isValidIsoDate(asIso) ? asIso : '';
    }
    const digits = s.replace(/\D/g, '');
    if (digits.length === 8) {
      const dd = digits.slice(0, 2);
      const mm = digits.slice(2, 4);
      const yyyy = digits.slice(4, 8);
      const asIso = `${yyyy}-${mm}-${dd}`;
      return isValidIsoDate(asIso) ? asIso : '';
    }
    return '';
  }

  function displayFromIso(iso: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return '';
    return `${m[3]}.${m[2]}.${m[1]}`;
  }

  function isValidIsoDate(iso: string): boolean {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (!m) return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d))
      return false;
    const dt = new Date(y, mo - 1, d);
    return (
      dt.getFullYear() === y &&
      dt.getMonth() === mo - 1 &&
      dt.getDate() === d
    );
  }

  function formatDigitsAsRuDate(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (!digits) return '';
    if (digits.length <= 2) return digits;
    if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  }

  const normalizedValue = computed(() => isoFromRaw(String(props.modelValue ?? '')));

  const parsedPlaceholder = computed(() => {
    const iso = normalizedValue.value;
    if (!iso) return undefined;
    try {
      return parseDate(iso);
    } catch {
      return undefined;
    }
  });

  function measureTextReserve() {
    const el = inputRef.value;
    if (!el) return;
    const raw = draft.value ?? '';
    if (raw.length === 0) {
      textReservePx.value = 6;
      return;
    }
    const style = getComputedStyle(el);
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const span = document.createElement('span');
    span.style.cssText =
      'position:absolute;left:-99999px;top:0;white-space:pre;pointer-events:none;';
    span.style.font = font;
    span.textContent = raw;
    document.body.appendChild(span);
    const w = span.offsetWidth;
    document.body.removeChild(span);
    textReservePx.value = Math.max(6, Math.ceil(w) + 8);
  }

  watch(
    () => props.modelValue,
    value => {
      const iso = isoFromRaw(String(value ?? ''));
      draft.value = iso ? displayFromIso(iso) : '';
      calendarValue.value = iso ? parseDate(iso) : undefined;
      nextTick(() => measureTextReserve());
    },
    { immediate: true }
  );

  const showClearButton = computed(() => !props.disabled && !isEmpty.value);
  const LEADER_CLEAR_TRAIL_PX = 18;
  const shellInlineStyle = computed(() => {
    const clearExtra = showClearButton.value ? LEADER_CLEAR_TRAIL_PX : 0;
    return {
      '--plain-date-reserve': `${textReservePx.value + clearExtra}px`,
    };
  });

  function commitDraft() {
    const iso = isoFromRaw(draft.value);
    if (!draft.value.trim()) {
      emit('update:modelValue', '');
      return;
    }
    if (!iso) {
      const fallbackIso = normalizedValue.value;
      draft.value = fallbackIso ? displayFromIso(fallbackIso) : '';
      return;
    }
    draft.value = displayFromIso(iso);
    emit('update:modelValue', iso);
  }

  function onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    draft.value = formatDigitsAsRuDate(el.value);
    nextTick(() => measureTextReserve());
  }

  function onBlur() {
    commitDraft();
  }

  function onInputFocus() {
    if (props.disabled) return;
    open.value = true;
  }

  function onEnter() {
    commitDraft();
    inputRef.value?.blur();
  }

  function toggle() {
    if (props.disabled) return;
    open.value = !open.value;
  }

  function clearValue() {
    draft.value = '';
    emit('update:modelValue', '');
    nextTick(() => measureTextReserve());
    if (!props.disabled) {
      inputRef.value?.focus();
    }
  }

  function onCalendarUpdate(date: DateValue) {
    if (!date) return;
    const iso = String(date.toString());
    draft.value = displayFromIso(iso);
    emit('update:modelValue', iso);
    calendarValue.value = date;
    open.value = false;
  }

  function updatePanelPosition() {
    if (!open.value || !rootRef.value) return;
    const anchor = rootRef.value.getBoundingClientRect();
    const panel = panelRef.value;
    const panelWidth = panel?.offsetWidth ?? 320;
    const panelHeight = panel?.offsetHeight ?? 360;
    const gap = 6;

    let left = anchor.right - panelWidth;
    left = Math.max(8, Math.min(left, window.innerWidth - panelWidth - 8));

    let top = anchor.bottom + gap;
    if (top + panelHeight > window.innerHeight - 8) {
      top = Math.max(8, anchor.top - panelHeight - gap);
    }

    panelStyle.value = {
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
    };
  }

  function bindFloatingListeners() {
    window.addEventListener('resize', updatePanelPosition);
    window.addEventListener('scroll', updatePanelPosition, true);
  }

  function unbindFloatingListeners() {
    window.removeEventListener('resize', updatePanelPosition);
    window.removeEventListener('scroll', updatePanelPosition, true);
  }

  watch(open, async isOpen => {
    if (isOpen) {
      await nextTick();
      updatePanelPosition();
      bindFloatingListeners();
    } else {
      unbindFloatingListeners();
    }
  });

  function onDocClick(e: MouseEvent) {
    if (!open.value) return;

    const target = e.target as Node | null;

    // Клик внутри инпута/триггера — не закрываем
    if (target && rootRef.value?.contains(target)) return;

    // Клик внутри плавающей панели — не закрываем
    if (target && panelRef.value?.contains(target)) return;

    // Radix рендерит SelectContent в портал (<body>).
    // При клике в нём event.target может быть document.documentElement
    // или самим элементом портала — в обоих случаях проверяем наличие открытого select
    if (
      target === document.documentElement ||
      target === document ||
      target === window
    ) {
      if (
        document.querySelector('[role="presentation"]') ||
        document.querySelector('[data-radix-select-content]')
      ) {
        return;
      }
    }

    // Дополнительно: composedPath() проверяем на radix-атрибуты
    const path: EventTarget[] = e.composedPath ? e.composedPath() : [];
    const inSelectPortal = path.some(node => {
      if (!(node instanceof HTMLElement)) return false;
      const role = node.getAttribute('role');
      if (role === 'listbox' || role === 'option' || role === 'combobox') return true;
      return node.hasAttribute('data-radix-select-content');
    });
    if (inSelectPortal) return;

    open.value = false;
  }

  onMounted(() => {
    document.addEventListener('mousedown', onDocClick);
    nextTick(() => measureTextReserve());
  });
  onBeforeUnmount(() =>
    document.removeEventListener('mousedown', onDocClick)
  );
  onBeforeUnmount(() => unbindFloatingListeners());
</script>

<template>
  <div ref="rootRef" class="plain-date-leader-outer relative">
    <div class="plain-date-leader-shell" :style="shellInlineStyle">
      <div class="plain-date-leader-input-row">
      <input
        ref="inputRef"
        :value="draft"
        type="text"
        inputmode="numeric"
        maxlength="10"
        :placeholder="placeholder"
        :disabled="disabled"
        class="plain-date-input border-0 bg-transparent p-0 text-right text-sm font-normal leading-normal text-space outline-none placeholder:text-bali disabled:cursor-not-allowed disabled:opacity-60"
        @input="onInput"
        @focus="onInputFocus"
        @blur="onBlur"
        @keydown.enter.prevent="onEnter"
        @mousedown.stop
      />
      <button
        v-if="showClearButton"
        type="button"
        class="inline-flex h-[14px] w-[14px] items-center justify-center border-0 bg-transparent p-0 text-bali transition-colors hover:text-space disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="disabled"
        aria-label="Очистить дату"
        @click.stop="clearValue"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 4l6 6M10 4L4 10"
            fill="none"
            stroke="currentColor"
            stroke-width="1.1"
            stroke-linecap="round"
          />
        </svg>
      </button>
      </div>
    </div>

    <Teleport to="body">
      <Transition name="pdsd-fade">
        <div
          v-if="open"
          ref="panelRef"
          class="plain-date-overlay fixed z-[10020] w-[254px]"
          :style="panelStyle"
          @click.stop
          @mousedown.stop
        >
          <CalendarBarStatic
            class="plain-date-calendar"
            :model-value="calendarValue"
            elevate-select-popovers
            @date-click="onCalendarUpdate"
          />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  .plain-date-leader-outer {
    flex: 1 1 0;
    min-width: 0;
    box-sizing: border-box;
    transform: translateY(-0.28em);
  }
  .plain-date-leader-shell {
    position: relative;
    width: 100%;
    min-width: 0;
  }
  .plain-date-leader-shell::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: max(0px, calc(100% - var(--plain-date-reserve, 120px)));
    height: 0;
    border-bottom: 1px dotted #c5cdd5;
    pointer-events: none;
    z-index: 0;
  }
  .plain-date-leader-input-row {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
    align-items: flex-end;
    gap: 0;
    width: 100%;
    min-width: 0;
  }
  .plain-date-input {
    flex: 1 1 0;
    width: 100%;
    min-width: 0;
    line-height: 1.25;
    transform: translateY(calc(0.08em + 2px));
  }
  .plain-date-leader-input-row > button {
    margin-left: 4px;
  }

  .plain-date-overlay :deep(.plain-date-calendar .calendar-wrapper) {
    margin: 0;
    border-radius: 15px;
    overflow: hidden;
  }
  .plain-date-overlay :deep(.plain-date-calendar .header-handler) {
    gap: 0.5rem;
  }
  .plain-date-overlay :deep(.plain-date-calendar [aria-label='Select month']) {
    width: 58% !important;
  }
  .plain-date-overlay :deep(.plain-date-calendar [aria-label='Select year']) {
    width: 38% !important;
  }
  .plain-date-overlay :deep(.plain-date-calendar .select-month-custom) {
    min-height: 2rem;
    height: 2rem;
    font-size: 0.9rem;
  }
  .plain-date-overlay :deep(.plain-date-calendar .calendar-wrapper [data-radix-calendar-cell-trigger]) {
    width: 2rem;
    height: 2rem;
    font-size: 0.95rem;
    border-radius: 9999px;
  }

  .pdsd-fade-enter-active,
  .pdsd-fade-leave-active {
    transition:
      opacity 0.15s ease,
      transform 0.15s ease;
  }
  .pdsd-fade-enter-from,
  .pdsd-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
