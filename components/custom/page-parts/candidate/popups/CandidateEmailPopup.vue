<script setup lang="ts">
  import { unref, type MaybeRef } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import DynamicForm from '~/components/custom/DynamicForm.vue';
  import { emailToCandidateFormConfig } from '../../configs/emailToCandidateFormConfig';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
  }>();

  const emit = defineEmits<{
    close: [];
    submit: [data: Record<string, any>];
  }>();
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="emit('close')"
    width="790px"
    :showCloseButton="false"
    :lgSize="true"
  >
    <div class="gap-y-35px">
      <h2 class="mb-25px text-20px font-semibold leading-normal text-space">
        Письмо кандидату
      </h2>
      <DynamicForm
        :config="emailToCandidateFormConfig"
        @submit="emit('submit', $event)"
        @cancel="emit('close')"
      />
    </div>
  </Popup>
</template>
