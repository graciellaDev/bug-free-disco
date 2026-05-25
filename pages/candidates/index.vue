<script setup lang="ts">
  import { ref, watch, computed, onMounted, onBeforeUnmount } from 'vue';
  import { useRouter } from 'vue-router';
  import MyInput from '~/components/custom/MyInput.vue';
  import BtnIcon from '@/components/custom/BtnIcon.vue';
  import CandidateTable from '@/components/custom/page-parts/candidate/CandidateTable.vue';
  import Pagination from '@/components/custom/Pagination.vue';
  import CandidateAddPopup from '@/components/custom/page-parts/candidate/popups/CandidateAddPopup.vue';
  import CandidateFiltersPopup from '@/components/custom/page-parts/candidate/popups/CandidateFiltersPopup.vue';
  import CandidateTransferToVacancyPopup from '@/components/custom/page-parts/candidate/popups/CandidateTransferToVacancyPopup.vue';
  import CandidateEmailPopup from '@/components/custom/page-parts/candidate/popups/CandidateEmailPopup.vue';
  import BulkActionBar from '@/components/custom/BulkActionBar.vue';
  import DeleteConfirmPopup from '@/components/custom/DeleteConfirmPopup.vue';
  import Popup from '~/components/custom/Popup.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import { useCandidateList } from '@/components/custom/page-parts/composables/useCandidateList';
  import {
    useCandidateListBulkActions,
    CANDIDATE_LIST_BULK_ACTIONS,
  } from '@/components/custom/page-parts/composables/useCandidateListBulkActions';
  import { usePopup } from '@/composables/usePopup';
  import { useCandidateAddForm } from '@/components/custom/page-parts/composables/useCandidateAddForm';
  import { getVacanciesNames } from '@/utils/getVacancies';
  import { clientsList } from '@/utils/clientsList';
  import {
    buildCandidateListQueryParams,
    candidateListStateHasActiveFilters,
    createEmptyCandidateSearchRow,
    type CandidateListFilters,
    type CandidateListSort,
    type CandidateSearchRow,
  } from '@/utils/candidateListParams';
  import { saveCandidateListNavigationContext } from '@/utils/candidateListNavigation';
  import { apiGet } from '@/src/api/client';

  import type { Candidate } from '@/types/candidates';
  import type { UserRole } from '@/types/roles';

  const router = useRouter();
  const selected = ref<Record<number, boolean>>({});
  const allSelected = ref(false);
  const userRole = ref<UserRole>('admin');

  const appliedSearchRows = ref<CandidateSearchRow[]>([
    createEmptyCandidateSearchRow(),
  ]);
  const appliedFilters = ref<CandidateListFilters>({});
  const activeSort = ref<CandidateListSort>('newest');

  const debouncedSearchRows = ref<CandidateSearchRow[]>([
    createEmptyCandidateSearchRow(),
  ]);
  const debouncedFilters = ref<CandidateListFilters>({});
  let listDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  const showSortPanel = ref(false);
  const showFiltersPopup = ref(false);
  const sortPanelRef = ref<HTMLElement | null>(null);
  const sortButtonRef = ref<HTMLElement | null>(null);

  const vacanciesOptions = ref<{ value: number; name: string }[]>([]);
  const clientsOptions = ref<{ value: number; name: string }[]>([]);

  function flushListDebounce() {
    if (listDebounceTimer) {
      clearTimeout(listDebounceTimer);
      listDebounceTimer = null;
    }
    debouncedSearchRows.value = appliedSearchRows.value.map(r => ({ ...r }));
    debouncedFilters.value = { ...appliedFilters.value };
  }

  function scheduleListDebounce() {
    if (listDebounceTimer) clearTimeout(listDebounceTimer);
    listDebounceTimer = setTimeout(flushListDebounce, 400);
  }

  watch(
    [appliedSearchRows, appliedFilters],
    () => {
      scheduleListDebounce();
    },
    { deep: true }
  );

  const listQueryParams = computed(() => ({
    ...buildCandidateListQueryParams(
      debouncedSearchRows.value,
      debouncedFilters.value,
      activeSort.value
    ),
    per_page: 50,
  }));

  // Сразу синхронизируем debounce с applied — иначе первый запрос уходит до onMounted flush.
  flushListDebounce();

  const hasActiveSearchOrFilters = computed(() =>
    candidateListStateHasActiveFilters(
      debouncedSearchRows.value,
      debouncedFilters.value
    )
  );

  const isSortActive = computed(() => activeSort.value !== 'newest');
  const isFilterActive = computed(() =>
    candidateListStateHasActiveFilters(appliedSearchRows.value, appliedFilters.value)
  );

  const {
    items: candidatesList,
    loading: loadingCandidates,
    pagination,
    loadPage: handlePageChange,
    refresh: refreshCandidates,
  } = useCandidateList(listQueryParams);

  const filteredCandidatesTotal = computed(() => pagination.value?.total ?? 0);
  const candidatesCountCaption = computed(() =>
    loadingCandidates.value
      ? 'Идёт загрузка...'
      : `Найдено: ${filteredCandidatesTotal.value}`
  );

  const addCandidatePopup = usePopup('addCandidate', {
    manageBodyScroll: true,
    onClose: () => {
      resetForm();
    },
  });

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

  const showCandidatesToolbar = computed(
    () =>
      (candidatesList.value?.length ?? 0) > 0
      || hasActiveSearchOrFilters.value
      || !loadingCandidates.value
  );

  function applySearchNow() {
    flushListDebounce();
  }

  function openFiltersPopup() {
    showSortPanel.value = false;
    showFiltersPopup.value = true;
  }

  function toggleSortPanel() {
    showSortPanel.value = !showSortPanel.value;
    if (showSortPanel.value) showFiltersPopup.value = false;
  }

  function applySort(mode: CandidateListSort) {
    activeSort.value = mode;
    showSortPanel.value = false;
    flushListDebounce();
  }

  function handleSortClickOutside(event: MouseEvent) {
    if (!showSortPanel.value) return;
    const path = event.composedPath ? event.composedPath() : [event.target as EventTarget];
    const insideSort = path.some(el => {
      if (!el || !(el instanceof Node)) return false;
      if (sortPanelRef.value?.contains(el)) return true;
      if (sortButtonRef.value?.contains(el)) return true;
      return false;
    });
    if (!insideSort) {
      showSortPanel.value = false;
    }
  }

  function onFiltersApply(payload: {
    searchRows: CandidateSearchRow[];
    filters: CandidateListFilters;
    sort: CandidateListSort;
  }) {
    appliedSearchRows.value = payload.searchRows.length
      ? payload.searchRows.map(r => ({ ...r }))
      : [createEmptyCandidateSearchRow()];
    appliedFilters.value = { ...payload.filters };
    activeSort.value = payload.sort;
    showFiltersPopup.value = false;
    flushListDebounce();
  }

  function onFiltersReset() {
    appliedSearchRows.value = [createEmptyCandidateSearchRow()];
    appliedFilters.value = {};
    activeSort.value = 'newest';
    showFiltersPopup.value = false;
    flushListDebounce();
  }

  function resetSearchAndFilters() {
    onFiltersReset();
    showSortPanel.value = false;
  }

  async function loadFilterOptions() {
    try {
      const [vacancies, clientsRes] = await Promise.all([
        getVacanciesNames(),
        clientsList('clients'),
      ]);
      vacanciesOptions.value = (vacancies || [])
        .filter((v: { id?: number; name?: string; title?: string }) => v.id != null)
        .map((v: { id: number; name?: string; title?: string }) => ({
          value: v.id,
          name: String(v.name || v.title || v.id),
        }));
      clientsOptions.value = (clientsRes.clients || [])
        .filter((c: { id?: number; name?: string }) => c.id != null && c.name)
        .map((c: { id: number; name: string }) => ({
          value: c.id,
          name: c.name,
        }));
    } catch (e) {
      console.error('Ошибка загрузки справочников для фильтров кандидатов:', e);
    }
  }

  onMounted(() => {
    void loadFilterOptions();
    window.addEventListener('click', handleSortClickOutside);
  });

  onBeforeUnmount(() => {
    window.removeEventListener('click', handleSortClickOutside);
  });

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

  const selectedCandidateIds = computed(() =>
    Object.keys(selected.value)
      .map(Number)
      .filter(id => selected.value[id])
  );

  const {
    bulkDeleteConfirmOpen,
    bulkTransferPopupOpen,
    bulkTransferMode,
    bulkCommentPopupOpen,
    bulkCommentText,
    bulkEmailPopupOpen,
    bulkActionLoading,
    selectedCount,
    bulkAnchorCandidate,
    runBulkBarAction,
    onBulkTransferConfirm,
    onBulkEmailSubmit,
    submitBulkComment,
    confirmBulkDelete,
  } = useCandidateListBulkActions({
    selectedCandidateIds,
    candidatesList,
    selected,
    allSelected,
    onAfterMutation: refreshCandidates,
  });

  // const closeAddCandidatePopup = () => {
  //   addCandidatePopup.close();
  // };

  function goToCandidate(id: number) {
    saveCandidateListNavigationContext(listQueryParams.value);
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
  //   console.log('Change page to: ', page);
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
  <div class="container pb-28 pt-35px">
    <div class="relative mb-15px flex flex-col rounded-fifteen bg-white">
      <div class="p-25px">
        <div
          class="flex items-center justify-between"
          :class="showCandidatesToolbar ? 'mb-50px' : 'mb-0'"
        >
          <div class="flex flex-col gap-2.5">
            <h2 class="mb-2.5 text-xl font-semibold leading-normal text-space">
              Кандидаты
            </h2>
            <p class="text-sm font-normal text-slate-custom">
              Здесь все, кто откликнулся: найдите человека, посмотрите резюме и на какой вакансии и этапе он сейчас
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
        <template v-if="showCandidatesToolbar">
          <div class="absolute left-0 top-[103px] h-[1px] w-full bg-athens" />
          <div class="flex gap-x-15px">
            <MyInput
              v-if="appliedSearchRows[0]"
              v-model="appliedSearchRows[0].text"
              placeholder="Поиск по ключевым словам"
              :search="true"
              class="flex-1"
              @keyup.enter="applySearchNow"
            />
            <span class="flex shrink-0 items-center whitespace-nowrap px-1 text-sm font-medium text-slate-custom">
              {{ candidatesCountCaption }}
            </span>
            <div class="flex shrink-0 gap-x-15px">
              <div ref="sortButtonRef" class="relative">
                <BtnIcon
                  icon="sort-list"
                  :isActive="showSortPanel || isSortActive"
                  tooltip-text="Сортировка"
                  @click="toggleSortPanel"
                />
                <div
                  v-if="showSortPanel"
                  ref="sortPanelRef"
                  class="sort-dropdown absolute left-0 left-[unset] right-0 top-[50px] z-[200] w-max max-w-[calc(100vw-32px)] rounded-b-ten rounded-t-ten bg-white py-15px shadow-xl"
                >
                  <p class="sort-dropdown__title px-25px pb-15px text-base font-semibold leading-normal text-space">
                    Сортировка
                  </p>
                  <div class="sort-dropdown__group">
                    <button
                      type="button"
                      class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                      :class="{ 'bg-athens-gray/60': activeSort === 'newest' }"
                      @click="applySort('newest')"
                    >
                      <span class="whitespace-nowrap">Сначала недавно созданные</span>
                      <svg-icon v-if="activeSort === 'newest'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                    </button>
                    <button
                      type="button"
                      class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                      :class="{ 'bg-athens-gray/60': activeSort === 'oldest' }"
                      @click="applySort('oldest')"
                    >
                      <span class="whitespace-nowrap">Сначала давно созданные</span>
                      <svg-icon v-if="activeSort === 'oldest'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                    </button>
                  </div>
                </div>
              </div>
              <BtnIcon
                icon="funnel"
                :isActive="showFiltersPopup || isFilterActive"
                tooltip-text="Фильтры"
                @click="openFiltersPopup"
              />
            </div>
          </div>
        </template>
      </div>

    </div>
    <div>
      <CandidateTable
        :candidates="candidatesList || []"
        :selected="selected"
        :show-checkboxes="true"
        :all-selected="allSelected"
        :loading="loadingCandidates"
        :empty-title="
          hasActiveSearchOrFilters && !loadingCandidates && !(candidatesList?.length)
            ? 'Нет кандидатов, соответствующих фильтрам'
            : ''
        "
        :empty-description="
          hasActiveSearchOrFilters && !loadingCandidates && !(candidatesList?.length)
            ? 'Измените параметры поиска или сбросьте фильтры.'
            : ''
        "
        @item-click="handleCandidateClick"
        @selection-change="handleSelectionChange"
        @select-all="handleSelectAll"
      >
        <template v-if="userRole === 'admin' && !hasActiveSearchOrFilters" #empty-action>
          <UiButton
            size="semiaction"
            variant="action"
            @click="addCandidatePopup.open()"
          >
            Добавить кандидата
          </UiButton>
        </template>
      </CandidateTable>

      <Pagination
        v-if="pagination && pagination.last_page > 1"
        :currentPage="pagination.current_page"
        :lastPage="pagination.last_page"
        @page-changed="handlePageChange"
      />
    </div>

    <CandidateFiltersPopup
      :is-open="showFiltersPopup"
      :vacancies-options="vacanciesOptions"
      :clients-options="clientsOptions"
      :initial-search-rows="appliedSearchRows"
      :initial-filters="appliedFilters"
      :initial-sort="activeSort"
      @close="showFiltersPopup = false"
      @apply="onFiltersApply"
      @reset="onFiltersReset"
    />

    <BulkActionBar
      :visible="selectedCount > 0"
      :selected-count="selectedCount"
      :all-selected="allSelected"
      :list-length="candidatesList?.length ?? 0"
      :loading="bulkActionLoading"
      :actions="CANDIDATE_LIST_BULK_ACTIONS"
      :pinned-count="4"
      aria-label="Действия с выбранными кандидатами"
      @update:all-selected="handleSelectAll"
      @action="runBulkBarAction"
    />

    <CandidateTransferToVacancyPopup
      v-if="bulkAnchorCandidate"
      :is-open="bulkTransferPopupOpen"
      :candidate="bulkAnchorCandidate"
      :mode="bulkTransferMode"
      @close="bulkTransferPopupOpen = false"
      @confirm="onBulkTransferConfirm"
    />

    <CandidateEmailPopup
      v-if="bulkAnchorCandidate"
      :is-open="bulkEmailPopupOpen"
      :candidate="bulkAnchorCandidate"
      @close="bulkEmailPopupOpen = false"
      @submit="onBulkEmailSubmit"
    />

    <Popup
      :is-open="bulkCommentPopupOpen"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      :no-scrollbar-gutter="true"
      @close="bulkCommentPopupOpen = false"
    >
      <div class="flex flex-col gap-y-4 text-sm">
        <h2 class="text-xl font-semibold text-space">
          Комментарий для {{ selectedCount }} кандидатов
        </h2>
        <MyTextarea
          v-model="bulkCommentText"
          placeholder="Текст комментария"
        />
        <div class="flex flex-wrap gap-x-3 gap-y-2">
          <button
            type="button"
            class="rounded-ten bg-dodger px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            :disabled="bulkActionLoading || !bulkCommentText.trim()"
            @click="submitBulkComment"
          >
            Добавить
          </button>
          <button
            type="button"
            class="rounded-ten border border-athens bg-athens-gray px-4 py-2 text-sm font-medium text-slate-custom"
            @click="bulkCommentPopupOpen = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <DeleteConfirmPopup
      :is-open="bulkDeleteConfirmOpen"
      title="Удалить кандидатов"
      :loading="bulkActionLoading"
      @close="bulkDeleteConfirmOpen = false"
      @confirm="confirmBulkDelete"
    >
      Удалить выбранных кандидатов
      <strong>({{ selectedCount }})</strong>
      без возможности восстановления?
    </DeleteConfirmPopup>

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
  .sort-dropdown__item:not(:last-child) {
    border-bottom: 1px solid #f4f6f8;
  }
</style>
