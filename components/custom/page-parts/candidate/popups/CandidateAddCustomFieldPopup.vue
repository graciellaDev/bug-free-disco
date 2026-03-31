<script setup lang="ts">
  import { ref, watch, unref, computed } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import Autocomplete from '~/components/custom/Autocomplete.vue';
  import PlainSingleSelectDropdown from '~/components/custom/PlainSingleSelectDropdown.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import type { MaybeRef } from 'vue';
  import {
    CUSTOM_FIELD_TYPE_LABELS,
    createLocalCandidateCustomField,
    fieldKindFromTypeLabel,
    parseOptionLines,
    type CandidateCustomFieldEditorKind,
    type LocalCandidateCustomField,
  } from '@/types/candidateLocalCustomFields';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
  }>();

  const emit = defineEmits<{
    close: [];
    submit: [field: LocalCandidateCustomField];
  }>();

  const nameDraft = ref('');
  const typeLabel = ref('');
  const optionsDraft = ref('');
  const formError = ref('');

  const needsOptions = computed(() => {
    const k = fieldKindFromTypeLabel(typeLabel.value || '');
    return k === 'list' || k === 'multilist';
  });

  watch(
    () => unref(props.isOpen),
    open => {
      if (open) {
        nameDraft.value = '';
        typeLabel.value = '';
        optionsDraft.value = '';
        formError.value = '';
      }
    }
  );

  function onCancel() {
    emit('close');
  }

  function onConfirm() {
    formError.value = '';
    const name = nameDraft.value.trim();
    if (name.length < 1) {
      formError.value = 'Укажите название поля';
      return;
    }
    const label = (typeLabel.value || '').trim();
    const kind: CandidateCustomFieldEditorKind | undefined =
      fieldKindFromTypeLabel(label);
    if (!kind) {
      formError.value = 'Выберите тип поля';
      return;
    }
    let optionLines: string[] = [];
    if (kind === 'list' || kind === 'multilist') {
      optionLines = parseOptionLines(optionsDraft.value);
      if (optionLines.length === 0) {
        formError.value =
          'Добавьте хотя бы один вариант списка (с новой строки)';
        return;
      }
    }
    emit(
      'submit',
      createLocalCandidateCustomField(name, kind, optionLines)
    );
    emit('close');
  }
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
    :allow-dropdown-overflow="true"
  >
    <div class="popup-delete-content flex flex-col gap-y-6">
      <h2 class="text-xl font-semibold text-space">
        Новое пользовательское поле
      </h2>
      <div class="flex flex-col gap-y-4">
        <!-- Как блок «Название» на странице вакансии (InfoTab) -->
        <div>
          <div class="mb-4 flex items-center gap-1">
            <p class="text-sm font-medium leading-normal text-space">
              Название поля
            </p>
          </div>
          <Autocomplete
            :source="[]"
            :model-value="nameDraft"
            placeholder="Например, номер договора"
            :show-search-icon="false"
            :maxlength="80"
            class="mb-11px"
            @update:model-value="nameDraft = $event"
          />
        </div>
        <!-- Плашка как у полей вакансии; список — PlainSingleSelect (✓, без чекбоксов) -->
        <div>
          <p class="mb-3.5 text-sm font-medium text-space">
            Тип поля
          </p>
          <div
            class="add-cf-type-select flex min-h-10 items-center rounded-ten border border-athens bg-athens-gray px-15px"
          >
            <PlainSingleSelectDropdown
              v-model="typeLabel"
              :options="CUSTOM_FIELD_TYPE_LABELS"
              placeholder="Выбрать"
              :show-placeholder-in-menu="false"
            />
          </div>
        </div>
        <div v-if="needsOptions">
          <p class="mb-3.5 text-sm font-medium text-space">
            Варианты списка (каждый с новой строки)
          </p>
          <MyTextarea
            v-model="optionsDraft"
            placeholder="Значение 1&#10;Значение 2"
            :maxHeight="160"
            textarea-class="text-sm"
          />
        </div>
        <p v-if="formError" class="text-sm font-normal text-[#ef4444]">
          {{ formError }}
        </p>
      </div>
      <div class="flex gap-x-3">
        <button
          type="button"
          class="p-semi-btn inline-flex h-fit items-center justify-center gap-2 whitespace-nowrap rounded-md rounded-ten bg-dodger text-sm font-semibold leading-normal text-white transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @click="onConfirm"
        >
          Добавить
        </button>
        <button
          type="button"
          class="p-border-semi-btn inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md rounded-ten border border-athens bg-athens-gray text-sm font-medium leading-normal text-slate-custom transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          @click="onCancel"
        >
          Отмена
        </button>
      </div>
    </div>
  </Popup>
</template>

<style scoped>
  .add-cf-type-select :deep(.relative.inline-flex) {
    width: 100%;
    max-width: 100%;
    justify-content: flex-start;
    text-align: left;
  }
  .add-cf-type-select :deep(button[type='button']) {
    min-height: 2.5rem;
    width: 100%;
    justify-content: space-between;
    text-align: left;
    transform: none;
    align-items: center;
  }
  .add-cf-type-select :deep(.plain-select-panel) {
    left: 0;
    right: 0;
    width: 100%;
    min-width: 100%;
    max-width: min(100vw - 32px, 420px);
  }
</style>
