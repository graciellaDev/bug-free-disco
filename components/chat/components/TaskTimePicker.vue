<template>
  <div ref="rootRef" class="task-time-picker relative">
    <button
      type="button"
      :class="[
        'flex items-center justify-between gap-1 rounded-ten border border-athens text-left text-sm font-normal text-[#2F353D] outline-none transition-colors focus:border-dodger',
        compact
          ? 'h-7 min-h-7 min-w-[70px] bg-white px-2 py-1 hover:bg-athens-gray/50'
          : 'h-10 min-w-[90px] bg-athens-gray px-3 py-2 hover:bg-athens-gray/90',
      ]"
      @click="open = !open"
    >
      <span class="truncate">{{ modelValue || '--:--' }}</span>
      <svg-icon
        name="dropdown-arrow"
        width="14"
        height="14"
        class="shrink-0 transition-transform text-bali"
        :class="{ 'rotate-180': open, 'text-dodger': open }"
      />
    </button>
    <Transition name="slide-fade">
      <div
        v-if="open"
        class="absolute left-0 top-full z-20 mt-1 max-h-48 min-w-[80px] overflow-y-auto rounded-ten border border-athens bg-white shadow-shadow-droplist py-1"
        @click.stop
      >
        <button
          v-for="t in timeOptions"
          :key="t"
          type="button"
          class="w-full px-2.5 py-1.5 text-left text-sm font-normal text-[#2F353D] hover:bg-athens-gray transition-colors first:rounded-t-[6px] last:rounded-b-[6px]"
          :class="{ 'bg-zumthor text-dodger': modelValue === t }"
          @click="selectTime(t)"
        >
          {{ t }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';

  const props = withDefaults(
    defineProps<{
      modelValue: string;
      /** Компактный вид — в одну строку с датой, тот же стиль */
      compact?: boolean;
      /** Шаг времени в минутах (по умолчанию 15) */
      stepMinutes?: number;
    }>(),
    { compact: false, stepMinutes: 15 }
  );

  const emit = defineEmits<{
    'update:modelValue': [value: string];
  }>();

  const open = ref(false);
  const rootRef = ref<HTMLElement | null>(null);

  const timeOptions = computed(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += props.stepMinutes) {
        options.push(
          `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
        );
      }
    }
    return options;
  });

  function selectTime(time: string) {
    emit('update:modelValue', time);
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
