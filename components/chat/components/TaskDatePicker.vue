<template>
  <div ref="rootRef" class="task-date-picker relative">
    <button
      type="button"
      :class="[
        'flex items-center justify-between gap-1 rounded-ten border border-athens text-left text-sm font-normal text-[#2F353D] outline-none transition-colors focus:border-dodger',
        compact
          ? 'h-7 min-h-7 min-w-[80px] bg-white px-2 py-1 hover:bg-athens-gray/50'
          : 'h-10 min-w-[100px] bg-athens-gray px-3 py-2 hover:bg-athens-gray/90',
      ]"
      @click="open = !open"
    >
      <span class="truncate">{{ displayDate }}</span>
      <svg-icon
        :name="open ? 'calendar-end' : 'calendar-start'"
        :class="open ? 'text-dodger' : 'text-bali'"
        :width="compact ? 14 : 18"
        :height="compact ? 14 : 18"
        class="shrink-0"
      />
    </button>
    <Transition name="slide-fade">
      <div
        v-if="open"
        class="absolute left-0 top-full z-20 mt-1"
        @click.stop
      >
        <CalendarBarStatic
          :model-value="parsedPlaceholder"
          :compact="true"
          @date-click="onDateClick"
          @dblclick="open = false"
        />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import { parseDate, type DateValue } from '@internationalized/date';
  import CalendarBarStatic from '@/components/custom/CalendarBarStatic.vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      /** Компактный вид — в одну строку с «Задача», тот же размер шрифта */
      compact?: boolean;
    }>(),
    { compact: false }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);

  const displayDate = computed(() => {
    if (!props.modelValue) return 'Выберите дату';
    const [y, m, d] = props.modelValue.split('-').map(Number);
    if (!y || !m || !d) return props.modelValue;
    const today = new Date();
    if (today.getFullYear() === y && today.getMonth() + 1 === m && today.getDate() === d) {
      return 'Сегодня';
    }
    const day = String(d).padStart(2, '0');
    const month = String(m).padStart(2, '0');
    return `${day}.${month}.${y}`;
  });

  const parsedPlaceholder = computed(() => {
    if (!props.modelValue) return undefined;
    try {
      return parseDate(props.modelValue);
    } catch {
      return undefined;
    }
  });

  function onDateClick(date: DateValue) {
    emit('update:modelValue', date.toString());
    open.value = false;
  }

  function handleClickOutside(e: MouseEvent) {
    if (rootRef.value && !rootRef.value.contains(e.target as Node)) {
      open.value = false;
    }
  }

  onMounted(() => {
    document.addEventListener('click', handleClickOutside);
  });

  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside);
  });
</script>

<style scoped>
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.15s ease-out;
  }
  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
