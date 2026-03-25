<script setup lang="ts">
  import { ref, unref, watch, computed } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import ResponseInput from '~/components/custom/ResponseInput.vue';
  import { getVacancies } from '@/src/api/vacancies';
  import type { MaybeRef } from 'vue';
  import type { Candidate } from '@/types/candidates';
  import type { Vacancy, TransferMode } from '@/types/vacancy';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
    candidate: Candidate;
    mode?: TransferMode;
  }>();

  const emit = defineEmits<{
    close: [];
    confirm: [vacancyId: number];
  }>();

  const selectedVacancyId = ref<number | null>(null);
  /** Текст в поле — как в ResponseInput на вкладке «Основная информация» (Отдел) */
  const selectedVacancyLabel = ref('');
  const vacancies = ref<Vacancy[]>([]);
  const loading = ref(false);

  /** Формат как у отделов: name + role (вторая строка в списке) */
  const vacancyResponseOptions = computed(() =>
    vacancies.value
      .filter((v): v is Vacancy & { id: number } => v.id != null)
      .map(v => {
        const name = v.name || v.title || 'Без названия';
        const place = [v.city, v.location].filter(Boolean).join(' · ');
        const role = place || (v.code != null && String(v.code).trim() !== '' ? `Код ${v.code}` : name);
        return { id: v.id, name, role };
      })
  );

  const onVacancyResponseUpdate = (
    name: string | null,
    id?: number | null
  ) => {
    selectedVacancyLabel.value = name ?? '';
    if (id != null && typeof id === 'number') {
      selectedVacancyId.value = id;
    } else {
      selectedVacancyId.value = null;
    }
  };

  // Загрузка списка вакансий
  const loadVacancies = async () => {
    loading.value = true;
    try {
      const vacanciesList = await getVacancies();
      if (vacanciesList) {
        // Исключаем текущую вакансию кандидата (если есть)
        vacancies.value = vacanciesList.filter(
          v => v.id !== props.candidate.vacancy_id
        );
      }
    } catch (error) {
      console.error('[loadVacancies] Ошибка при загрузке вакансий:', error);
    } finally {
      loading.value = false;
    }
  };

  // Подтверждение перемещения
  const handleConfirm = () => {
    if (selectedVacancyId.value) {
      emit('confirm', selectedVacancyId.value);
    }
  };

  // Отмена
  const handleCancel = () => {
    selectedVacancyId.value = null;
    selectedVacancyLabel.value = '';
    emit('close');
  };

  // Загрузка при открытии попапа
  watch(
    () => unref(props.isOpen),
    isOpen => {
      if (isOpen) {
        selectedVacancyId.value = null;
        selectedVacancyLabel.value = '';
        loadVacancies();
      }
    },
    { immediate: true }
  );
</script>

<template>
  <Popup
    :is-open="props.isOpen"
    @close="handleCancel"
    width="490px"
    :show-close-button="false"
    :lg-size="true"
    :parent-rounded="true"
    :content-rounded="false"
    :content-padding="false"
    :allow-dropdown-overflow="true"
    :disable-overflow-hidden="true"
  >
    <div class="w-full">
      <div class="transfer-vacancy-popup flex flex-col gap-y-6 text-sm">
        <div class="flex flex-col gap-y-2">
          <h2
            v-if="mode === 'copy'"
            class="text-xl font-semibold text-space"
          >
            Копировать кандидата
          </h2>
          <h2 v-else class="text-xl font-semibold text-space">
            Переместить кандидата
          </h2>
          <p class="text-sm text-slate-custom">
            Выберите вакансию, куда нужно
            <span v-if="mode === 'copy'">скопировать</span>
            <span v-else>переместить</span>
            кандидата <strong>{{ candidate.surname }} {{ candidate.firstname }}</strong>.
          </p>
        </div>
        <div class="relative z-[40] flex w-full min-w-0 flex-col gap-y-3.5 text-space">
          <p class="text-sm font-medium text-space">Выберите вакансию</p>
          <ResponseInput
            class="w-full min-w-0"
            :responses="vacancyResponseOptions"
            :model-value="selectedVacancyLabel"
            :show-roles="true"
            not-found="Вакансия не найдена"
            placeholder="Название вакансии"
            @update:model-value="onVacancyResponseUpdate"
          />
        </div>
        <div class="relative z-0 flex flex-wrap gap-x-3 gap-y-2">
          <UiButton
            v-if="mode === 'copy'"
            variant="action"
            size="semiaction"
            :disabled="!selectedVacancyId || loading"
            @click="handleConfirm"
          >
            Копировать
          </UiButton>
          <UiButton
            v-else
            variant="action"
            size="semiaction"
            :disabled="!selectedVacancyId || loading"
            @click="handleConfirm"
          >
            Переместить
          </UiButton>
          <UiButton variant="back" size="second-back" @click="handleCancel">
            Отмена
          </UiButton>
        </div>
      </div>
    </div>
  </Popup>
</template>
