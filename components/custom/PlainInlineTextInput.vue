<script setup lang="ts">
  import {
    computed,
    ref,
    watch,
    watchEffect,
    nextTick,
  } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      placeholder?: string;
      disabled?: boolean;
      type?: string;
      autocomplete?: string;
      /**
       * Вкладка «Поля»: зона клика на всю ширину хвоста; пунктир только слева от текста,
       * под введённым текстом точек нет (ширина хвоста под текст измеряется).
       */
      leaderFullWidth?: boolean;
      /** Пунктир лидера (режим leaderFullWidth) — подсветка ошибки */
      lineError?: boolean;
      /** Кнопка «крестик» справа (как индикатор в выпадающих списках) — очистка значения */
      clearable?: boolean;
      /** Только цифры (напр. зарплата): ввод/вставка фильтруются */
      digitsOnly?: boolean;
    }>(),
    {
      placeholder: '…',
      disabled: false,
      type: 'text',
      autocomplete: 'off',
      leaderFullWidth: false,
      lineError: false,
      clearable: true,
      digitsOnly: false,
    }
  );

  const DIGITS_ONLY_MAX_LEN = 12;

  function filterDigits(raw: string): string {
    return (raw ?? '').replace(/\D/g, '').slice(0, DIGITS_ONLY_MAX_LEN);
  }

  function syncDigitsOnlyDom(el: HTMLInputElement | null) {
    if (!props.digitsOnly || !el) return;
    const f = filterDigits(el.value);
    if (el.value !== f) {
      el.value = f;
    }
  }

  const emit = defineEmits<{
    'update:modelValue': [value: string];
    blur: [];
  }>();

  const inputRef = ref<HTMLInputElement | null>(null);
  const outerRef = ref<HTMLElement | null>(null);
  /** Сколько пикселей резервируем справа под правый край текста (под курсор) */
  const textReservePx = ref(6);

  function measureTextReserve() {
    if (!props.leaderFullWidth) return;
    const el = inputRef.value;
    if (!el) return;
    const raw = props.modelValue ?? '';
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

  function onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    let v = el.value;
    if (props.digitsOnly) {
      v = filterDigits(v);
      if (el.value !== v) {
        el.value = v;
      }
    }
    emit('update:modelValue', v);
    if (props.leaderFullWidth) {
      nextTick(() => measureTextReserve());
    }
  }

  function onBeforeInput(e: Event) {
    if (!props.digitsOnly || props.disabled) return;
    const ie = e as InputEvent;
    if (
      ie.inputType === 'insertCompositionText' ||
      ie.inputType === 'insertFromComposition'
    ) {
      return;
    }
    if (ie.inputType === 'insertText' || ie.inputType === 'insertFromPaste') {
      const data = ie.data;
      if (data != null && data !== '' && /\D/.test(data)) {
        ie.preventDefault();
      }
    }
  }

  function onCompositionEnd(e: Event) {
    if (!props.digitsOnly || props.disabled) return;
    const el = e.target as HTMLInputElement;
    const f = filterDigits(el.value);
    el.value = f;
    emit('update:modelValue', f);
    if (props.leaderFullWidth) {
      nextTick(() => measureTextReserve());
    }
  }

  function onKeydownDigits(e: KeyboardEvent) {
    if (!props.digitsOnly || props.disabled) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const nav = new Set([
      'Backspace',
      'Delete',
      'Tab',
      'Escape',
      'Enter',
      'ArrowLeft',
      'ArrowRight',
      'ArrowUp',
      'ArrowDown',
      'Home',
      'End',
    ]);
    if (nav.has(e.key)) return;
    if (e.key.length === 1 && !/\d/.test(e.key)) {
      e.preventDefault();
    }
  }

  function onBlur() {
    if (props.digitsOnly && inputRef.value) {
      const f = filterDigits(inputRef.value.value);
      inputRef.value.value = f;
      if (f !== (props.modelValue ?? '')) {
        emit('update:modelValue', f);
      }
    }
    emit('blur');
  }

  watch(
    () => props.modelValue,
    v => {
      if (!props.digitsOnly) return;
      const f = filterDigits(String(v ?? ''));
      if (f !== v) {
        emit('update:modelValue', f);
      }
      nextTick(() => {
        syncDigitsOnlyDom(inputRef.value);
        if (props.leaderFullWidth) measureTextReserve();
      });
    }
  );

  function onLeaderRowMouseDown(e: MouseEvent) {
    if (!props.leaderFullWidth) return;
    const t = e.target as HTMLElement;
    if (t.closest('.plain-fields-leader-clear')) return;
    if (t === inputRef.value) return;
    if (inputRef.value?.contains(t)) return;
    inputRef.value?.focus();
  }

  function onClearClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (props.disabled) return;
    emit('update:modelValue', '');
    nextTick(() => {
      measureTextReserve();
      inputRef.value?.focus();
    });
  }

  const isEmpty = computed(() => (props.modelValue ?? '').length === 0);

  const showClearButton = computed(
    () =>
      props.leaderFullWidth &&
      props.clearable &&
      !props.disabled &&
      !isEmpty.value
  );

  const inputSize = computed(() => {
    if (props.leaderFullWidth) return 1;
    if (isEmpty.value) return 1;
    const v = props.modelValue?.length ?? 0;
    return Math.min(72, Math.max(2, v));
  });

  /** Как у триггера PlainSingleSelectDropdown: gap-1 (4px) + иконка 14px */
  const LEADER_CLEAR_TRAIL_PX = 4 + 14;

  /** Резерв справа под пунктир: текст + хвост как у стрелки в выпадающем списке */
  const leaderDottedReservePx = computed(() => {
    const clearExtra = showClearButton.value ? LEADER_CLEAR_TRAIL_PX : 0;
    return textReservePx.value + clearExtra;
  });

  const shellInlineStyle = computed(() => ({
    '--plain-leader-reserve': `${leaderDottedReservePx.value}px`,
  }));

  watch(
    () => props.modelValue,
    () => {
      if (props.leaderFullWidth) {
        nextTick(() => measureTextReserve());
      }
    }
  );

  watchEffect(
    onCleanup => {
      if (!props.leaderFullWidth) return;
      const el = outerRef.value;
      if (!el || typeof ResizeObserver === 'undefined') return;
      const r = new ResizeObserver(() => measureTextReserve());
      r.observe(el);
      onCleanup(() => r.disconnect());
    },
    { flush: 'post' }
  );

  watch(
    () => props.leaderFullWidth,
    lf => {
      if (lf) {
        nextTick(() => measureTextReserve());
      }
    }
  );

  const inputClassBase =
    'plain-inline-text-input m-0 border-0 bg-transparent p-0 text-right text-sm font-normal leading-normal text-space shadow-none outline-none ring-0 placeholder:text-bali focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60';
