<script setup lang="ts">
  import { unref } from 'vue';
  import Popup from '~/components/custom/Popup.vue';

  import type { MaybeRef } from 'vue';
  import type { Candidate } from '@/types/candidates';

  defineProps<{
    isOpen: MaybeRef<boolean>;
    candidate: Candidate;
    vacancyName: string;
  }>();

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
    :noScrollbarGutter="true"
  >
    <div class="popup-delete-content flex flex-col gap-y-6">
      <h2 class="text-xl font-semibold text-space">
        Подтверждение открепления
      </h2>
      <p class="text-sm text-slate-custom">
        Вы открепляете кандидата
        <strong>{{ candidate.surname }} {{ candidate.firstname }}</strong>
        от вакансии «<strong>{{ vacancyName }}</strong>». История работы с
        кандидатом и комментарии по этой вакансии будут удалены. Карточка
        кандидата останется в базе.
      </p>
      <div class="flex gap-x-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-red-500 hover:bg-red-600 text-white p-semi-btn text-sm rounded-ten leading-normal h-fit font-semibold"
          @click="emit('confirm')"
        >
          Открепить
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
