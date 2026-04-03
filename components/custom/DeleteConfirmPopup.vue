<script setup lang="ts">
  import { unref } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import type { MaybeRef } from 'vue';

  const props = withDefaults(
    defineProps<{
      isOpen: MaybeRef<boolean>;
      /** Заголовок окна */
      title?: string;
      /** Текст описания (можно передать слот default вместо пропа) */
      description?: string;
      /** Подпись кнопки подтверждения */
      confirmLabel?: string;
      /** Подпись кнопки отмены */
      cancelLabel?: string;
      /** Кнопка подтверждения в состоянии загрузки */
      loading?: boolean;
      /** Текст на кнопке при loading (по умолчанию «Удаление...») */
      loadingLabel?: string;
    }>(),
    {
      title: 'Подтверждение удаления',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      loading: false,
      loadingLabel: 'Удаление...',
    }
  );

  const emit = defineEmits<{
    close: [];
    confirm: [];
  }>();
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="emit('close')"
    width="490px"
    :showCloseButton="false"
    :lgSize="true"
    :parentRounded="true"
    :contentRounded="false"
    :contentPadding="false"
  >
    <div class="delete-confirm-popup__content flex flex-col gap-y-6">
      <h2 class="text-xl font-semibold text-space">
        {{ title }}
      </h2>
      <p v-if="$slots.default" class="text-sm text-slate-custom">
        <slot />
      </p>
      <p v-else-if="description" class="text-sm text-slate-custom">
        {{ description }}
      </p>
      <div class="flex gap-x-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold disabled:opacity-60"
          :disabled="loading"
          @click="emit('confirm')"
        >
          {{ loading ? loadingLabel : confirmLabel }}
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
          @click="emit('close')"
        >
          {{ cancelLabel }}
        </button>
      </div>
    </div>
  </Popup>
</template>

<style scoped>
  .delete-confirm-popup__content {
    padding: 0;
  }
</style>