</script>

<template>
  <div
    v-if="leaderFullWidth"
    ref="outerRef"
    class="plain-fields-leader-outer"
    @mousedown="onLeaderRowMouseDown"
  >
    <div
      class="plain-fields-leader-shell"
      :class="{ 'plain-fields-leader-shell--error': lineError }"
      :style="shellInlineStyle"
    >
      <div class="plain-fields-leader-input-row">
        <input
          ref="inputRef"
          :value="modelValue"
          :type="type"
          :disabled="disabled"
          :placeholder="undefined"
          :autocomplete="autocomplete"
          class="plain-inline-text-input--leader-fullwidth"
          :class="inputClassBase"
          :inputmode="digitsOnly ? 'numeric' : undefined"
          :maxlength="digitsOnly ? DIGITS_ONLY_MAX_LEN : undefined"
          spellcheck="false"
          autocorrect="off"
          autocapitalize="off"
          @beforeinput="onBeforeInput"
          @compositionend="onCompositionEnd"
          @keydown="onKeydownDigits"
          @input="onInput"
          @blur="onBlur"
        />
        <button
          v-if="showClearButton"
          type="button"
          class="plain-fields-leader-clear"
          aria-label="Очистить поле"
          @click="onClearClick"
          @mousedown.prevent
        >
          <!-- Не svg-icon: в спрайте fill часто захардкожен и не берёт currentColor -->
          <svg
            class="plain-fields-leader-clear-svg"
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
  </div>
  <input
    v-else
    ref="inputRef"
    :value="modelValue"
    :type="type"
    :disabled="disabled"
    :placeholder="placeholder"
    :autocomplete="autocomplete"
    :size="inputSize"
    :class="[inputClassBase]"
    :inputmode="digitsOnly ? 'numeric' : undefined"
    :maxlength="digitsOnly ? DIGITS_ONLY_MAX_LEN : undefined"
    spellcheck="false"
    autocorrect="off"
    autocapitalize="off"
    @beforeinput="onBeforeInput"
    @compositionend="onCompositionEnd"
    @keydown="onKeydownDigits"
    @input="onInput"
    @blur="onBlur"
  />
