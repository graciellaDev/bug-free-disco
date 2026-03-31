<script setup lang="ts">
  import { ref, unref, computed, watch, type MaybeRef } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import { getRejectionReasons } from '@/src/api/rejectionReasons';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
  }>();

  const emit = defineEmits<{
    close: [];
    submit: [
      data: {
        rejection_reason_id?: number;
        internal_comment?: string;
      },
    ];
  }>();

  const reasonsLoading = ref(false);
  const useRejectionReasons = ref(false);
  const reasonRows = ref<{ id: number; name: string }[]>([]);

  const rejectionReasonId = ref<number | null>(null);
  const internalComment = ref('');
  const localError = ref<string | null>(null);

  const dropdownOptions = computed(() =>
    reasonRows.value.map(r => ({ value: r.id, name: r.name }))
  );

  // Поле причины отказа должно быть доступно для заполнения,
  // когда в аккаунте включены причины отказа (на случай пустого справочника — будет ошибка валидации).
  const showReasonField = computed(() => useRejectionReasons.value);

  const reasonRequired = computed(() => showReasonField.value);

  const submitDisabled = computed(() => {
    if (reasonsLoading.value) return true;
    return (
      reasonRequired.value &&
      (rejectionReasonId.value == null || Number.isNaN(rejectionReasonId.value))
    );
  });

  async function loadRejectionSettings() {
    reasonsLoading.value = true;
    try {
      const res = await getRejectionReasons();
      const payload = res.data;
      useRejectionReasons.value = payload?.use_rejection_reasons ?? false;
      reasonRows.value = Array.isArray(payload?.reasons) ? payload.reasons : [];
    } catch {
      useRejectionReasons.value = false;
      reasonRows.value = [];
    } finally {
      reasonsLoading.value = false;
    }
  }

  function reset() {
    rejectionReasonId.value = null;
    internalComment.value = '';
    localError.value = null;
  }

  function handleCancel() {
    reset();
    emit('close');
  }

  function handleSubmit() {
    localError.value = null;
    if (
      reasonRequired.value &&
      (rejectionReasonId.value == null || Number.isNaN(rejectionReasonId.value))
    ) {
      localError.value = 'Выберите причину отказа';
      return;
    }
    const rid =
      rejectionReasonId.value != null && !Number.isNaN(rejectionReasonId.value)
        ? rejectionReasonId.value
        : undefined;
    emit('submit', {
      rejection_reason_id: rid,
      internal_comment: internalComment.value.trim() || undefined,
    });
    reset();
    emit('close');
  }

  watch(rejectionReasonId, () => {
    if (rejectionReasonId.value != null) {
      localError.value = null;
    }
  });

  watch(
    () => unref(props.isOpen),
    isOpen => {
      if (isOpen) {
        reset();
        void loadRejectionSettings();
      }
    },
    { immediate: true }
  );
</script>

<template>
  <Popup
    :is-open="props.isOpen"
    width="490px"
    :show-close-button="false"
    :lg-size="true"
    :parent-rounded="true"
    :content-rounded="false"
    :content-padding="false"
    :allow-dropdown-overflow="true"
    :disable-overflow-hidden="true"
    @close="handleCancel"
  >
    <div class="w-full">
      <div class="transfer-vacancy-popup flex flex-col gap-y-6 text-sm">
        <div class="flex flex-col gap-y-2">
          <h2 class="text-xl font-semibold text-space">
            Отказ кандидата
          </h2>
          <p class="text-sm text-slate-custom">
            Укажите причину и при необходимости внутренний комментарий для команды.
          </p>
        </div>

        <div
          class="relative z-[40] flex w-full min-w-0 flex-col gap-y-3.5 text-space"
        >
          <template v-if="showReasonField">
            <p class="text-sm font-medium text-space">
              <span class="text-red-custom">*</span>
              Причина отказа
            </p>
            <MyDropdown
              v-model="rejectionReasonId"
              :options="dropdownOptions"
              placeholder="Выберите"
              :error="!!localError"
              class="w-full min-w-0"
            />
            <span
              v-if="localError"
              class="mt-1 block text-xs text-red-500"
            >{{ localError }}</span>
          </template>

          <div>
            <p class="text-sm font-medium text-space">
              Внутренний комментарий по кандидату
            </p>
            <MyTextarea
              v-model="internalComment"
              placeholder="Виден только вашей команде"
              class="mt-1.5 w-full min-w-0"
            />
          </div>
        </div>

        <div class="relative z-0 flex flex-wrap gap-x-3 gap-y-2">
          <UiButton
            variant="action"
            size="semiaction"
            :disabled="submitDisabled"
            @click="handleSubmit"
          >
            Подтвердить
          </UiButton>
          <UiButton variant="back" size="second-back" @click="handleCancel">
            Отмена
          </UiButton>
        </div>
      </div>
    </div>
  </Popup>
</template>
