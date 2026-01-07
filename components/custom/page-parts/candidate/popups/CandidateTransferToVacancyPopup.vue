<script setup lang="ts">
  import { ref, unref, watch } from 'vue';
  import Popup from '~/components/custom/Popup.vue';
  import Button from '@/components/ui/button/Button.vue';
  import MyDropdown from '~/components/custom/MyDropdown.vue';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import { getVacancies, getVacancyName } from '@/src/api/vacancies';
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
  const vacancies = ref<Vacancy[]>([]);
  const loading = ref(false);
  const vacancyName = ref<string>('');

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
    emit('close');
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

  onMounted(async () => {
    if (props.candidate && props.candidate.vacancy_id)
      vacancyName.value = await getVacancyName(props.candidate.vacancy_id);
  });
</script>

<template>
  <Popup
    :isOpen="unref(isOpen)"
    @close="handleCancel"
    width="790px"
    :showCloseButton="false"
    :lgSize="false"
    :allowDropdownOverflow="true"
    :disableOverflowHidden="true"
  >
    <div v-if="!loading" class="flex flex-col gap-y-35px text-sm">
      <div class="gap-y-10px flex flex-col">
        <h2
          v-if="mode === 'copy'"
          class="text-20px font-semibold leading-normal text-space"
        >
          Копировать кандидата
        </h2>
        <h2 v-else class="text-20px font-semibold leading-normal text-space">
          Переместить кандидата
        </h2>
        <p v-if="mode === 'copy'" class="text-slate-custom">
          Вы собираетесь скопировать кандидата
          <strong>{{ candidate.surname }} {{ candidate.firstname }}</strong>
          в другую вакансию.
        </p>
        <p v-else class="text-slate-custom">
          Вы собираетесь перенести кандидата
          <strong>{{ candidate.surname }} {{ candidate.firstname }}</strong>
          в другую вакансию.
        </p>
      </div>
      <div class="flex flex-col gap-y-15px text-black">
        <p class="font-medium">Кандидат</p>
        <p class="w-[100%] rounded-ten bg-athens-gray px-11px py-15px">
          {{ candidate.surname }} {{ candidate.firstname }}
        </p>
      </div>
      <div class="mb-35px flex gap-x-15px text-black">
        <div class="flex w-[50%] flex-col gap-y-15px">
          <p class="font-medium">Из вакансии</p>
          <p class="w-[100%] rounded-ten bg-athens-gray px-11px py-10px">
            {{ vacancyName ? vacancyName : 'Вакансия не определена' }}
          </p>
        </div>
        <div class="flex w-[50%] flex-col gap-y-15px">
          <p class="font-medium">В вакансию</p>
          <MyDropdown
            :options="
              vacancies.map(v => ({
                name: v.name || v.title || 'Без названия',
                value: v.id,
              }))
            "
            :modelValue="selectedVacancyId"
            placeholder="Выберите вакансию"
            @update:modelValue="selectedVacancyId = $event"
            class="z-1000"
          />
        </div>
      </div>
      <div class="flex gap-x-15px">
        <Button
          v-if="mode === 'copy'"
          variant="action"
          size="action"
          class="px-20px py-11.5px font-medium"
          :disabled="!selectedVacancyId || loading"
          @click="handleConfirm"
        >
          Копировать
        </Button>
        <Button
          v-else
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
    <div v-else class="py-4 text-center">
      <UiDotsLoader />
    </div>
  </Popup>
</template>