</template>

<style scoped>
  .plain-inline-text-input {
    width: auto;
    min-width: 0;
    max-width: inherit;
  }
  .plain-fields-leader-outer {
    flex: 1 1 0;
    min-width: 0;
    box-sizing: border-box;
    cursor: text;
    /* Как у .fields-tab-line__dots: одна визуальная линия на уровне подписей */
    transform: translateY(-0.28em);
  }
  .plain-fields-leader-shell {
    flex: 1 1 0;
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    box-sizing: border-box;
  }
  .plain-fields-leader-input-row {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: row;
    /* низ строки у пунктира; без «висшего» текста из-за высоты input */
    align-items: flex-end;
    gap: 0.25rem; /* gap-1 как у PlainSingleSelectDropdown */
    width: 100%;
    min-width: 0;
  }
  .plain-fields-leader-shell::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: 0;
    width: max(0px, calc(100% - var(--plain-leader-reserve, 6px)));
    height: 0;
    border-bottom: 1px dotted #c5cdd5;
    pointer-events: none;
    z-index: 0;
  }
  .plain-fields-leader-shell--error::after {
    border-bottom-color: #ef4444;
  }
  .plain-inline-text-input--leader-fullwidth {
    flex: 1 1 0;
    position: relative;
    display: block;
    min-width: 0;
    width: 100%;
    cursor: text;
    field-sizing: unset;
    background: transparent !important;
    /* Ближе к span в PlainSingleSelectDropdown: без лишней «подушки» под текстом */
    padding-block: 0 !important;
    margin: 0;
    min-height: 0;
    height: auto;
    line-height: 1.25;
    transform: translateY(calc(0.08em + 2px));
  }
  /* Как стрелка у триггера PlainSingleSelectDropdown (text-bali) */
  .plain-fields-leader-clear {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    color: #79869a;
    background: transparent !important;
    cursor: pointer;
    line-height: 0;
    transform: translateY(calc(-0.12em + 4px));
  }
  /*
    Тот же text-bali (#79869a), но X из stroke кажется темнее стрелки в спрайте:
    тоньше штрих + лёгкая прозрачность для совпадения «на глаз».
  */
  .plain-fields-leader-clear-svg {
    display: block;
    flex-shrink: 0;
    opacity: 0.92;
  }
  .plain-inline-text-input:not(.plain-inline-text-input--leader-fullwidth):placeholder-shown {
    field-sizing: fixed;
    width: min(2.5ch, 2rem);
    max-width: 3ch;
  }
  @supports (field-sizing: content) {
    .plain-inline-text-input:not(
        .plain-inline-text-input--leader-fullwidth
      ):not(:placeholder-shown) {
      field-sizing: content;
      min-width: 1.25rem;
    }
  }

  /* В полях вкладки «Поля» у даты не показываем системную иконку календаря */
  .plain-inline-text-input[type='date']::-webkit-calendar-picker-indicator {
    display: none;
    -webkit-appearance: none;
  }
  .plain-inline-text-input[type='date']::-webkit-clear-button,
  .plain-inline-text-input[type='date']::-webkit-inner-spin-button {
    display: none;
  }
  .plain-inline-text-input[type='date'] {
    appearance: textfield;
    -webkit-appearance: textfield;
  }
</style>
