<template>
  <div class="task-form-panel" :class="$attrs.class">
    <!-- Поле ввода текста задачи -->
    <div class="mb-3">
      <textarea
        ref="descriptionRef"
        v-model="localDescription"
        class="placeholder-styled min-h-[100px] w-full resize-y rounded-ten border border-athens bg-white px-3 py-2.5 text-sm text-space outline-none placeholder:text-[#b0b8c4] focus:border-dodger"
        placeholder="Введите текст задачи..."
        rows="4"
      />
    </div>

    <!-- Кнопки -->
    <div class="flex items-center gap-2">
      <UiButton
        variant="action"
        size="action"
        class="font-semibold"
        :disabled="!localDescription.trim()"
        @click="emit('submit')"
      >
        {{ submitLabel }}
      </UiButton>
      <button
        type="button"
        class="text-sm font-normal text-slate-custom hover:text-space"
        @click="emit('cancel')"
      >
        Отменить
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue';
  import UiButton from '@/components/ui/button/Button.vue';

  export interface TaskManager {
    id: number;
    name: string;
    email?: string;
    role?: string;
  }

  const props = withDefaults(
    defineProps<{
      date?: string;
      description?: string;
      submitLabel?: string;
    }>(),
    {
      date: '',
      description: '',
      submitLabel: 'Поставить',
    }
  );

  const emit = defineEmits<{
    'update:date': [value: string];
    'update:description': [value: string];
    submit: [];
    cancel: [];
  }>();

  const localDate = ref(props.date);
  const localDescription = ref(props.description);
  const descriptionRef = ref<HTMLTextAreaElement | null>(null);

  watch(
    () => [props.date, props.description],
    ([date, desc]) => {
      localDate.value = (date as string) ?? '';
      localDescription.value = (desc as string) ?? '';
    }
  );

  watch(localDate, v => emit('update:date', v));
  watch(localDescription, v => emit('update:description', v));

  defineExpose({
    focusDescription: () => descriptionRef.value?.focus(),
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
