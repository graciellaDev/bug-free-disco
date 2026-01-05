<script lang="ts" setup>
  import { ref, onMounted, computed, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import CandidateList from '@/components/custom/page-parts/vacancy/CandidateList.vue';
  import BlockCandidateInfo from '@/components/custom/page-parts/candidate/BlockCandidateInfo.vue';
  import BlockCandidateTabsInfo from '@/components/custom/page-parts/candidate/BlockCandidateTabsInfo.vue';
  import CandidateAddPopup from '@/components/custom/page-parts/candidate/popups/CandidateAddPopup.vue';
  import { getVacancyById, getVacancies } from '@/src/api/vacancies';
  import { usePopup } from '@/composables/usePopup';
  import { useCandidateList } from '@/components/custom/page-parts/composables/useCandidateList';
  import { useCandidateAddForm } from '@/components/custom/page-parts/composables/useCandidateAddForm';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';

  import type { Vacancy } from '@/types/vacancy';
  import type { UserRole } from '@/types/roles';
  import type { Candidate } from '@/types/candidates';
  import type { FormConfig } from '@/types/form';
  import { getCandidateById } from '@/src/api/candidates';
  import type { Stage } from '@/types/funnels';
  import { getFunnelStages } from '@/src/api/funnels';

  const route = useRoute();
  const router = useRouter();
  const selectedStageId = ref<number | null>(null); // null = "Все"
  const vacancy = ref<Vacancy | null>(null);
  const vacancies = ref<Vacancy[] | null>(null);
  const selectedCandidate = ref<Candidate | null>(null);
  const isLoadingVacancy = ref(false);
  const isLoadingVacancies = ref(false);
  const isLoadingCandidate = ref(false);
  const isDropdownOpen = ref(false);
  const selected = ref<Record<number, boolean>>({});
  const allSelected = ref(false);
  const isActiveAll = ref(true);
  const stages = ref<Stage[] | []>([]);
  const userRole = ref<UserRole>('admin');

  // const vacancyFilter = computed(() => {
  //   if (!vacancy.value?.id) return {};
  //   return { vacancy_id: vacancy.value.id };
  // });

  const candidateFilter = computed(() => {
    const filter: Record<string, any> = {};

    if (vacancy.value?.id) {
      filter.vacancy_id = vacancy.value.id;
    }

    if (selectedStageId.value !== null) {
      filter.stage = selectedStageId.value;
    }

    return filter;
  });

  const addCandidatePopup = usePopup('addCandidate', {
    manageBodyScroll: true,
    onClose: () => {
      resetForm();
    },
  });

  const candidateFormConfig: FormConfig = {
    fields: [
      {
        name: 'firstname',
        label: 'Имя',
        type: 'text',
        placeholder: 'Введите имя',
        required: true,
        row: 1, // Первая строка
        colSpan: 6, // Половина ширины (6 из 12)
        validation: {
          required: true,
          message: 'Имя обязательно для заполнения',
          minLength: 3,
        },
      },
      {
        name: 'surname',
        label: 'Фамилия',
        type: 'text',
        placeholder: 'Введите фамилию',
        required: false,
        row: 1, // Первая строка (рядом с Имя)
        colSpan: 6, // Половина ширины (6 из 12)
        validation: {
          required: false,
        },
      },
      {
        name: 'resume',
        label: 'Название резюме',
        type: 'text',
        placeholder: 'Например, Менеджер по продажам',
        row: 2, // Вторая строка
      },
      {
        name: 'email',
        label: 'Электронная почта',
        type: 'email',
        placeholder: 'Введите email',
        required: true,
        row: 3, // Третья строка
        validation: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Введите корректный email',
        },
      },
      {
        name: 'phone',
        label: 'Телефон',
        type: 'tel',
        placeholder: '+7',
        defaultValue: '+7',
        row: 4, // Четвертая строка
        validation: {
          pattern: /^\+7\d{10}$/,
          message: 'Введите корректный номер телефона (+7XXXXXXXXXX)',
        },
      },
    ],
    submitButtonText: 'Добавить кандидата',
    cancelButtonText: 'Отмена',
    showCancelButton: true,
  };

  const {
    items: candidatesList,
    loading: loadingCandidates,
    loadPage: handlePageChange,
    refresh: refreshCandidates,
  } = useCandidateList(candidateFilter, false);

  const {
    candidateFormData,
    serverErrors,
    isSubmitting,
    isSuccess,
    successMessage,
    handleFormSubmit: handleFormSubmitBase,
    handleFormCancel,
    handleClearError,
    resetForm,
  } = useCandidateAddForm({
    onSuccess: async () => {
      await refreshCandidates();
    },
    onClose: () => {
      addCandidatePopup.close();
    },
  });

  const candidatesCountByStage = computed(() => {
    const counts: Record<number, number> = {};

    stages.value.forEach(s => {
      counts[s.id] = 0;
    });

    if (candidatesList.value) {
      candidatesList.value.forEach(c => {
        if (c.stage && c.vacancy_id) {
          counts[c.stage] = (counts[c.stage] || 0) + 1;
        }
      });
    }

    return counts;
  });

  const filteredVacancies = computed(() => {
    if (!vacancies.value || !vacancy.value) return [];
    return vacancies.value
      .filter(v => v.id !== vacancy.value?.id)
      .map(v => ({
        name: v.title || v.name,
        value: v.id,
      }));
  });

  // const filteredCandidatesList = computed(() => {
  //   if (!candidatesList.value || !vacancy.value?.id) {
  //     return [];
  //   }

  //   return candidatesList.value.filter(
  //     candidate => candidate.vacancy_id === vacancy.value?.id
  //   );
  // });

  const isInitialLoading = computed(
    () => isLoadingVacancy.value || isLoadingVacancies.value
  );

  const getVacancyId = (): string => {
    const vacancyId = Array.isArray(route.params.id)
      ? route.params.id[0]
      : route.params.id;

    if (!vacancyId) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Не указан ID вакансии',
      });
    }
    return vacancyId;
  };

  const loadVacancy = async (id: string) => {
    isLoadingVacancy.value = true;
    try {
      const result = await getVacancyById(id);
      if (result) {
        vacancy.value = result;
      } else {
        console.error('Ошибка загрузки вакансии');
      }
    } catch (err) {
      console.error('Ошибка при получении вакансии:', err);
      throw err;
    } finally {
      isLoadingVacancy.value = false;
    }
  };

  const loadVacancies = async () => {
    isLoadingVacancies.value = true;
    try {
      vacancies.value = await getVacancies();
    } catch (err) {
      console.error('Ошибка при получении списка вакансий:', err);
      return null;
    } finally {
      isLoadingVacancies.value = false;
    }
  };

  const loadCandidate = async (id: number) => {
    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Некорректный ID кандидата',
      });
    }

    isLoadingCandidate.value = true;
    try {
      const result = await getCandidateById(id);
      selectedCandidate.value = result.candidateData;
    } catch (error: unknown) {
      console.error('Ошибка при загрузке кандидата:', error);
      throw error;
    } finally {
      isLoadingCandidate.value = false;
    }
  };

  /**
   * Переключается на следующего кандидата после перемещения текущего
   * @param movedCandidateId - ID перемещённого кандидата
   */
  const switchToNextCandidate = async (movedCandidateId: number) => {
    await refreshCandidates();

    const currentList = candidatesList.value || [];

    // Если список пуст, очищаем выбранного кандидата
    if (currentList.length === 0) {
      selectedCandidate.value = null;
      return;
    }

    // Находим индекс перемещённого кандидата в старом списке
    // (до обновления, но это уже после refreshCandidates)
    // Нужно найти индекс в текущем списке, если кандидат ещё там
    const currentIndex = currentList.findIndex(c => c.id === movedCandidateId);

    let nextCandidate: Candidate | null = null;

    if (currentIndex >= 0) {
      // Берём следующего
      if (currentIndex < currentList.length - 1) {
        nextCandidate = currentList[currentIndex + 1];
      } else {
        // Это был последний - берём первого
        nextCandidate = currentList[0];
      }
    } else {
      // Кандидата уже нет в списке (перемещён)
      // Находим его позицию в старом списке через selectedCandidate
      if (selectedCandidate.value) {
        // Ищем индекс в старом списке (до обновления)
        // Но у нас уже обновлённый список, поэтому просто берём первого
        nextCandidate = currentList[0];
      } else {
        // Если selectedCandidate уже null, берём первого из списка
        nextCandidate = currentList[0];
      }
    }

    // Загружаем данные следующего кандидата
    if (nextCandidate) {
      try {
        await loadCandidate(nextCandidate.id);
      } catch (error) {
        console.error('Ошибка при загрузке следующего кандидата:', error);
        // Если не удалось загрузить, берём первого доступного
        if (currentList.length > 0) {
          await loadCandidate(currentList[0].id);
        }
      }
    }
  };

  const selectVacancy = (id: number) => {
    router.push(`/vacancies/${id}`);
    isDropdownOpen.value = false;
  };

  const handleFormSubmit = async (formData: Record<string, any>) => {
    if (!vacancy.value?.id && isLoadingVacancy.value) {
      console.warn('Ожидание загрузки вакансии...');
      return;
    }
    const formDataWithVacancy = {
      ...formData,
      vacancy_id: vacancy.value?.id || null,
    };
    await handleFormSubmitBase(formDataWithVacancy, addCandidatePopup.isOpen);
  };

  const handleCandidateClick = (candidate: Candidate) => {
    selectedCandidate.value = candidate;
  };

  // Обработчик изменения выбора кандидатов
  const handleSelectionChange = (newSelected: Record<number, boolean>) => {
    selected.value = newSelected;

    const listToUse = candidatesList.value || [];
    allSelected.value =
      listToUse.length > 0 &&
      listToUse.every(candidate => newSelected[candidate.id]);
  };

  const handleSelectAll = (isSelected: boolean) => {
    const listToUse = candidatesList.value || [];
    if (!listToUse.length) return;

    if (isSelected) {
      listToUse.forEach(candidate => {
        selected.value[candidate.id] = true;
      });
      allSelected.value = true;
    } else {
      listToUse.forEach(candidate => {
        delete selected.value[candidate.id];
      });
      allSelected.value = false;
    }
  };

  // Обработчик обновления кандидата
  const handleCandidateUpdated = async (updatedCandidate: Candidate) => {
    if (!updatedCandidate || !updatedCandidate.id) {
      console.error(
        '[handleCandidateUpdated] Получен некорректный кандидат:',
        updatedCandidate
      );
      await refreshCandidates();

      if (selectedCandidate.value?.id) {
        try {
          const result = await getCandidateById(selectedCandidate.value.id);

          selectedCandidate.value = result.candidateData;
        } catch (error) {
          console.error('Ошибка при обновлении кандидата:', error);
        }
      }
      return;
    }

    const movedCandidateId = updatedCandidate.id;

    const wasMovedToAnotherVacancy =
      updatedCandidate.vacancy_id !== vacancy.value?.id;

    await refreshCandidates();

    if (wasMovedToAnotherVacancy) {
      if (selected.value[movedCandidateId]) {
        delete selected.value[movedCandidateId];
      }
    }

    if (selectedCandidate.value?.id === movedCandidateId) {
      await switchToNextCandidate(movedCandidateId);
    } else {
      if (selectedCandidate.value?.id === updatedCandidate.id) {
        try {
          const result = await getCandidateById(updatedCandidate.id);
          selectedCandidate.value = result.candidateData;
        } catch (error) {
          console.error('Ошибка при обновлении кандидата:', error);
        }
      }
    }
  };

  // Обработчик удаления кандидата
  const handleCandidateDeleted = (id: number) => {
    delete selected.value[id];

    if (selectedCandidate.value?.id === id) {
      selectedCandidate.value = null;
    }

    refreshCandidates();
  };

  const handleClickAll = () => {
    handleStageClick(null);
  };

  const handleStageClick = (stageId: number | null) => {
    selectedStageId.value = stageId;
    isActiveAll.value = stageId === null;

    refreshCandidates();

    if (selectedCandidate.value) {
      const matchesFilter =
        stageId === null ? true : selectedCandidate.value.stage === stageId;

      if (!matchesFilter) {
        selectedCandidate.value = null;
      }
    }
  };

  onMounted(async () => {
    const vacancyId = getVacancyId();
    await loadVacancy(vacancyId);
    await loadVacancies();
    if (vacancy.value?.id) {
      await refreshCandidates();
    }

    stages.value = await getFunnelStages();
    // if (stages.value && stages.value.length > 0) {
    //   options.value = [
    //     ...stages.value
    //       .filter(stage => stage.id !== props.candidate.stage)
    //       .map(stage => stage.name),
    //   ];

    //   selectedLabel.value = getNextStageName(
    //     props.candidate?.stage,
    //     stages.value
    //   );
    // }
  });

  watch(
    () => candidatesList.value,
    async newCandidates => {
      if (
        newCandidates &&
        newCandidates.length > 0 &&
        (!selectedCandidate.value ||
          !newCandidates.some(c => c.id === selectedCandidate.value?.id))
      ) {
        await loadCandidate(newCandidates[0].id);
      }
    },
    { immediate: false }
  );

  watch(
    () => vacancy.value?.id,
    async vacancyId => {
      if (vacancyId) {
        await refreshCandidates();
      }
    },
    { immediate: false }
  );
