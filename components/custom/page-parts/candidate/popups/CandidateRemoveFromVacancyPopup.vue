<script setup lang="ts">
  import { unref } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import Button from '@/components/ui/button/Button.vue';

  import type { MaybeRef } from 'vue';
  import type { Candidate } from '@/types/candidates';
  import type { Vacancy } from '@/types/vacancy';

  const props = defineProps<{
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
    width="600px"
    :showCloseButton="false"
    :lgSize="false"
  >
    <div class="flex flex-col gap-y-35px">
      <div class="gap-y-10px flex flex-col">
        <h2 class="text-20px font-semibold leading-normal text-space">
          Удаление кандидата {{ candidate.surname }}
          {{ candidate.firstname }} из вакансии "{{ vacancyName }}".
        </h2>
        <p class="text-sm text-slate-custom">
          История работы с кандидатом и комментарии по этой вакансии будут
          удалены. Карточка кандидата останется в базе.
        </p>
      </div>
      <div class="flex gap-x-15px">
        <Button
          variant="destructive"
          class="px-20px py-11.5px font-medium"
          @click="emit('confirm')"
        >
          Открепить
        </Button>
        <Button
          variant="outline"
          class="px-20px py-11.5px font-medium"
          @click="emit('close')"
        >
          Отмена
        </Button>
      </div>
    </div>
  </Popup>
</template>
