<template>
  <div class="cursor-pointer w-full relative" ref="rootRef">
    <div
      class="dropdown-selected-option relative flex items-center rounded-ten min-h-10 py-9px pr-30px pl-15px bg-athens-gray text-sm font-normal text-[#2F353D] transition-colors"
      :class="[
        { 'bg-athens-gray': !isError },
        { 'border-red-custom': isError },
        isDropDownVisible && !isError ? 'border border-[#5898ff]' : 'border border-athens',
      ]"
      @click="toggleDropdown"
    >
      <span v-if="displayText" class="text-space">{{ displayText }}</span>
      <span v-else class="color-gray text-sm font-normal">Выберите период</span>
      <!-- Крестик сброса при выбранном периоде -->
      <div
        v-show="displayText"
        class="dropdown-cross absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded hover:bg-athens transition-colors"
        @click.stop="clearPeriod"
      >
        <svg-icon name="dropdown-cross" width="20" height="20" class="text-dodger" />
      </div>
      <!-- Иконка календаря, когда период не выбран -->
      <div v-show="!displayText" class="absolute right-3.5 top-1/2 -translate-y-1/2">
        <svg-icon
          :name="isDropDownVisible ? 'calendar-end' : 'calendar-start'"
          :class="isDropDownVisible ? 'text-dodger' : 'text-bali'"
          width="20"
          height="20"
        />
      </div>
    </div>
    <transition name="slide-fade">
      <div
        v-if="isDropDownVisible"
        ref="calendarWrapper"
        class="calendare-wrapper absolute z-50 right-0 top-[54px] w-max"
      >
        <CalendarBarStatic
          ref="calendarBarRef"
          @dateClick="onDateSelect"
          @dblclick="isDropDownVisible = false"
          class="calendar-wrapper"
        />
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import CalendarBarStatic from '@/components/custom/CalendarBarStatic.vue';
import { dateStringToDots } from '@/helpers/date';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({ from: null, to: null }),
  },
});

const emit = defineEmits(['update:modelValue']);

const rootRef = ref(null);
const calendarWrapper = ref(null);
const calendarBarRef = ref(null);
const isDropDownVisible = ref(false);
const isError = ref(false);

const rangeFrom = ref(props.modelValue?.from ?? null);
const rangeTo = ref(props.modelValue?.to ?? null);

const displayText = computed(() => {
  if (rangeFrom.value && rangeTo.value) {
    return `${rangeFrom.value} — ${rangeTo.value}`;
  }
  if (rangeFrom.value) return rangeFrom.value;
  if (rangeTo.value) return rangeTo.value;
  return '';
});

function parseDmY(str) {
  if (!str) return null;
  const parts = String(str).trim().split('.');
  if (parts.length !== 3) return null;
  const [d, m, y] = parts.map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d).getTime();
}

function onDateSelect(dateValue) {
  const formatted = dateStringToDots(dateValue.toString());
  if (!rangeFrom.value) {
    rangeFrom.value = formatted;
    rangeTo.value = null;
    return;
  }
  if (!rangeTo.value) {
    const t1 = parseDmY(rangeFrom.value);
    const t2 = parseDmY(formatted);
    if (t1 != null && t2 != null && t2 < t1) {
      rangeTo.value = rangeFrom.value;
      rangeFrom.value = formatted;
    } else {
      rangeTo.value = formatted;
    }
    emit('update:modelValue', { from: rangeFrom.value, to: rangeTo.value });
    isDropDownVisible.value = false;
    return;
  }
  rangeFrom.value = formatted;
  rangeTo.value = null;
}

function toggleDropdown() {
  isDropDownVisible.value = !isDropDownVisible.value;
  if (!isDropDownVisible.value && rangeFrom.value && !rangeTo.value) {
    rangeTo.value = rangeFrom.value;
    emit('update:modelValue', { from: rangeFrom.value, to: rangeTo.value });
  }
}

function clearPeriod() {
  rangeFrom.value = null;
  rangeTo.value = null;
  emit('update:modelValue', { from: null, to: null });
}

function handleClickOutside(event) {
  if (!isDropDownVisible.value) return;
  const path = event.composedPath ? event.composedPath() : [event.target];

  // Выпадающие списки месяца/года рендерятся через портал — клик может прийти с document/html
  const isInsideSelectOrPortal = (() => {
    if (event.target === document.documentElement || event.target === document || event.target === window) {
      if (document.querySelector('[role="presentation"]')) return true;
      for (const el of path) {
        if (!el || !(el instanceof Node)) continue;
        if (el === document.documentElement || el === document || el === window) continue;
        const role = el.getAttribute?.('role');
        if (role === 'listbox' || role === 'option' || role === 'presentation') return true;
        if (el.closest?.('[role="listbox"]') || el.closest?.('[role="presentation"]')) return true;
      }
      return false;
    }
    return path.some((el) => {
      if (!el || !(el instanceof Node)) return false;
      if (el === document.documentElement || el === document || el === window) return false;
      const role = el.getAttribute?.('role');
      if (role === 'listbox' || role === 'option' || role === 'presentation') return true;
      return !!el.closest?.('[role="listbox"]') || !!el.closest?.('[role="presentation"]');
    });
  })();

  const isInsideCalendar = path.some((el) => {
    if (!el || !(el instanceof Node)) return false;
    if (el === document.documentElement || el === document || el === window) return false;
    if (rootRef.value?.contains(el)) return true;
    if (calendarWrapper.value?.contains(el)) return true;
    if (calendarBarRef.value?.$el?.contains(el)) return true;
    return !!el.closest?.('.calendar-wrapper') || !!el.closest?.('.header-handler') || !!el.closest?.('.select-month-custom');
  });

  const clickedInside = isInsideSelectOrPortal || isInsideCalendar;
  if (!clickedInside) {
    isDropDownVisible.value = false;
    if (rangeFrom.value && !rangeTo.value) {
      rangeTo.value = rangeFrom.value;
      emit('update:modelValue', { from: rangeFrom.value, to: rangeTo.value });
    }
  }
}

watch(
  () => props.modelValue,
  (v) => {
    rangeFrom.value = v?.from ?? null;
    rangeTo.value = v?.to ?? null;
  },
  { immediate: true }
);

onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-4px);
  opacity: 0;
}

.color-gray {
  color: #9098b4;
}
</style>