</script>

<template>
  <div class="container pt-35px">
    <div class="relative rounded-t-fifteen bg-white p-25px">
      <div class="flex items-center justify-between">
        <div class="flex flex-col gap-2.5">
          <div class="flex flex-col gap-2.5">
            <div class="relative">
              <div
                class="flex cursor-pointer items-center gap-2 text-xl font-semibold leading-normal text-space"
                @click="isDropdownOpen = !isDropdownOpen"
              >
                <span>{{ vacancy?.name || 'Выберите вакансию' }}</span>
                <svg-icon
                  name="dropdown-arrow"
                  width="20"
                  height="20"
                  :class="{ 'rotate-180': isDropdownOpen }"
                  class="transition-transform"
                />
              </div>

              <transition name="slide-fade">
                <div
                  v-if="isDropdownOpen"
                  class="absolute left-0 top-full z-10 mt-2 max-h-60 min-w-[300px] overflow-y-auto rounded-ten border border-athens bg-white shadow-shadow-droplist"
                >
                  <div
                    v-for="v in filteredVacancies"
                    :key="v.value"
                    class="option cursor-pointer px-15px py-10px text-sm font-normal text-slate-custom hover:bg-zumthor hover:text-space"
                    @click="selectVacancy(v.value as number)"
                  >
                    {{ v.name }}
                  </div>
                </div>
              </transition>
            </div>
            <p class="text-sm font-normal text-slate-custom">
              {{ vacancy?.city ? vacancy.city : vacancy?.location }}
            </p>
          </div>
        </div>
        <UiButton
          v-if="userRole === 'admin'"
          size="semiaction"
          variant="action"
          @click="addCandidatePopup.open()"
        >
          Добавить кандидата
        </UiButton>
      </div>
    </div>
    <div
      class="relative mb-15px flex items-center gap-x-2.5 rounded-b-fifteen bg-catskill px-25px py-15px transition-all"
    >
      <button
        class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium"
        @click="handleClickAll()"
        style="
          transition-property: background-color, color;
          transition-duration: 0.2s;
          transition-timing-function: ease-in-out;
        "
        :class="
          isActiveAll ? 'bg-space text-white' : 'bg-transparent text-space'
        "
      >
        <p>Все</p>
        <span class="text-sm font-medium text-slate-custom">
          {{ candidatesList?.length }}
        </span>
      </button>
      <button
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium text-space"
        @click="handleStageClick(stage.id)"
        :class="
          selectedStageId === stage.id
            ? 'bg-space text-white'
            : 'bg-transparent text-space'
        "
      >
        <p>{{ stage.name }}</p>
        <span class="text-sm font-medium text-slate-custom">
          {{ candidatesCountByStage[stage.id] || 0 }}
        </span>
      </button>
    </div>
    <div v-if="isInitialLoading">
      <UiDotsLoader />
    </div>
    <div v-else>
      <div v-if="candidatesList.length > 0" class="flex gap-x-15px">
        <div class="w-[375px] rounded-sixteen bg-white">
          <CandidateList
            :candidates="candidatesList || []"
            :selected="selected"
            :show-checkboxes="true"
            :all-selected="allSelected"
            :loading="loadingCandidates"
            @item-click="handleCandidateClick"
            @selection-change="handleSelectionChange"
            @select-all="handleSelectAll"
          />
        </div>
        <div v-if="isLoadingCandidate">
          <UiDotsLoader />
        </div>
        <div v-else-if="selectedCandidate" class="w-full">
          <BlockCandidateInfo
            :candidate="selectedCandidate"
            :stages="stages"
            :isFunnel="true"
            @candidate-updated="handleCandidateUpdated"
            @candidate-deleted="handleCandidateDeleted"
          />
          <BlockCandidateTabsInfo :candidate="selectedCandidate" />
        </div>
      </div>
      <div v-else-if="vacancy && !loadingCandidates" class="text-center">
        Кандидаты в вакансии
        <strong>{{ vacancy?.name }}</strong>
        не найдены.
      </div>
    </div>
    <!-- popup -->
    <div v-if="userRole === 'admin'">
      <CandidateAddPopup
        :isOpen="addCandidatePopup.isOpen"
        :model-value="candidateFormData"
        :server-errors="serverErrors"
        :loading="isSubmitting"
        :is-success="isSuccess"
        :success-message="successMessage"
        @close="addCandidatePopup.close"
        @submit="handleFormSubmit"
        @cancel="handleFormCancel"
        @clear-error="handleClearError"
      />
    </div>
  </div>
</template>

<style scoped>
  :deep(.vacancy-dropdown) {
    width: 100%;
    max-width: 500px;
    min-width: 200px;
    font-size: 20px;
    font-weight: 600;
  }

  :deep(.vacancy-dropdown .dropdown-selected-option) {
    background: linear-gradient(to right, #f0f0f0, #ffffff);
    border: 2px solid #007bff;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 20px;
    font-weight: 600;
  }

  :deep(.vacancy-dropdown .option) {
    padding: 12px 20px;
    font-size: 20px;
    font-weight: 600;
    transition: all 0.2s;
  }

  :deep(.vacancy-dropdown .option:hover) {
    background-color: #e3f2fd;
    transform: translateX(4px);
  }
</style>
