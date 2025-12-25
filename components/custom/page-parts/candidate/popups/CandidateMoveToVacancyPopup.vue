<script setup lang="ts">
  import { ref, unref, watch } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import Button from '@/components/ui/button/Button.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import { getVacancies } from '@/src/api/vacancies';
  import type { MaybeRef } from 'vue';
  import type { Candidate } from '@/types/candidates';
  import type { Vacancy } from '@/types/vacancy';

  const props = defineProps<{
    isOpen: MaybeRef<boolean>;
    candidate: Candidate;
  }>();

  const emit = defineEmits<{
    close: [];
    confirm: [vacancyId: number];
  }>();

  const selectedVacancyId = ref<number | null>(null);
  const vacancies = ref<Vacancy[]>([]);
  const loading = ref(false);

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
      console.error('Ошибка при загрузке вакансий:', error);
    } finally {
      loading.value = false;
    }
  };

  // Загрузка при открытии попапа
  watch(
    () => unref(props.isOpen),
    isOpen => {
      if (isOpen) {
        selectedVacancyId.value = null;
        loadVacancies();
      }
    }
  );

  // Подтверждение перемещения
  const handleConfirm = () => {
    if (selectedVacancyId.value) {
      emit('confirm', selectedVacancyId.value);
    }
  };

  // Отмена
  const handleCancel = () => {
    selectedVacancyId.value = null;
    emit('close');
  };
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="handleCancel"
    width="790px"
    :showCloseButton="false"
    :lgSize="true"
    :maxHeightValue="'90px'"
    :allowDropdownOverflow="true"
    :disableOverflowHidden="true"
  >
    <div class="gap-y-35px">
      <h2 class="mb-10px text-20px font-semibold leading-normal text-space">
        Переместить кандидата
      </h2>
      <p class="mb-25px text-sm text-slate-custom">
        Вы собираетесь перенести кандидата
        <strong>{{ candidate.surname }} {{ candidate.firstname }}</strong>
        в другую вакансию.
      </p>

      <div class="mb-25px">
        <MyDropdown
          v-if="!loading"
          :options="
            vacancies.map(v => ({
              name: v.name || v.title || 'Без названия',
              value: v.id,
            }))
          "
          :modelValue="selectedVacancyId"
          placeholder="Выберите вакансию"
          @update:modelValue="selectedVacancyId = $event"
        />
        <div v-else class="py-4 text-center">
          <UiDotsLoader />
        </div>
      </div>

      <div class="flex gap-x-15px">
        <Button
          variant="action"
          size="action"
          class="px-20px py-11.5px font-medium"
          :disabled="!selectedVacancyId || loading"
          @click="handleConfirm"
        >
          Переместить
        </Button>
        <Button
          variant="outline"
          class="px-20px py-11.5px font-medium"
          @click="handleCancel"
        >
          Отмена
        </Button>
      </div>
    </div>
  </Popup>
</template>
