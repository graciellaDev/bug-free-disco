<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
  import {
    getLocalTimeZone,
    parseDate,
    today,
    type DateValue,
  } from '@internationalized/date';
  import CalendarBarStatic from '@/components/custom/CalendarBarStatic.vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string | null | undefined;
      placeholder?: string;
      disabled?: boolean;
      /** Календарь + список времени (шаг 15 мин); значение `DD.MM.YYYY HH:mm` */
      withTime?: boolean;
    }>(),
    {
      placeholder: '',
      disabled: false,
      withTime: false,
    }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);
  const panelRef = ref<HTMLElement | null>(null);
  const timeListRef = ref<HTMLElement | null>(null);
  const calWrapRef = ref<HTMLElement | null>(null);
  const inputRef = ref<HTMLInputElement | null>(null);
  /** Высота колонки времени = высота календаря (список со скроллом). */
  const datetimeTimeColPx = ref<number | null>(null);
  let datetimeCalResizeObserver: ResizeObserver | null = null;
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

  /** Разбор `DD.MM.YYYY HH:mm` (время необязательно — тогда 00:00). */
  function parseRuDatetimeFull(s: string): { iso: string; hm: string } | null {
    const t = s.trim();
    if (!t) return null;
    const m =
      /^(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/.exec(t);
    if (!m) return null;
    const [, dd, mm, yyyy, gh, gmn] = m;
    const iso = `${yyyy}-${mm}-${dd}`;
    if (!isValidIsoDate(iso)) return null;
    if (gh === undefined || gmn === undefined) {
      return { iso, hm: '00:00' };
    }
    const h = Number(gh);
    const mn = Number(gmn);
    if (!Number.isFinite(h) || !Number.isFinite(mn)) return null;
    if (h < 0 || h > 23 || mn < 0 || mn > 59) return null;
    return {
      iso,
      hm: `${String(h).padStart(2, '0')}:${String(mn).padStart(2, '0')}`,
    };
  }

  function displayDatetimeFromIsoHm(iso: string, hm: string): string {
    const disp = displayFromIso(iso);
    if (!disp) return '';
    return `${disp} ${hm}`;
  }

  function canonicalRuDatetime(raw: string): string {
    const p = parseRuDatetimeFull(raw);
    if (!p) return '';
    return displayDatetimeFromIsoHm(p.iso, p.hm);
  }

  const TIME_SLOTS_15: string[] = (() => {
    const a: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 15, 30, 45]) {
        a.push(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        );
      }
    }
    return a;
  })();

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

  /** Дата + время из цифр: ДДММГГГГ затем ЧЧММ */
  function formatDigitsAsRuDatetime(raw: string): string {
    const digits = raw.replace(/\D/g, '').slice(0, 12);
    if (!digits) return '';
    const d8 = digits.slice(0, 8);
    let datePart = '';
    if (d8.length <= 2) datePart = d8;
    else if (d8.length <= 4)
      datePart = `${d8.slice(0, 2)}.${d8.slice(2)}`;
    else datePart = `${d8.slice(0, 2)}.${d8.slice(2, 4)}.${d8.slice(4)}`;
    if (digits.length <= 8) return datePart;
    const t4 = digits.slice(8, 12);
    if (t4.length <= 2) return `${datePart} ${t4}`;
    return `${datePart} ${t4.slice(0, 2)}:${t4.slice(2)}`;
  }

  const normalizedDatetimeValue = computed(() =>
    props.withTime ? canonicalRuDatetime(String(props.modelValue ?? '')) : ''
  );

  const activeTimeHm = computed(() => {
    if (!props.withTime) return '';
    const p = parseRuDatetimeFull(draft.value);
    return p?.hm ?? '';
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
      const str = String(value ?? '');
      if (props.withTime) {
        const p = parseRuDatetimeFull(str);
        if (!str.trim()) {
          draft.value = '';
          calendarValue.value = undefined;
        } else if (p) {
          draft.value = displayDatetimeFromIsoHm(p.iso, p.hm);
          try {
            calendarValue.value = parseDate(p.iso);
          } catch {
            calendarValue.value = undefined;
          }
        } else {
          draft.value = str;
          const isoOnly = isoFromRaw(str);
          calendarValue.value = isoOnly ? parseDate(isoOnly) : undefined;
        }
      } else {
        const iso = isoFromRaw(str);
        draft.value = iso ? displayFromIso(iso) : '';
        calendarValue.value = iso ? parseDate(iso) : undefined;
      }
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
    if (!draft.value.trim()) {
      emit('update:modelValue', '');
      return;
    }
    if (props.withTime) {
      const can = canonicalRuDatetime(draft.value);
      if (!can) {
        const fb = normalizedDatetimeValue.value;
        draft.value = fb || draft.value;
        return;
      }
      draft.value = can;
      emit('update:modelValue', can);
      return;
    }
    const iso = isoFromRaw(draft.value);
    if (!iso) {
      const fallbackIso = isoFromRaw(String(props.modelValue ?? ''));
      draft.value = fallbackIso ? displayFromIso(fallbackIso) : '';
      return;
    }
    draft.value = displayFromIso(iso);
    emit('update:modelValue', iso);
  }

  function onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    draft.value = props.withTime
      ? formatDigitsAsRuDatetime(el.value)
      : formatDigitsAsRuDate(el.value);
    nextTick(() => measureTextReserve());
  }

  function onBlur() {
    commitDraft();
  }

  /** Не открываем по focus — иначе автофокус диалога/формы сразу раскрывает календарь. */
  function onInputFocus() {
    nextTick(() => measureTextReserve());
  }

  function onInputClick() {
    if (props.disabled) return;
    open.value = true;
  }

  /** Открытие с клавиатуры без Enter — Enter оставлен для commit (onEnter). */
  function onInputKeydownOpen(e: KeyboardEvent) {
    if (props.disabled) return;
    if (e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      open.value = true;
    }
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

  function currentHmForDatetime(): string {
    const p = parseRuDatetimeFull(draft.value);
    if (p) return p.hm;
    return '00:00';
  }

  function onCalendarUpdate(date: DateValue) {
    if (!date) return;
    const iso = String(date.toString());
    calendarValue.value = date;
    if (props.withTime) {
      const hm = currentHmForDatetime();
      const next = displayDatetimeFromIsoHm(iso, hm);
      draft.value = next;
      emit('update:modelValue', next);
      return;
    }
    draft.value = displayFromIso(iso);
    emit('update:modelValue', iso);
    open.value = false;
  }

  function onTimeSlotPick(hm: string) {
    if (!props.withTime) return;
    let iso: string | null = null;
    try {
      if (calendarValue.value) {
        iso = String(calendarValue.value.toString());
      }
    } catch {
      /* */
    }
    if (!iso) {
      const p = parseRuDatetimeFull(draft.value);
      iso = p?.iso ?? null;
    }
    if (!iso || !isValidIsoDate(iso)) {
      try {
        const td = today(getLocalTimeZone());
        iso = String(td.toString());
        calendarValue.value = td;
      } catch {
        return;
      }
    }
    const next = displayDatetimeFromIsoHm(iso, hm);
    draft.value = next;
    emit('update:modelValue', next);
    open.value = false;
  }

  function updatePanelPosition() {
    if (!open.value || !rootRef.value) return;
    const anchor = rootRef.value.getBoundingClientRect();
    const panel = panelRef.value;
    const measuredW = panel?.offsetWidth ?? 0;
    const measuredH = panel?.offsetHeight ?? 0;
    const panelWidth = measuredW > 0 ? measuredW : 320;
    const panelHeight = measuredH > 0 ? measuredH : 360;
    const gap = 6;
    const margin = 8;
    const vh = window.innerHeight;
    const vw = window.innerWidth;

    let left = anchor.right - panelWidth;
    left = Math.max(margin, Math.min(left, vw - panelWidth - margin));

    const belowTop = anchor.bottom + gap;
    const aboveTop = anchor.top - panelHeight - gap;
    const fitsBelow = belowTop + panelHeight <= vh - margin;
    const fitsAbove = aboveTop >= margin;

    let top: number;
    if (fitsBelow) {
      top = belowTop;
    } else if (fitsAbove) {
      top = aboveTop;
    } else {
      const roomBelow = vh - margin - belowTop;
      const roomAbove = anchor.top - margin - gap;
      if (roomBelow >= roomAbove) {
        top = Math.min(belowTop, vh - margin - panelHeight);
      } else {
        top = Math.max(margin, aboveTop);
      }
      top = Math.max(margin, Math.min(top, vh - margin - panelHeight));
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

  function syncDatetimeTimeColumnHeight() {
    if (!props.withTime) return;
    const wrap = calWrapRef.value;
    if (!wrap) return;
    const h = Math.ceil(wrap.getBoundingClientRect().height);
    if (h > 0) datetimeTimeColPx.value = h;
  }

  function unbindDatetimeCalObserver() {
    datetimeCalResizeObserver?.disconnect();
    datetimeCalResizeObserver = null;
  }

  function bindDatetimeCalObserver() {
    if (!props.withTime) return;
    unbindDatetimeCalObserver();
    const el = calWrapRef.value;
    if (!el || typeof ResizeObserver === 'undefined') return;
    datetimeCalResizeObserver = new ResizeObserver(() => {
      syncDatetimeTimeColumnHeight();
      requestAnimationFrame(() => updatePanelPosition());
    });
    datetimeCalResizeObserver.observe(el);
    syncDatetimeTimeColumnHeight();
  }

  const datetimeTimeColStyle = computed(() => {
    if (!props.withTime) return {} as Record<string, string>;
    const h = datetimeTimeColPx.value;
    if (h == null || h < 1) return { minHeight: '0' };
    return {
      height: `${h}px`,
      maxHeight: `${h}px`,
      minHeight: '0',
    };
  });

  function scrollActiveTimeIntoView() {
    if (!props.withTime) return;
    const active = timeListRef.value?.querySelector<HTMLElement>(
      '[data-time-active="true"]'
    );
    active?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  watch(open, async isOpen => {
    if (isOpen) {
      await nextTick();
      updatePanelPosition();
      bindFloatingListeners();
      if (props.withTime) {
        await nextTick();
        bindDatetimeCalObserver();
        requestAnimationFrame(() => {
          syncDatetimeTimeColumnHeight();
          updatePanelPosition();
          requestAnimationFrame(() => {
            syncDatetimeTimeColumnHeight();
            updatePanelPosition();
            scrollActiveTimeIntoView();
          });
        });
      } else {
        requestAnimationFrame(() => {
          updatePanelPosition();
          requestAnimationFrame(() => updatePanelPosition());
        });
      }
    } else {
      unbindFloatingListeners();
      unbindDatetimeCalObserver();
      datetimeTimeColPx.value = null;
    }
  });

  function onDocClick(e: MouseEvent) {
    if (!open.value) return;

    const target = e.target as Node | null;

    const path: EventTarget[] = e.composedPath ? e.composedPath() : [];
    const insideFloatingPlainDate = path.some(node => {
      if (!(node instanceof HTMLElement)) return false;
      return node.classList?.contains('plain-date-overlay');
    });
    if (insideFloatingPlainDate) return;

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
  onBeforeUnmount(() => unbindDatetimeCalObserver());
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
        :maxlength="withTime ? 16 : 10"
        :placeholder="placeholder"
        :disabled="disabled"
        class="plain-date-input border-0 bg-transparent p-0 text-right text-sm font-normal leading-normal text-space outline-none placeholder:text-bali disabled:cursor-not-allowed disabled:opacity-60"
        @input="onInput"
        @focus="onInputFocus"
        @click="onInputClick"
        @keydown="onInputKeydownOpen"
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
          class="plain-date-overlay fixed z-[10020]"
          :class="
            withTime
              ? 'plain-date-overlay--datetime flex w-auto max-w-[min(100vw-16px,380px)] items-start overflow-hidden rounded-[15px] bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)]'
              : 'w-[254px]'
          "
          :style="panelStyle"
          @click.stop
          @mousedown.stop
        >
          <div ref="calWrapRef" class="plain-date-datetime-cal-wrap shrink-0">
            <CalendarBarStatic
              class="plain-date-calendar"
              :model-value="calendarValue"
              elevate-select-popovers
              @date-click="onCalendarUpdate"
            />
          </div>
          <div
            v-if="withTime"
            class="plain-date-datetime-time-col flex min-h-0 w-[88px] shrink-0 flex-col overflow-hidden border-l border-athens bg-athens-gray"
            :style="datetimeTimeColStyle"
          >
            <div
              ref="timeListRef"
              class="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain"
              role="listbox"
              aria-label="Время"
            >
              <button
                v-for="slot in TIME_SLOTS_15"
                :key="slot"
                type="button"
                role="option"
                :data-time-active="slot === activeTimeHm ? 'true' : undefined"
                class="w-full border-0 border-b border-athens/80 bg-transparent px-2 py-2.5 text-left text-sm font-normal leading-normal text-space outline-none last:border-b-0 hover:bg-white/90 focus-visible:bg-white/90"
                :class="slot === activeTimeHm ? 'bg-white font-medium' : ''"
                @click="onTimeSlotPick(slot)"
              >
                {{ slot }}
              </button>
            </div>
          </div>
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

  /* Одна общая панель: без второй «карточки» у календаря */
  .plain-date-overlay--datetime :deep(.plain-date-calendar) {
    margin: 0 !important;
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
  }
  .plain-date-overlay:not(.plain-date-overlay--datetime)
    :deep(.plain-date-calendar.calendar-wrapper) {
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
