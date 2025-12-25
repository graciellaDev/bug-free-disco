<script setup lang="ts">
  import { ref, watch } from 'vue';
  import { useRouter } from 'vue-router';
  // import { disableBodyScroll, enableBodyScroll } from '@/utils/bodyScoll';
  import MyInput from '~/components/custom/MyInput.vue';
  import BtnIcon from '@/components/custom/BtnIcon.vue';
  import CandidateTable from '@/components/custom/page-parts/candidate/CandidateTable.vue';
  import Pagination from '@/components/custom/Pagination.vue';
  import CandidateAddPopup from '@/components/custom/page-parts/candidate/popups/CandidateAddPopup.vue';
  import { useCandidateList } from '@/components/custom/page-parts/composables/useCandidateList';
  import { usePopup } from '@/composables/usePopup';
  import { useCandidateAddForm } from '@/components/custom/page-parts/composables/useCandidateAddForm';

  import type { Candidate } from '@/types/candidates';
  import type { UserRole } from '@/types/roles';

  const router = useRouter();
  const isHoveredFunnel = ref(false);
  const isActiveFunnel = ref(false);
  const isHoveredSort = ref(false);
  const isActiveSort = ref(false);
  const selected = ref<Record<number, boolean>>({});
  const allSelected = ref(false);
  const userRole = ref<UserRole>('admin');
  const actionSort = ref<'Включить сортировку' | 'Отключить сортировку'>(
    'Включить сортировку'
  );
  const actionFunnel = ref<'Включить фильтрацию' | 'Отключить фильтрацию'>(
    'Включить фильтрацию'
  );

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

  const addCandidatePopup = usePopup('addCandidate', {
    manageBodyScroll: true,
    onClose: () => {
      resetForm();
    },
  });

  const {
    items: candidatesList,
    loading: loadingCandidates,
    pagination,
    loadPage: handlePageChange,
    refresh: refreshCandidates,
  } = useCandidateList();

  const funnelToggleActive = () => {
    isActiveFunnel.value = !isActiveFunnel.value;
    actionFunnel.value = isActiveFunnel.value
      ? 'Отключить фильтрацию'
      : 'Включить фильтрацию';
  };

  const sortToggleActive = () => {
    isActiveSort.value = !isActiveSort.value;
    actionSort.value = isActiveSort.value
      ? 'Отключить сортировку'
      : 'Включить сортировку';
  };

  const toggleAll = (isChecked: boolean) => {
    if (!candidatesList.value) return;

    candidatesList.value.forEach(item => {
      if (isChecked) {
        selected.value[item.id] = true;
      } else {
        delete selected.value[item.id];
      }
    });
  };

  const closeAddCandidatePopup = () => {
    addCandidatePopup.close();
  };

  function goToCandidate(id: number) {
    // console.log('[goToCandidate] Переходим к кандидату:', id);
    router.push(`/candidates/${id}`);
  }

  // // Парсинг ошибок сервера
  // const parseServerErrors = (error: any): Record<string, string> => {
  //   const serverErrors: Record<string, string> = {};

  //   // Ошибка 409 - дубликат (email/телефон уже существует)
  //   if (error.response?.status === 409) {
  //     const message = error.response._data?.message || error.message || '';

  //     // Определяем, какое поле дублируется
  //     if (message.toLowerCase().includes('email')) {
  //       serverErrors.email = 'Кандидат с таким email уже существует';
  //     }

  //     if (
  //       message.toLowerCase().includes('телефон') ||
  //       message.toLowerCase().includes('phone')
  //     ) {
  //       serverErrors.phone = 'Кандидат с таким номером телефона уже существует';
  //     }

  //     // Если не удалось определить, показываем общее сообщение
  //     if (Object.keys(serverErrors).length === 0) {
  //       serverErrors._general =
  //         message || 'Кандидат с такими данными уже существует';
  //     }
  //   }

  //   // Ошибка 422 - валидация (Laravel обычно возвращает errors объект)
  //   if (error.response?.status === 422) {
  //     const errors = error.response._data?.errors || {};
  //     Object.keys(errors).forEach(field => {
  //       serverErrors[field] = Array.isArray(errors[field])
  //         ? errors[field][0]
  //         : errors[field];
  //     });
  //   }

  //   // Другие ошибки
  //   if (!serverErrors._general && error.message) {
  //     serverErrors._general = error.message;
  //   }

  //   return serverErrors;
  // };

  // Обработка отправки формы (получаем валидированные данные)
  const handleFormSubmit = async (formData: Record<string, any>) => {
    await handleFormSubmitBase(formData, addCandidatePopup.isOpen);
  };

  // const handlePageChangeWrapper = async (page: number) => {
  //   await handlePageChange(page);
  // };

  const handleCandidateClick = (candidate: Candidate, index: number) => {
    goToCandidate(candidate.id);
  };

  // Обработка изменения выбора
  const handleSelectionChange = (newSelected: Record<number, boolean>) => {
    selected.value = newSelected;
  };

  // Обработка выбора всех
  const handleSelectAll = (isSelected: boolean) => {
    toggleAll(isSelected);
  };

  watch(
    selected,
    newSelected => {
      if (!candidatesList.value || candidatesList.value.length === 0) {
        allSelected.value = false;
        return;
      }

      const allChecked = candidatesList.value.every(
        item => newSelected[item.id]
      );
      const noneChecked = candidatesList.value.every(
        item => !newSelected[item.id]
      );

      allSelected.value = allChecked;

      if (!allChecked && !noneChecked) {
        console.log('Частично выбрано');
      }
    },
    { deep: true }
  );
</script>

<template>
  <div class="container pb-28 pt-6">
    <div class="relative mb-15px rounded-fifteen bg-white p-25px">
      <div class="mb-50px flex items-center justify-between">
        <div class="flex flex-col gap-2.5">
          <h2 class="mb-2.5 text-xl font-semibold leading-normal text-space">
            Кандидаты
          </h2>
          <p class="text-sm font-normal text-slate-custom">
            Раздел для управления кандидатами
          </p>
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
      <div class="absolute left-0 top-[103px] h-[1px] w-full bg-athens"></div>
      <div class="flex gap-x-15px">
        <MyInput
          placeholder="Поиск по кандидатам или ключевым фразам"
          :search="true"
        />
        <div class="flex gap-x-15px">
          <BtnIcon
            icon="sort-list"
            :isActive="isActiveSort"
            :tooltipText="actionSort"
            @click="sortToggleActive()"
          />
          <BtnIcon
            icon="funnel"
            :isActive="isActiveFunnel"
            :tooltipText="actionFunnel"
            @click="funnelToggleActive()"
          />
        </div>
      </div>
    </div>
    <div>
      <CandidateTable
        :candidates="candidatesList || []"
        :selected="selected"
        :show-checkboxes="true"
        :all-selected="allSelected"
        :loading="loadingCandidates"
        @item-click="handleCandidateClick"
        @selection-change="handleSelectionChange"
        @select-all="handleSelectAll"
      />

      <Pagination
        v-if="pagination && pagination.last_page > 1"
        :current-page="pagination.current_page"
        :last-page="pagination.last_page"
        @page-changed="handlePageChange"
      />
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

<style scoped></style>
