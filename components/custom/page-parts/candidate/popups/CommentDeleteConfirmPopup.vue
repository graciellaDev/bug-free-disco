<script setup lang="ts">
  import { unref } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import type { MaybeRef } from 'vue';

  withDefaults(
    defineProps<{
      isOpen: MaybeRef<boolean>;
      /** Текст под заголовком (по умолчанию — про комментарий) */
      description?: string;
    }>(),
    { description: 'Комментарий будет удалён без возможности восстановления.' }
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
    <div class="popup-delete-content flex flex-col gap-y-6">
      <h2 class="text-xl font-semibold text-space">
        Подтверждение удаления
      </h2>
      <p class="text-sm text-slate-custom">
        {{ description }}
      </p>
      <div class="flex gap-x-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
          @click="emit('confirm')"
        >
          Удалить
        </button>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-athens-gray border border-athens text-slate-custom p-border-semi-btn text-sm rounded-ten leading-normal font-medium"
          @click="emit('close')"
        >
          Отмена
        </button>
      </div>
    </div>
  </Popup>
</template>
