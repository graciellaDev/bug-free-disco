<script setup lang="ts">
  import { unref } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import DynamicForm from '~/components/custom/DynamicForm.vue';

  import { addCandidateFormConfig } from '../../configs/addCandidateFormConfig';
  import type { MaybeRef } from 'vue';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
    modelValue: Record<string, any>;
    serverErrors: Record<string, string>;
    loading: boolean;
    isSuccess?: boolean;
    successMessage?: string;
  }>();

  const emit = defineEmits<{
    close: [];
    submit: [data: Record<string, any>];
    cancel: [];
    'clear-error': [];
  }>();

  const handleCloseError = () => {
    emit('clear-error');
  };
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="emit('close')"
    width="490px"
    :showCloseButton="false"
    :disableOverflowHidden="true"
    :overflowContainer="true"
    maxHeight
    :lgSize="true"
  >
    <div class="gap-y-35px">
      <h2 class="mb-25px text-xl font-semibold leading-normal text-space">
        Новый кандидат
      </h2>

      <!-- Сообщение об успехе (опционально) -->
      <transition name="fade" v-if="isSuccess !== undefined">
        <div
          v-if="isSuccess"
          class="border-green-200 bg-green-50 text-green-700 mb-4 flex items-center gap-2 rounded-ten border p-4"
        >
          <svg
            class="h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clip-rule="evenodd"
            />
          </svg>
          <span>{{ successMessage }}</span>
        </div>
      </transition>

      <!-- Общая ошибка -->
      <transition name="fade">
        <div
          v-if="serverErrors._general"
          class="mb-4 flex items-start gap-2 rounded-ten border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <svg
            class="mt-0.5 h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd"
            />
          </svg>
          <div class="flex-1">
            <p class="font-medium">Ошибка</p>
            <p class="text-sm">{{ serverErrors._general }}</p>
          </div>
          <button
            @click="handleCloseError"
            class="ml-2 text-red-700 hover:text-red-900"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>
      </transition>

      <DynamicForm
        :config="addCandidateFormConfig"
        :model-value="modelValue"
        :server-errors="serverErrors"
        :loading="loading"
        @submit="emit('submit', $event)"
        @cancel="emit('cancel')"
      />
    </div>
  </Popup>
</template>
