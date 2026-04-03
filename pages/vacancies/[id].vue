<script lang="ts" setup>
  import {
    ref,
    onMounted,
    onBeforeUnmount,
    computed,
    watch,
    nextTick,
  } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import CandidateList from '@/components/custom/page-parts/vacancy/CandidateList.vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import MyCheckbox from '@/components/custom/MyCheckbox.vue';
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
  import {
    getCandidateById,
    updateCandidate,
    deleteCandidate,
    createCandidateComment,
    createCandidate,
    sendCandidateEmail,
  } from '@/src/api/candidates';
  import type { CandidateUpdateRequest } from '@/types/candidates';
  import type { VacancyStage, TransferMode } from '@/types/vacancy';
  import Popup from '~/components/custom/Popup.vue';
  import CandidateRefusePopup from '@/components/custom/page-parts/candidate/popups/CandidateRefusePopup.vue';
  import CandidateTransferToVacancyPopup from '@/components/custom/page-parts/candidate/popups/CandidateTransferToVacancyPopup.vue';
  import CandidateEmailPopup from '@/components/custom/page-parts/candidate/popups/CandidateEmailPopup.vue';
  import MyTextarea from '~/components/custom/MyTextarea.vue';
  import { buildCandidateCopyPayload } from '@/utils/buildCandidateCopyPayload';
  import { displayCandidateEmailOrEmpty } from '@/utils/candidateDisplayEmail';

  const route = useRoute();
  const router = useRouter();
  const selectedStageId = ref<number | null>(null); // null = "Все"
  const vacancy = ref<Vacancy | null>(null);
  const vacancies = ref<Vacancy[] | null>(null);
  const selectedCandidate = ref<Candidate | null>(null);
  const isLoadingVacancy = ref(false);
  const isLoadingVacancies = ref(false);
  const isLoadingCandidate = ref(false);
  /** Пока грузится карточка — подсветка строки в списке по id клика, а не по старому selectedCandidate */
  const loadingCandidateId = ref<number | null>(null);
  const activeListCandidateId = computed(
    () => loadingCandidateId.value ?? selectedCandidate.value?.id ?? null
  );
  const isInitialLoad = ref(true);
  const isDropdownOpen = ref(false);
  const selected = ref<Record<number, boolean>>({});
  const allSelected = ref(false);
  const isActiveAll = ref(true);
  const stages = ref<VacancyStage[]>([]);
  const userRole = ref<UserRole>('admin');
  const logRefreshKey = ref(0);
  const refreshCandidateLog = () => {
    logRefreshKey.value++;
  };

  /** Поиск по уже загруженной выдаче: ФИО и название должности (quickInfo). */
  const candidateSearchQuery = ref('');

  function candidateMatchesVacancyListSearch(
    c: Candidate,
    rawQuery: string
  ): boolean {
    const q = rawQuery.trim().toLowerCase();
    if (!q) return true;
    const surname = (c.surname ?? '').trim().toLowerCase();
    const first = (c.firstname ?? '').trim().toLowerCase();
    const pat = (c.patronymic ?? '').trim().toLowerCase();
    const fioVariants = [
      [surname, first, pat].filter(Boolean).join(' '),
      [first, surname, pat].filter(Boolean).join(' '),
      [surname, first].filter(Boolean).join(' '),
      [first, surname].filter(Boolean).join(' '),
    ].filter(s => s.length > 0);
    const position = (c.quickInfo ?? '').trim().toLowerCase();
    const haystack = [...fioVariants, position].filter(Boolean).join(' \u007c ');
    const tokens = q.split(/\s+/).filter(Boolean);
    if (!tokens.length) return true;
    return tokens.every(t => haystack.includes(t));
  }
  const tabsInfoRef = ref<InstanceType<typeof BlockCandidateTabsInfo> | null>(null);
  const candidateInfoRef = ref<InstanceType<typeof BlockCandidateInfo> | null>(null);

  const openEmailPopupFromFeed = () => {
    candidateInfoRef.value?.openEmailPopup?.();
  };

  const handleAddCommentFromHeader = () => {
    tabsInfoRef.value?.openCommentAndFocus?.();
    nextTick(() => {
      nextTick(() => {
        const el = tabsInfoRef.value?.eventFeedRef;
        const node = el?.value ?? el;
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const handleOpenSiteChatFromHeader = () => {
    tabsInfoRef.value?.openChatAndFocus?.();
    nextTick(() => {
      nextTick(() => {
        const el = tabsInfoRef.value?.eventFeedRef;
        const node = el?.value ?? el;
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  const handleAddTaskFromHeader = () => {
    tabsInfoRef.value?.openTaskAndFocus?.();
    nextTick(() => {
      nextTick(() => {
        const el = tabsInfoRef.value?.eventFeedRef;
        const node = el?.value ?? el;
        if (node && typeof node.scrollIntoView === 'function') {
          node.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  };

  // const vacancyFilter = computed(() => {
  //   if (!vacancy.value?.id) return {};
  //   return { vacancy_id: vacancy.value.id };
  // });

  const candidateFilter = computed(() => {
    const filter: Record<string, any> = {};

    if (vacancy.value?.id) {
      filter.vacancy_id = vacancy.value.id;
    }

    // Фильтр по этапу — запрашиваем с сервера только кандидатов выбранного этапа (плоский ключ для корректной сериализации query)
    if (selectedStageId.value !== null) {
      filter['filters[stage_id]'] = selectedStageId.value;
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
        placeholder: 'Введите email (необязательно)',
        required: false,
        row: 3, // Третья строка
        validation: {
          required: false,
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
    pagination,
    loadNext,
  } = useCandidateList(candidateFilter, 'infinite', false);

  const candidatesHasMore = computed(() => {
    const p = pagination.value;
    if (!p?.last_page) return false;
    return p.current_page < p.last_page;
  });

  const handleCandidatesLoadMore = async () => {
    await loadNext();
  };

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

  const candidatesTotal = computed(() => (vacancy.value as { candidatesTotal?: number })?.candidatesTotal ?? candidatesList.value?.length ?? 0);

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

  // Сначала фильтр сервера по этапу/вакансии, затем локальный поиск по ФИО и должности
  const filteredCandidatesList = computed(() => {
    const list = candidatesList.value ?? [];
    return list.filter(c =>
      candidateMatchesVacancyListSearch(c, candidateSearchQuery.value)
    );
  });

  /** Скролл только внутри списка при >20 строк; иначе колесо прокручивает страницу */
  const candidateListNeedsInnerScroll = computed(
    () => (filteredCandidatesList.value?.length ?? 0) > 20
  );

  const isInitialLoading = computed(
    () => isLoadingVacancy.value || isLoadingVacancies.value
  );

  const selectedStage = computed(() => {
    if (selectedStageId.value === null || !stages.value.length) {
      return null;
    }
    return (
      stages.value.find(stage => stage.id === selectedStageId.value) || null
    );
  });

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
        stages.value = result.stages ?? [];
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

  /** Загрузить кандидата и открыть в правой панели. Этап и воронка подставляются из данных кандидата в БД. */
  const loadCandidate = async (id: number, options: { syncStageFromCandidate?: boolean } = {}) => {
    if (!id || isNaN(id)) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Некорректный ID кандидата',
      });
    }

    loadingCandidateId.value = id;
    isLoadingCandidate.value = true;
    try {
      const result = await getCandidateById(id);
      const data = result.candidateData;
      selectedCandidate.value = data;
      syncCandidateToUrl(data.id);
      if (options.syncStageFromCandidate) {
        const stageId =
          data.stage ?? (data as { stage_id?: number }).stage_id ?? null;
        if (stageId != null) {
          // Не вызываем refreshCandidates: фильтр candidateFilter зависит от этапа,
          // useDataList сам перезагрузит список при смене selectedStageId / «Все».
          if (selectedStageId.value !== stageId || isActiveAll.value) {
            selectedStageId.value = stageId;
            isActiveAll.value = false;
          }
        }
      }
    } catch (error: unknown) {
      console.error('Ошибка при загрузке кандидата:', error);
      throw error;
    } finally {
      isLoadingCandidate.value = false;
      loadingCandidateId.value = null;
    }
  };

  /**
   * Переключается на следующего кандидата после перемещения текущего
   * @param movedCandidateId - ID перемещённого кандидата
   */
  const switchToNextCandidate = async (movedCandidateId: number) => {
    const currentList = filteredCandidatesList.value || [];

    // Если список пуст, очищаем выбранного кандидата
    if (currentList.length === 0) {
      selectedCandidate.value = null;
      syncCandidateToUrl(null);
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

  /** В ссылке только id кандидата; этап и воронка берутся из данных кандидата в БД. */
  const syncCandidateToUrl = (candidateId: number | null) => {
    const query = { ...route.query } as Record<string, string>;
    if (candidateId != null) {
      query.candidate = String(candidateId);
    } else {
      delete query.candidate;
    }
    delete query.stage;
    router.replace({ path: route.path, query });
  };

  const handleCandidateClick = async (candidate: Candidate) => {
    try {
      // Только карточка и URL; воронку не трогаем — иначе смена этапа дублирует
      // загрузку списка (watch на candidateFilter + лишний refreshCandidates).
      await loadCandidate(candidate.id, { syncStageFromCandidate: false });
    } catch (e) {
      console.error('[handleCandidateClick] Не удалось загрузить кандидата:', e);
    }
  };

  // Обработчик изменения выбора кандидатов
  const handleSelectionChange = (newSelected: Record<number, boolean>) => {
    selected.value = newSelected;

    const listToUse = filteredCandidatesList.value || [];
    allSelected.value =
      listToUse.length > 0 &&
      listToUse.every(candidate => newSelected[candidate.id]);
  };

  const handleSelectAll = (isSelected: boolean) => {
    const listToUse = filteredCandidatesList.value || [];
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

  const selectedCandidateIds = computed(() =>
    Object.keys(selected.value)
      .map(Number)
      .filter(id => selected.value[id])
  );

  const selectedCount = computed(() => selectedCandidateIds.value.length);

  const bulkRefusePopupOpen = ref(false);
  const bulkDeleteConfirmOpen = ref(false);
  const bulkDetachConfirmOpen = ref(false);
  const bulkTransferPopupOpen = ref(false);
  const bulkTransferMode = ref<TransferMode>('move');
  const bulkCommentPopupOpen = ref(false);
  const bulkCommentText = ref('');
  const bulkEmailPopupOpen = ref(false);
  const bulkActionLoading = ref(false);

  /** Первый выбранный кандидат из загруженного списка — для попапов, привязанных к одной карточке */
  const bulkAnchorCandidate = computed((): Candidate | null => {
    const ids = selectedCandidateIds.value;
    if (!ids.length) return null;
    for (const id of ids) {
      const c = candidatesList.value?.find(x => x.id === id);
      if (c) return c;
    }
    return null;
  });

  async function resolveCandidateForBulk(id: number): Promise<Candidate | null> {
    const fromList = candidatesList.value?.find(x => x.id === id);
    if (fromList) return fromList;
    try {
      const r = await getCandidateById(id);
      return r.candidateData;
    } catch {
      return null;
    }
  }

  async function afterBulkSoftMutation() {
    await refreshCandidates();
    await loadVacancy(getVacancyId());
    refreshCandidateLog();
  }

  function getRejectedStage(stagesList: VacancyStage[]): VacancyStage | null {
    return (
      stagesList.find(s => {
        const name = (s.name || '').trim();
        return (
          s.id === 4 ||
          name === 'Отклоненные' ||
          name === 'Отклонённые' ||
          name === 'Отказ'
        );
      }) ?? null
    );
  }

  async function reconcileAfterBulkMutation() {
    await refreshCandidates();
    await loadVacancy(getVacancyId());
    const selId = selectedCandidate.value?.id;
    selected.value = {};
    allSelected.value = false;

    const list = filteredCandidatesList.value || [];
    if (selId != null && list.some(c => c.id === selId)) {
      try {
        const r = await getCandidateById(selId);
        selectedCandidate.value = r.candidateData;
      } catch {
        if (list.length > 0) {
          await loadCandidate(list[0].id);
        } else {
          selectedCandidate.value = null;
          syncCandidateToUrl(null);
        }
      }
    } else if (list.length > 0) {
      await loadCandidate(list[0].id);
    } else {
      selectedCandidate.value = null;
      syncCandidateToUrl(null);
    }
  }

  function openBulkTransfer(mode: TransferMode) {
    if (!selectedCount.value || bulkActionLoading.value) return;
    if (!bulkAnchorCandidate.value) {
      alert('Не удалось определить кандидата для выбора вакансии. Дождитесь загрузки списка.');
      return;
    }
    bulkTransferMode.value = mode;
    bulkTransferPopupOpen.value = true;
  }

  async function onBulkTransferConfirm(vacancyId: number) {
    bulkTransferPopupOpen.value = false;
    const mode = bulkTransferMode.value;
    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        const c = await resolveCandidateForBulk(id);
        if (!c) continue;
        try {
          if (mode === 'move') {
            await updateCandidate({
              id: c.id,
              firstname: c.firstname,
              email: c.email,
              phone: c.phone,
              vacancy_id: vacancyId,
            });
          } else {
            await createCandidate(buildCandidateCopyPayload(c, vacancyId));
          }
        } catch (err) {
          console.error('[onBulkTransferConfirm]', id, err);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await reconcileAfterBulkMutation();
  }

  function handleBulkDetachClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkDetachConfirmOpen.value = true;
  }

  async function confirmBulkDetach() {
    bulkDetachConfirmOpen.value = false;
    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        const c = await resolveCandidateForBulk(id);
        if (!c) continue;
        try {
          await updateCandidate({
            id: c.id,
            firstname: c.firstname,
            email: c.email,
            phone: c.phone,
            vacancy_id: null,
            stage: 1,
          });
        } catch (err) {
          console.error('[confirmBulkDetach]', id, err);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await reconcileAfterBulkMutation();
  }

  function handleBulkCommentClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkCommentText.value = '';
    bulkCommentPopupOpen.value = true;
  }

  async function submitBulkComment() {
    const text = bulkCommentText.value.trim();
    if (!text) return;
    bulkCommentPopupOpen.value = false;
    bulkCommentText.value = '';
    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        try {
          await createCandidateComment(id, text);
        } catch (e) {
          console.error('[submitBulkComment]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkSoftMutation();
  }

  function handleBulkEmailClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    if (!bulkAnchorCandidate.value) {
      alert('Не удалось открыть письмо: нет данных выбранного кандидата.');
      return;
    }
    bulkEmailPopupOpen.value = true;
  }

  async function onBulkEmailSubmit(data: Record<string, any>) {
    bulkEmailPopupOpen.value = false;
    const subject = String(data?.subject ?? '').trim();
    const from_email = data?.from != null ? String(data.from).trim() : undefined;
    const bodyVal = data?.body;
    const bodyStr =
      typeof bodyVal === 'string'
        ? bodyVal
        : String(bodyVal?.value ?? '<p></p>');
    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        const c = await resolveCandidateForBulk(id);
        if (!c) continue;
        const to = displayCandidateEmailOrEmpty(c.email).trim();
        if (!to) continue;
        try {
          await sendCandidateEmail(id, {
            subject,
            body: bodyStr,
            to,
            from_email: from_email || undefined,
          });
        } catch (e) {
          console.error('[onBulkEmailSubmit]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await afterBulkSoftMutation();
  }

  function handleBulkSendMessageClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    const first = selectedCandidateIds.value[0];
    if (first == null) return;
    void router.push(`/candidates/${first}?tab=chat`);
  }

  function handleBulkRefuseClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkRefusePopupOpen.value = true;
  }

  async function onBulkRefuseSubmit(data: {
    rejection_reason_id?: number;
    internal_comment?: string;
  }) {
    const rejectedStage = getRejectedStage(stages.value);
    if (!rejectedStage || !vacancy.value?.id) return;

    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      const note = data.internal_comment?.trim();
      for (const id of ids) {
        const c = candidatesList.value?.find(x => x.id === id);
        if (!c) continue;
        try {
          const updateData: CandidateUpdateRequest & {
            context_vacancy_id?: number;
          } = {
            id: c.id,
            firstname: c.firstname,
            email: c.email,
            phone: c.phone,
            stage: rejectedStage.id,
            context_vacancy_id: vacancy.value.id,
          };
          if (data.rejection_reason_id != null) {
            updateData.rejection_reason_id = data.rejection_reason_id;
          }
          await updateCandidate(updateData);
          if (note) {
            try {
              await createCandidateComment(id, note);
            } catch (commentErr) {
              console.error(
                '[onBulkRefuseSubmit] Не удалось сохранить комментарий:',
                commentErr
              );
            }
          }
        } catch (err) {
          console.error('[onBulkRefuseSubmit]', id, err);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await reconcileAfterBulkMutation();
  }

  function handleBulkDeleteClick() {
    if (!selectedCount.value || bulkActionLoading.value) return;
    bulkDeleteConfirmOpen.value = true;
  }

  async function confirmBulkDelete() {
    bulkDeleteConfirmOpen.value = false;
    const ids = [...selectedCandidateIds.value];
    bulkActionLoading.value = true;
    try {
      for (const id of ids) {
        try {
          await deleteCandidate(id);
        } catch (e) {
          console.error('[confirmBulkDelete]', id, e);
        }
      }
    } finally {
      bulkActionLoading.value = false;
    }
    await reconcileAfterBulkMutation();
  }

  type BulkBarActionId =
    | 'refuse'
    | 'comment'
    | 'email'
    | 'move'
    | 'copy'
    | 'detach'
    | 'message'
    | 'delete';

  type BulkBarActionItem = {
    id: BulkBarActionId;
    label: string;
    icon: string;
    iconClass: string;
  };

  const bulkBarActionsList: BulkBarActionItem[] = [
    {
      id: 'refuse',
      label: 'Отказать кандидату',
      icon: 'stop20',
      iconClass: 'text-red-custom',
    },
    {
      id: 'comment',
      label: 'Добавить комментарий',
      icon: 'message20',
      iconClass: 'text-white/80',
    },
    {
      id: 'email',
      label: 'Написать письмо',
      icon: 'email20',
      iconClass: 'text-white/80',
    },
    {
      id: 'move',
      label: 'Переместить в вакансию',
      icon: 'ai-arrow',
      iconClass: 'text-white/80',
    },
    {
      id: 'copy',
      label: 'Копировать в вакансию',
      icon: 'basket-plus',
      iconClass: 'text-white/80',
    },
    {
      id: 'detach',
      label: 'Открепить от вакансии',
      icon: 'basket-minus',
      iconClass: 'text-white/80',
    },
    {
      id: 'message',
      label: 'Отправить сообщение',
      icon: 'pulse',
      iconClass: 'text-white/80',
    },
    {
      id: 'delete',
      label: 'Удалить',
      icon: 'basket-basket',
      iconClass: 'text-red-custom',
    },
  ];

  const bulkBarChipClass =
    'inline-flex items-center gap-1 border-0 bg-transparent p-0 text-xs font-normal text-white/90 hover:bg-white/10 hover:text-white disabled:opacity-40 sm:rounded-md sm:px-1 sm:py-0.5 whitespace-nowrap';

  /** Первые 4 действия всегда на панели, не в «Ещё» */
  const BULK_BAR_PINNED_COUNT = 4;

  const bulkActionsOuterRef = ref<HTMLElement | null>(null);
  const bulkMeasureRowRef = ref<HTMLElement | null>(null);
  const bulkVisiblePoolCount = ref(
    Math.max(0, bulkBarActionsList.length - BULK_BAR_PINNED_COUNT)
  );
  const bulkMoreOpen = ref(false);

  const bulkBarPinnedActions = computed(() =>
    bulkBarActionsList.slice(0, BULK_BAR_PINNED_COUNT)
  );
  const bulkBarOverflowPoolAll = computed(() =>
    bulkBarActionsList.slice(BULK_BAR_PINNED_COUNT)
  );
  const bulkBarVisiblePoolActions = computed(() =>
    bulkBarOverflowPoolAll.value.slice(0, bulkVisiblePoolCount.value)
  );
  const bulkBarOverflowMenuActions = computed(() =>
    bulkBarOverflowPoolAll.value.slice(bulkVisiblePoolCount.value)
  );

  function runBulkBarAction(id: BulkBarActionId) {
    bulkMoreOpen.value = false;
    switch (id) {
      case 'refuse':
        handleBulkRefuseClick();
        break;
      case 'comment':
        handleBulkCommentClick();
        break;
      case 'email':
        handleBulkEmailClick();
        break;
      case 'move':
        openBulkTransfer('move');
        break;
      case 'copy':
        openBulkTransfer('copy');
        break;
      case 'detach':
        handleBulkDetachClick();
        break;
      case 'message':
        handleBulkSendMessageClick();
        break;
      case 'delete':
        handleBulkDeleteClick();
        break;
      default:
        break;
    }
  }

  const BULK_BAR_GAP_PX = 12;
  const BULK_MORE_BTN_RESERVE_PX = 76;

  async function updateBulkBarSplit() {
    await nextTick();
    const outer = bulkActionsOuterRef.value;
    const measureRow = bulkMeasureRowRef.value;
    if (!outer || !measureRow) return;
    const chips = measureRow.querySelectorAll<HTMLElement>(
      '[data-bulk-measure-chip]'
    );
    if (chips.length !== bulkBarActionsList.length) return;
    const widths = Array.from(chips).map(el =>
      Math.ceil(el.getBoundingClientRect().width)
    );
    const available = Math.floor(outer.getBoundingClientRect().width);
    const n = bulkBarActionsList.length;
    const pinCount = BULK_BAR_PINNED_COUNT;
    const poolCount = n - pinCount;
    const pinWidths = widths.slice(0, pinCount);
    const poolWidths = widths.slice(pinCount);
    const pinnedBlock =
      pinWidths.reduce((s, w) => s + w, 0) +
      (pinCount > 1 ? (pinCount - 1) * BULK_BAR_GAP_PX : 0);

    let bestK = 0;
    for (let k = poolCount; k >= 0; k--) {
      const overflowPart =
        k === 0
          ? 0
          : poolWidths.slice(0, k).reduce((s, w) => s + w, 0) +
            (k - 1) * BULK_BAR_GAP_PX;
      const gapPinToPool = k > 0 ? BULK_BAR_GAP_PX : 0;
      const needMore = k < poolCount;
      const gapBeforeMore = needMore ? BULK_BAR_GAP_PX : 0;
      const moreW = needMore ? BULK_MORE_BTN_RESERVE_PX : 0;
      const total =
        pinnedBlock + gapPinToPool + overflowPart + gapBeforeMore + moreW;
      if (total <= available) {
        bestK = k;
        break;
      }
    }
    bulkVisiblePoolCount.value = bestK;
  }

  let bulkBarSplitRaf = 0;
  function scheduleBulkBarSplit() {
    if (bulkBarSplitRaf) cancelAnimationFrame(bulkBarSplitRaf);
    bulkBarSplitRaf = requestAnimationFrame(() => {
      bulkBarSplitRaf = 0;
      void updateBulkBarSplit();
    });
  }

  let bulkBarResizeObserver: ResizeObserver | null = null;

  function onBulkBarDocClick(e: MouseEvent) {
    if (!bulkMoreOpen.value) return;
    const t = e.target;
    if (t instanceof Node && bulkActionsOuterRef.value?.contains(t)) return;
    bulkMoreOpen.value = false;
  }

  // Обработчик обновления кандидата
  const handleCandidateUpdated = async (updatedCandidate: Candidate) => {
    /** До await refresh — иначе выброс сброса/гонка оставит selectedCandidate null и карточка пропадёт */
    const persistedSelectedId = selectedCandidate.value?.id;

    const idOk = (v: unknown): v is number =>
      v != null && Number.isFinite(Number(v)) && Number(v) > 0;

    if (!updatedCandidate || !idOk(updatedCandidate.id)) {
      console.error(
        '[handleCandidateUpdated] Получен некорректный кандидат:',
        updatedCandidate
      );
      await refreshCandidates();

      if (idOk(persistedSelectedId)) {
        try {
          const result = await getCandidateById(Number(persistedSelectedId));
          selectedCandidate.value = result.candidateData;
          syncCandidateToUrl(result.candidateData.id);
        } catch (error) {
          console.error('Ошибка при обновлении кандидата:', error);
        }
      }
      return;
    }

    const updatedId = Number(updatedCandidate.id);
    await refreshCandidates();

    if (idOk(persistedSelectedId) && Number(persistedSelectedId) === updatedId) {
      try {
        const result = await getCandidateById(updatedId);
        selectedCandidate.value = result.candidateData;
        syncCandidateToUrl(result.candidateData.id);
        logRefreshKey.value++;
      } catch (error) {
        console.error('Ошибка при обновлении кандидата:', error);
      }
    }
  };

  const handleCandidateMoved = async (
    movedCandidate: Candidate,
    newStageId?: number
  ) => {
    const persistedIdAfterBadMove = selectedCandidate.value?.id;

    if (!movedCandidate || !movedCandidate.id) {
      console.error(
        '[handleCandidateMoved] Получен некорректный кандидат:',
        movedCandidate
      );
      await refreshCandidates();

      if (
        persistedIdAfterBadMove != null &&
        Number.isFinite(Number(persistedIdAfterBadMove)) &&
        Number(persistedIdAfterBadMove) > 0
      ) {
        try {
          const result = await getCandidateById(Number(persistedIdAfterBadMove));
          selectedCandidate.value = result.candidateData;
          syncCandidateToUrl(result.candidateData.id);
        } catch (error) {
          console.error('Ошибка при обновлении кандидата:', error);
        }
      }
      return;
    }

    const movedCandidateId = movedCandidate.id;
    const listBeforeMove = filteredCandidatesList.value || [];
    const movedIndex = listBeforeMove.findIndex(c => c.id === movedCandidateId);
    const wasSelectedMoved = selectedCandidate.value?.id === movedCandidateId;
    const wasMovedToAnotherVacancy =
      movedCandidate.vacancy_id !== vacancy.value?.id;
    const stageToSelect =
      newStageId ?? movedCandidate.stage ?? movedCandidate.stage_id ?? null;

    // При переносе в другую вакансию остаёмся на текущем этапе.
    // Переключаем воронку только при переносе внутри этой же вакансии.
    if (!wasMovedToAnotherVacancy && stageToSelect != null) {
      selectedStageId.value = stageToSelect;
      isActiveAll.value = false;
    }

    await refreshCandidates();

    if (wasMovedToAnotherVacancy) {
      if (selected.value[movedCandidateId]) {
        delete selected.value[movedCandidateId];
      }

      // Кандидат ушёл из этой вакансии — переключаем карточку на следующего в текущем списке.
      if (wasSelectedMoved) {
        const listAfterMove = filteredCandidatesList.value || [];
        if (listAfterMove.length === 0) {
          selectedCandidate.value = null;
          syncCandidateToUrl(null);
          return;
        }

        const nextIndex =
          movedIndex >= 0 ? Math.min(movedIndex, listAfterMove.length - 1) : 0;
        const nextCandidate = listAfterMove[nextIndex] || listAfterMove[0];
        if (nextCandidate) {
          await loadCandidate(nextCandidate.id);
        }
      }
      return;
    }

    // Обновляем воронку: перезагружаем вакансию, чтобы цифры по этапам обновились
    await loadVacancy(getVacancyId());

    // Перенос внутри текущей вакансии: обновляем данные текущего кандидата
    if (selectedCandidate.value?.id === movedCandidateId) {
      try {
        const result = await getCandidateById(movedCandidateId);
        selectedCandidate.value = result.candidateData;
        logRefreshKey.value++;
      } catch (error) {
        console.error('Ошибка при обновлении карточки кандидата:', error);
      }
    }
  };

  // Обработчик удаления кандидата: остаёмся в том же этапе и открываем следующего
  const handleCandidateDeleted = async (id: number) => {
    const listBeforeDelete = filteredCandidatesList.value || [];
    const deletedIndex = listBeforeDelete.findIndex(c => c.id === id);
    const wasSelectedDeleted = selectedCandidate.value?.id === id;

    delete selected.value[id];

    await refreshCandidates();
    await loadVacancy(getVacancyId());

    if (!wasSelectedDeleted) return;

    const listAfterDelete = filteredCandidatesList.value || [];
    if (listAfterDelete.length === 0) {
      selectedCandidate.value = null;
      syncCandidateToUrl(null);
      return;
    }

    const nextIndex =
      deletedIndex >= 0
        ? Math.min(deletedIndex, listAfterDelete.length - 1)
        : 0;
    const nextCandidate = listAfterDelete[nextIndex] || listAfterDelete[0];
    if (nextCandidate) {
      await loadCandidate(nextCandidate.id);
    }
  };

  const handleClickAll = async () => {
    selectedStageId.value = null;
    isActiveAll.value = true;

    await refreshCandidates();
  };

  const handleStageClick = async (stageId: number | null) => {
    selectedStageId.value = stageId;
    isActiveAll.value = stageId === null;

    if (selectedCandidate.value) {
      const candStage =
        selectedCandidate.value.stage ??
        (selectedCandidate.value as { stage_id?: number }).stage_id;
      const matchesFilter =
        stageId === null ? true : candStage === stageId;

      if (!matchesFilter) {
        selectedCandidate.value = null;
        syncCandidateToUrl(null);
      }
    }

    // Обновляем список кандидатов по выбранному этапу
    await refreshCandidates();

    // При клике на этап открываем первого кандидата этого этапа; этап в воронке подставится из данных кандидата в БД
    if (stageId !== null) {
      await nextTick();
      const list = filteredCandidatesList.value || [];
      if (list.length > 0) {
        await loadCandidate(list[0].id);
      }
    }
  };

  /** Флаг: мы сейчас синхронизируем состояние из URL — не реагировать на побочные изменения query. */
  const _isSyncing = ref(false);

  /** Ждём окончания загрузки списка кандидатов (useDataList.loading). */
  const waitForCandidatesLoaded = async (timeoutMs = 10000) => {
    await nextTick();
    await nextTick();
    const deadline = Date.now() + timeoutMs;
    while (loadingCandidates.value && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 50));
    }
    await nextTick();
  };

  /** Загрузить вакансию по id из route и применить candidate/stage из query. */
  const syncRouteToState = async () => {
    if (_isSyncing.value) return;
    const authToken = useCookie('auth_token').value;
    const authUser = useCookie('auth_user').value;
    if (!authToken || !authUser) {
      if (route.path !== '/auth') {
        void router.replace('/auth');
      }
      return;
    }
    _isSyncing.value = true;
    try {
      const id = route.params.id;
      const vacancyId = Array.isArray(id) ? id[0] : id;
      if (!vacancyId) return;

      const needVacancy =
        !vacancy.value?.id || String(vacancy.value.id) !== String(vacancyId);

      if (needVacancy) {
        await Promise.all([loadVacancy(vacancyId), loadVacancies()]);
        await nextTick();
      }

      // 1. ?candidate=ID — открываем кандидата, этап подставится из БД
      const cidParam = route.query.candidate;
      if (cidParam != null && cidParam !== '') {
        const cid = Number(cidParam);
        if (Number.isInteger(cid) && cid > 0) {
          const sameCandidate =
            Number(selectedCandidate.value?.id) === cid &&
            Number(vacancy.value?.id) === Number(vacancyId);
          if (sameCandidate) {
            return;
          }
          try {
            await loadCandidate(cid, { syncStageFromCandidate: true });
          } catch (error) {
            console.error(
              '[syncRouteToState] Не удалось открыть кандидата из URL:',
              error
            );
            await waitForCandidatesLoaded();
            const list = filteredCandidatesList.value || [];
            if (list.length > 0) {
              await loadCandidate(list[0].id);
            } else {
              selectedCandidate.value = null;
              syncCandidateToUrl(null);
            }
          }
          return;
        }
      }

      // 2. ?stage=ID — выставляем этап, ждём загрузки списка, открываем первого кандидата
      const stageParam = route.query.stage;
      if (stageParam != null && stageParam !== '') {
        const stageId = Number(stageParam);
        if (Number.isInteger(stageId) && stageId > 0 && vacancy.value?.id) {
          selectedStageId.value = stageId;
          isActiveAll.value = false;
          // Дожидаемся реальной загрузки списка (useDataList watch + API)
          await waitForCandidatesLoaded();
          const list = filteredCandidatesList.value || [];
          if (list.length > 0) {
            const result = await getCandidateById(list[0].id);
            selectedCandidate.value = result.candidateData;
            // Обновляем URL на ?candidate=ID; stage убираем
            syncCandidateToUrl(result.candidateData.id);
          }
          return;
        }
      }

      // 3. Нет ни candidate, ни stage — открываем первого в ленте (в т.ч. переход с /activity по ссылке на вакансию)
      await waitForCandidatesLoaded();
      const listNoQuery = filteredCandidatesList.value || [];
      if (listNoQuery.length > 0) {
        await loadCandidate(listNoQuery[0].id, {
          syncStageFromCandidate: false,
        });
      } else {
        selectedCandidate.value = null;
        syncCandidateToUrl(null);
      }
    } finally {
      // Держим флаг ещё 2 тика, чтобы watch не сработал на наше же изменение URL
      await nextTick();
      await nextTick();
      _isSyncing.value = false;
    }
  };

  onMounted(() => {
    isInitialLoad.value = false;
    document.addEventListener('click', onBulkBarDocClick, true);
    window.addEventListener('resize', scheduleBulkBarSplit);
    bulkBarResizeObserver = new ResizeObserver(() => scheduleBulkBarSplit());
  });

  onBeforeUnmount(() => {
    document.removeEventListener('click', onBulkBarDocClick, true);
    window.removeEventListener('resize', scheduleBulkBarSplit);
    bulkBarResizeObserver?.disconnect();
    bulkBarResizeObserver = null;
  });

  watch(
    [selectedCount, bulkActionsOuterRef],
    () => {
      if (selectedCount.value <= 0) {
        bulkBarResizeObserver?.disconnect();
        bulkMoreOpen.value = false;
        return;
      }
      void nextTick(() => {
        const el = bulkActionsOuterRef.value;
        if (el && bulkBarResizeObserver) {
          bulkBarResizeObserver.disconnect();
          bulkBarResizeObserver.observe(el);
        }
        scheduleBulkBarSplit();
      });
    },
    { flush: 'post' }
  );

  // При переходе на страницу вакансии (по ссылке, смена id, candidate или stage) — подгружаем и применяем
  watch(
    () => ({ id: route.params.id, candidate: route.query.candidate, stage: route.query.stage }),
    () => {
      if (_isSyncing.value) return;
      const id = route.params.id;
      if (!route.path?.startsWith?.('/vacancies/') || !id) return;
      void syncRouteToState();
    },
    { immediate: true }
  );

  watch(
    () => filteredCandidatesList.value,
    async newCandidates => {
      if (_isSyncing.value) return;
      if (!newCandidates?.length) return;
      const routeCandidateId = Number(route.query.candidate);
      const hasRouteCandidate =
        Number.isInteger(routeCandidateId) && routeCandidateId > 0;

      // Если кандидат задан в URL и уже открыт, не перезаписываем его.
      if (
        hasRouteCandidate &&
        Number(selectedCandidate.value?.id) === routeCandidateId
      ) {
        return;
      }

      if (!selectedCandidate.value) {
        await loadCandidate(newCandidates[0].id);
      }
    },
    { immediate: false }
  );
</script>

<template>
  <div
    class="container pt-35px"
    :class="selectedCount > 0 ? 'pb-28' : 'pb-5'"
  >
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
          {{ candidatesTotal }}
        </span>
      </button>
      <button
        v-for="(stage, index) in stages"
        :key="stage.id"
        class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium"
        @click="handleStageClick(stage.id)"
        :class="
          selectedStageId === stage.id
            ? 'bg-space text-white'
            : stage.name === 'Нанят на работу'
              ? 'bg-feta text-space'
              : stage.name === 'Отказ'
                ? 'bg-pink text-space'
                : 'bg-transparent text-space'
        "
      >
        <p>{{ stage.name }}</p>
        <span class="text-sm font-medium text-slate-custom">
          {{ (stage as { count?: number }).count ?? candidatesCountByStage[stage.id] ?? 0 }}
        </span>
      </button>
    </div>
    <div v-if="isInitialLoading">
      <UiDotsLoader />
    </div>
    <div v-else>
      <!-- Один контейнер для списка + карточки: левая колонка всегда видна при загруженной вакансии -->
      <!-- items-start: левая колонка по высоте контента, без пустоты под списком -->
      <div class="flex flex-row items-start gap-x-15px">
        <div
          v-if="vacancy"
          class="w-[375px] shrink-0 self-start overflow-hidden rounded-sixteen bg-white"
        >
          <div
            class="border-b border-athens bg-white px-15px pb-15px pt-15px"
          >
            <div class="flex min-w-0 items-center">
              <div
                v-if="filteredCandidatesList.length > 0"
                class="mr-[20px] flex h-10 shrink-0 items-center"
              >
                <MyCheckbox
                  id="vacancy-candidate-select-all"
                  :label="''"
                  :empty-label="true"
                  :model-value="allSelected"
                  @update:model-value="handleSelectAll"
                />
              </div>
              <div class="min-w-0 flex-1">
                <MyInput
                  v-model="candidateSearchQuery"
                  class="h-10 min-h-10 rounded-fifteen border-athens bg-athens-gray text-sm"
                  placeholder="Поиск по кандидатам"
                  :search="true"
                />
              </div>
            </div>
          </div>
          <div
            :class="
              candidateListNeedsInnerScroll
                ? 'max-h-[calc(52px_+_(20_*_74px))] overflow-y-auto overscroll-y-contain'
                : ''
            "
          >
            <CandidateList
              v-if="filteredCandidatesList.length > 0 || loadingCandidates"
              :candidates="filteredCandidatesList || []"
              :selected="selected"
              :show-checkboxes="true"
              :loading="loadingCandidates"
              :active-candidate-id="activeListCandidateId"
              :has-more="candidatesHasMore"
              @item-click="handleCandidateClick"
              @selection-change="handleSelectionChange"
              @load-more="handleCandidatesLoadMore"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center px-4 py-12 text-center text-sm text-slate-custom"
            >
              <p v-if="candidateSearchQuery.trim()">
                Нет кандидатов, подходящих под поиск.
              </p>
              <p v-else>Кандидаты по выбранному этапу не найдены.</p>
            </div>
          </div>
        </div>
        <div
          v-if="selectedCandidate || isLoadingCandidate"
          class="relative min-w-0 flex-1"
        >
          <!-- Первый клик: до ответа API selectedCandidate ещё null — иначе пустая правая колонка «как зависание» -->
          <div
            v-if="isLoadingCandidate && !selectedCandidate"
            class="flex min-h-[320px] items-center justify-center rounded-fifteen bg-white"
          >
            <UiDotsLoader />
          </div>
          <!-- При переключении не размонтируем тяжёлые блоки — только оверлей -->
          <template v-else-if="selectedCandidate">
            <div
              v-if="isLoadingCandidate"
              class="absolute inset-0 z-10 flex items-center justify-center rounded-fifteen bg-white/80"
            >
              <UiDotsLoader />
            </div>
            <BlockCandidateInfo
              ref="candidateInfoRef"
              :candidate="selectedCandidate"
              :stages="stages"
              :isFunnel="true"
              :vacancy="vacancy"
              @candidate-updated="handleCandidateUpdated"
              @candidate-moved="handleCandidateMoved"
              @candidate-deleted="handleCandidateDeleted"
              @add-comment="handleAddCommentFromHeader"
              @add-task="handleAddTaskFromHeader"
              @open-site-chat="handleOpenSiteChatFromHeader"
              @email-sent="refreshCandidateLog"
              @candidate-activity-refresh="refreshCandidateLog"
            />
            <BlockCandidateTabsInfo
              ref="tabsInfoRef"
              :candidate="selectedCandidate"
              :log-refresh-trigger="logRefreshKey"
              :vacancy-id="vacancy?.id"
              @comment-added="refreshCandidateLog"
              @candidate-activity-refresh="refreshCandidateLog"
              @open-email-popup="openEmailPopupFromFeed"
              @candidate-updated="handleCandidateUpdated"
            />
          </template>
        </div>
      </div>
      <div
        v-if="
          !selectedCandidate &&
          vacancy &&
          !loadingCandidates &&
          filteredCandidatesList.length === 0
        "
        class="text-center"
      >
        <template v-if="candidateSearchQuery.trim()">
          По запросу «{{ candidateSearchQuery.trim() }}» никого не нашли. Попробуйте
          другие слова или
          <button
            type="button"
            class="text-dodger underline hover:opacity-90"
            @click="candidateSearchQuery = ''"
          >
            сбросьте поиск
          </button>.
        </template>
        <template v-else>
          Кандидаты в вакансии
          <strong>{{ vacancy?.name }}</strong>
          <span v-if="selectedStage && selectedStage.name !== 'Все'">
            для этапа
            <strong>{{ selectedStage.name }}</strong>
          </span>
          не найдены.
        </template>
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

    <CandidateRefusePopup
      :is-open="bulkRefusePopupOpen"
      @close="bulkRefusePopupOpen = false"
      @submit="onBulkRefuseSubmit"
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

    <Popup
      :is-open="bulkDetachConfirmOpen"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      :no-scrollbar-gutter="true"
      @close="bulkDetachConfirmOpen = false"
    >
      <div class="flex flex-col gap-y-6 text-sm">
        <h2 class="text-xl font-semibold text-space">Открепить от вакансии</h2>
        <p class="text-slate-custom">
          Открепить выбранных кандидатов
          <strong>({{ selectedCount }})</strong>
          от текущей вакансии?
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ten bg-dodger p-semi-btn text-sm font-semibold leading-normal text-white transition-colors hover:opacity-90"
            :disabled="bulkActionLoading"
            @click="confirmBulkDetach"
          >
            Открепить
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ten border border-athens bg-athens-gray p-border-semi-btn text-sm font-medium text-slate-custom"
            :disabled="bulkActionLoading"
            @click="bulkDetachConfirmOpen = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <Popup
      :is-open="bulkDeleteConfirmOpen"
      width="490px"
      :show-close-button="false"
      :lg-size="true"
      :parent-rounded="true"
      :content-rounded="false"
      :content-padding="false"
      :no-scrollbar-gutter="true"
      @close="bulkDeleteConfirmOpen = false"
    >
      <div class="flex flex-col gap-y-6 text-sm">
        <h2 class="text-xl font-semibold text-space">Подтверждение удаления</h2>
        <p class="text-slate-custom">
          Удалить выбранных кандидатов:
          <strong>{{ selectedCount }}</strong>?
        </p>
        <div class="flex gap-x-3">
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ten bg-red-500 p-semi-btn text-sm font-semibold leading-normal text-white transition-colors hover:bg-red-600 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            :disabled="bulkActionLoading"
            @click="confirmBulkDelete"
          >
            Удалить
          </button>
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-ten border border-athens bg-athens-gray p-border-semi-btn text-sm font-medium text-slate-custom transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            :disabled="bulkActionLoading"
            @click="bulkDeleteConfirmOpen = false"
          >
            Отмена
          </button>
        </div>
      </div>
    </Popup>

    <Teleport to="body">
      <Transition name="vacancy-bulk-bar">
        <div
          v-if="selectedCount > 0"
          class="pointer-events-none fixed bottom-4 left-0 right-0 z-[55]"
        >
          <!-- На всю ширину контентной области (.container): список + зазор + карточка -->
          <div class="container pointer-events-auto">
            <div
              class="flex w-full min-w-0 flex-col gap-3 rounded-fifteen bg-space px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-3.5"
              role="region"
              aria-label="Действия с выбранными кандидатами"
            >
              <div
                class="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-4"
              >
                <div class="flex items-center gap-2">
                  <MyCheckbox
                    id="vacancy-bulk-select-all"
                    :label="''"
                    :empty-label="true"
                    :model-value="allSelected"
                    @update:model-value="handleSelectAll"
                  />
                  <button
                    type="button"
                    class="border-0 bg-transparent p-0 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                    :disabled="
                      bulkActionLoading || !(filteredCandidatesList || []).length
                    "
                    @click="handleSelectAll(!allSelected)"
                  >
                    Выбрать всех
                  </button>
                </div>
                <span
                  class="hidden h-4 w-px shrink-0 bg-white/25 sm:block"
                  aria-hidden="true"
                />
                <p class="text-sm text-white/70">
                  Выбрано:
                  <span class="font-medium text-white">{{ selectedCount }}</span>
                </p>
              </div>

              <div
                ref="bulkActionsOuterRef"
                class="relative min-w-0 flex-1 sm:flex-initial"
              >
                <!-- Скрытая строка для замеров ширины кнопок (та же типографика) -->
                <div
                  ref="bulkMeasureRowRef"
                  class="pointer-events-none absolute left-0 top-0 -z-10 flex w-full flex-nowrap gap-3 opacity-0"
                  aria-hidden="true"
                >
                  <button
                    v-for="a in bulkBarActionsList"
                    :key="'bulk-measure-' + a.id"
                    type="button"
                    tabindex="-1"
                    data-bulk-measure-chip
                    :class="bulkBarChipClass"
                  >
                    <svg-icon
                      :name="a.icon"
                      width="16"
                      height="16"
                      class="shrink-0"
                      :class="a.iconClass"
                    />
                    {{ a.label }}
                  </button>
                </div>

                <!-- overflow-x только у «ленты» кнопок; «Ещё» снаружи — иначе обрезается dropdown (bottom-full) -->
                <div
                  class="flex min-w-0 flex-nowrap items-center gap-3 overflow-visible"
                >
                  <div
                    class="flex min-h-0 min-w-0 flex-1 flex-nowrap items-center gap-3 overflow-x-auto"
                  >
                    <button
                      v-for="a in bulkBarPinnedActions"
                      :key="'bulk-pin-' + a.id"
                      type="button"
                      :class="[bulkBarChipClass, 'shrink-0']"
                      :disabled="bulkActionLoading"
                      @click="runBulkBarAction(a.id)"
                    >
                      <svg-icon
                        :name="a.icon"
                        width="16"
                        height="16"
                        class="shrink-0"
                        :class="a.iconClass"
                      />
                      {{ a.label }}
                    </button>
                    <button
                      v-for="a in bulkBarVisiblePoolActions"
                      :key="'bulk-pool-' + a.id"
                      type="button"
                      :class="[bulkBarChipClass, 'shrink-0']"
                      :disabled="bulkActionLoading"
                      @click="runBulkBarAction(a.id)"
                    >
                      <svg-icon
                        :name="a.icon"
                        width="16"
                        height="16"
                        class="shrink-0"
                        :class="a.iconClass"
                      />
                      {{ a.label }}
                    </button>
                  </div>

                  <div
                    v-if="bulkBarOverflowMenuActions.length"
                    class="relative shrink-0"
                  >
                    <button
                      type="button"
                      :class="bulkBarChipClass"
                      :disabled="bulkActionLoading"
                      :aria-expanded="bulkMoreOpen"
                      aria-haspopup="true"
                      @click.stop="bulkMoreOpen = !bulkMoreOpen"
                    >
                      <svg-icon
                        name="dropdown-arrow"
                        width="14"
                        height="14"
                        class="shrink-0 text-white/80 transition-transform"
                        :class="{ 'rotate-180': bulkMoreOpen }"
                      />
                      Ещё
                    </button>
                    <div
                      v-show="bulkMoreOpen"
                      class="absolute bottom-full right-0 z-[70] mb-1.5 min-w-[260px] rounded-ten border border-white/15 bg-space py-1 shadow-[0_-4px_24px_rgba(0,0,0,0.25)]"
                      role="menu"
                      @click.stop
                    >
                      <button
                        v-for="a in bulkBarOverflowMenuActions"
                        :key="'bulk-more-' + a.id"
                        type="button"
                        role="menuitem"
                        class="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-normal text-white/90 hover:bg-white/10 disabled:opacity-40"
                        :disabled="bulkActionLoading"
                        @click="runBulkBarAction(a.id)"
                      >
                        <svg-icon
                          :name="a.icon"
                          width="16"
                          height="16"
                          class="shrink-0"
                          :class="a.iconClass"
                        />
                        {{ a.label }}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
  .vacancy-bulk-bar-enter-active,
  .vacancy-bulk-bar-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }
  .vacancy-bulk-bar-enter-from,
  .vacancy-bulk-bar-leave-to {
    opacity: 0;
    transform: translateY(12px);
  }

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
