<script lang="ts" setup>
  import { ref, onMounted, computed, watch, nextTick } from 'vue';
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
  import type { VacancyStage } from '@/types/vacancy';

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

  // Список уже отфильтрован на сервере по выбранному этапу (candidateFilter)
  const filteredCandidatesList = computed(() => {
    return candidatesList.value ?? [];
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

      // 3. Нет ни candidate, ни stage — сброс
      selectedCandidate.value = null;
      syncCandidateToUrl(null);
    } finally {
      // Держим флаг ещё 2 тика, чтобы watch не сработал на наше же изменение URL
      await nextTick();
      await nextTick();
      _isSyncing.value = false;
    }
  };

  onMounted(() => {
    isInitialLoad.value = false;
  });

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
  <div class="container pt-35px pb-5">
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
              :all-selected="allSelected"
              :loading="loadingCandidates"
              :active-candidate-id="activeListCandidateId"
              :has-more="candidatesHasMore"
              @item-click="handleCandidateClick"
              @selection-change="handleSelectionChange"
              @select-all="handleSelectAll"
              @load-more="handleCandidatesLoadMore"
            />
            <div
              v-else
              class="flex flex-col items-center justify-center px-4 py-12 text-center text-sm text-slate-custom"
            >
              <p>Кандидаты по выбранному этапу не найдены.</p>
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
              @email-sent="refreshCandidateLog"
              @candidate-activity-refresh="refreshCandidateLog"
            />
            <BlockCandidateTabsInfo
              ref="tabsInfoRef"
              :candidate="selectedCandidate"
              :log-refresh-trigger="logRefreshKey"
              :vacancy-id="vacancy?.id"
              @comment-added="refreshCandidateLog"
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
        Кандидаты в вакансии
        <strong>{{ vacancy?.name }}</strong>
        <span v-if="selectedStage && selectedStage.name !== 'Все'">
          для этапа
          <strong>{{ selectedStage.name }}</strong>
        </span>
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
