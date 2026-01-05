<script setup lang="ts">
  import { ref, unref, computed, type MaybeRef } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import DynamicForm from '~/components/custom/DynamicForm.vue';
  import { getRefuseFormConfig } from '../../configs/refuseFormConfig';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
    candidateName?: string;
    vacancyName?: string;
  }>();

  const emit = defineEmits<{
    close: [];
    submit: [data: { sendEmail: boolean; subject?: string; body?: string }];
  }>();

  const formData = ref<Record<string, any>>({
    sendEmail: false,
    subject: 'Отказ',
    body: `<strong>Привет, ${props.candidateName}!</strong><br />
      К сожалению, мы не можем рассмотреть Вашу кандидатуру на вакансию "${props.vacancyName}".`,
  });

  const resetFormData = () => {
    formData.value = {
      sendEmail: false,
      subject: '',
      body: '',
    };
  };

  const refuseFormConfig = computed(() => {
    return getRefuseFormConfig(formData.value.sendEmail);
  });

  const handleCancel = () => {
    resetFormData();
    emit('close');
  };

  const handleSubmit = (data: Record<string, any>) => {
    emit('submit', {
      sendEmail: data.sendEmail || false,
      subject: data.subject,
      body: data.body,
    });
    resetFormData();
  };

  watch(
    () => unref(props.isOpen),
    isOpen => {
      if (isOpen) {
        formData.value = {
          sendEmail: false,
          subject: 'Отказ',
          body: `<strong>Привет, ${props.candidateName}!</strong><br />
      К сожалению, мы не можем рассмотреть Вашу кандидатуру на вакансию "${props.vacancyName}".`,
        };
      }
    }
  );
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="handleCancel"
    width="790px"
    :showCloseButton="false"
    :lgSize="false"
  >
    <div class="flex flex-col gap-y-25px">
      <h2 class="text-20px font-semibold leading-normal text-space">
        Изменение статуса резюме
      </h2>
      <div class="flex flex-col gap-y-15px">
        <p class="font-semibold leading-normal text-space">
          Перемещение на этап
        </p>
        <p class="w-[100%] rounded-ten bg-athens-gray px-11px py-15px">
          Отклонённые
        </p>
      </div>
      <DynamicForm
        v-model="formData"
        :config="refuseFormConfig"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </Popup>
</template>
