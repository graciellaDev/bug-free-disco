<script setup>
  import VacancyCard from '~/components/custom/page-parts/VacancyCard.vue';
  import Pagination from '@/components/custom/Pagination.vue';
  import MultiSelect from '~/components/custom/MultiSelect.vue';
  import ListSectionPlaceholder from '~/components/custom/ListSectionPlaceholder.vue';
  import DropdownPeriodPicker from '@/components/custom/DropdownPeriodPicker.vue';

  import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue';
  import { getVacancies, getVacancyCities } from '~/utils/getVacancies';
  import { clientsList } from '@/utils/clientsList';
  import { getDepartments, responsiblesList } from '@/utils/executorsList';

  import VacancyCardDropdown from '@/src/data/vacancy-card-dropdown.json';
  import VacancyCardDraftDropdown from '@/src/data/vacancy-card-draft-dropdown.json';
  import VacancyCardClosedDropdown from '@/src/data/vacancy-card-closed-dropdown.json';
  import VacancyCardArchiveDropdown from '@/src/data/vacancy-card-archive-dropdown.json';

  const isHoveredFunnel = ref(false);
  const isActiveFunnel = ref(false);
  const isHoveredSort = ref(false);
  const isActiveSort = ref(false);
  /** Режим сортировки: new | old | urgent | non-urgent | asc | desc */
  const sortMode = ref('new');
  const vacancies = ref([]);
  const vacanciesDraft = ref([]);
  const vacanciesClosed = ref([]);
  const vacanciesArchive = ref([]);
  const currentPage = ref(1);
  const currentDraftPage = ref(1);
  const currentClosedPage = ref(1);
  const currentArchivePage = ref(1);
  const itemsPerPage = 10;
  const itemsDraftPerPage = 10;
  const itemsClosedPerPage = 10;
  const itemsArchivePerPage = 10;
  const cardsBlock = ref(null);
  const selectedMore = ref([]);
  const activeVacancies = ref(true);
  const draftVacancies = ref(false);
  const closedVacancies = ref(false);
  const archiveVacancies = ref(false);
  const containerHeight = ref(0); // отслеживаю высоту контейнера
  const containerRef = ref(null); // ссылка на контейнер
  const loading = ref(true);
  const tabLoading = ref(false);
  const loadedStatuses = ref(new Set());
  const filterDictionariesLoaded = ref(false);
  const clients = ref([]);
  const recruiters = ref([]);
  const departments = ref([]);
  const responsibles = ref([]);
  const filters = ref({
    city: [],
    department: [],
    create: { from: null, to: null },
    close: { from: null, to: null },
    responsible: [],
    executor: [],
    client: [],
  });
  /** Опции для фильтра «Город» (список городов) */
  const citiesFilterOptions = ref([]);
  /** Опции для фильтра «Отдел» (только отделы, без подразделений) */
  const departmentsFilterOptions = ref([]);
  /** Опции для мультиселектов: рекрутер, заказчик, согласующий — { value, name } */
  const recruitersOptions = computed(() =>
    (recruiters.value || []).map((r) => ({ value: r.id, name: r.name || '' }))
  );
  const clientsOptions = computed(() =>
    (clients.value || []).map((c) => ({ value: c.id, name: c.name || '' }))
  );
  const responsiblesOptions = computed(() =>
    (responsibles.value || []).map((r) => ({ value: r.id, name: r.name || '' }))
  );

  /** Есть ли активные фильтры (для подсветки иконки фильтра) */
  const activeEmptyTitle = computed(() =>
    hasActiveFilters.value ? 'Ничего не найдено' : 'Пока нет открытых вакансий'
  );

  const activeEmptyDescription = computed(() =>
    hasActiveFilters.value
      ? 'Попробуйте изменить фильтры или сбросить их, чтобы увидеть другие вакансии.'
      : 'Создайте первую вакансию — затем ведите кандидатов и размещайте объявления на работных сайтах.'
  );

  const hasActiveFilters = computed(() => {
    const f = filters.value;
    return (
      (Array.isArray(f.city) && f.city.length > 0) ||
      (Array.isArray(f.department) && f.department.length > 0) ||
      (Array.isArray(f.responsible) && f.responsible.length > 0) ||
      (Array.isArray(f.executor) && f.executor.length > 0) ||
      (Array.isArray(f.client) && f.client.length > 0) ||
      (f.create?.from || f.create?.to) ||
      (f.close?.from || f.close?.to)
    );
  });

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(vacancies.value.length / itemsPerPage))
  );
  const totalDraftPages = computed(() =>
    Math.max(1, Math.ceil(vacanciesDraft.value.length / itemsDraftPerPage))
  );
  const totalClosedPages = computed(() =>
    Math.max(1, Math.ceil(vacanciesClosed.value.length / itemsClosedPerPage))
  );
  const totalArchivePages = computed(() =>
    Math.max(1, Math.ceil(vacanciesArchive.value.length / itemsArchivePerPage))
  );

  const paginatedVacancies = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage;
    return vacancies.value.slice(startIndex, startIndex + itemsPerPage);
  });

  const paginatedDraftVacancies = computed(() => {
    const startIndex = (currentDraftPage.value - 1) * itemsDraftPerPage;
    return vacanciesDraft.value.slice(
      startIndex,
      startIndex + itemsDraftPerPage
    );
  });

  const paginatedClosedVacancies = computed(() => {
    const startIndex = (currentClosedPage.value - 1) * itemsClosedPerPage;
    return vacanciesClosed.value.slice(
      startIndex,
      startIndex + itemsClosedPerPage
    );
  });

  const paginatedArchiveVacancies = computed(() => {
    const startIndex = (currentArchivePage.value - 1) * itemsArchivePerPage;
    return vacanciesArchive.value.slice(
      startIndex,
      startIndex + itemsArchivePerPage
    );
  });

  const updateFilters = () => {};

  const filtersPanelRef = ref(null);
  const funnelButtonRef = ref(null);

  function handleFiltersClickOutside(event) {
    if (!isActiveFunnel.value) return;
    const path = event.composedPath ? event.composedPath() : [event.target];
    const insidePanel = path.some((el) => {
      if (!el || !(el instanceof Node)) return false;
      if (filtersPanelRef.value && filtersPanelRef.value.contains(el)) return true;
      if (funnelButtonRef.value && funnelButtonRef.value.contains(el)) return true;
      if (el.getAttribute?.('role') === 'listbox' || el.getAttribute?.('role') === 'presentation') return true;
      if (el.closest?.('[role="listbox"]') || el.closest?.('[role="presentation"]')) return true;
      if (el.closest?.('.calendar-wrapper')) return true;
      return false;
    });
    if (!insidePanel) isActiveFunnel.value = false;
  }

  function handlePageChange(page) {
    currentPage.value = page;
  }

  function handleDraftPageChange(page) {
    currentDraftPage.value = page;
  }

  function handleClosedPageChange(page) {
    currentClosedPage.value = page;
  }

  function handleArchivePageChange(page) {
    currentArchivePage.value = page;
  }

  function funnelToggleActive() {
    isActiveFunnel.value = !isActiveFunnel.value;
    if (!cardsBlock.value) return;
    cardsBlock.value.style.borderBottomLeftRadius = isActiveFunnel.value
      ? '0px'
      : '15px';
    cardsBlock.value.style.borderBottomRightRadius = isActiveFunnel.value
      ? '0px'
      : '15px';
  }

  function sortToggleActive() {
    isActiveSort.value = !isActiveSort.value;
    if (cardsBlock.value) {
      cardsBlock.value.style.borderBottomLeftRadius = isActiveSort.value
        ? '0px'
        : '15px';
      cardsBlock.value.style.borderBottomRightRadius = isActiveSort.value
        ? '0px'
        : '15px';
    }
  }

  async function applySort(mode) {
    sortMode.value = mode;
    isActiveSort.value = false;
    if (cardsBlock.value) {
      cardsBlock.value.style.borderBottomLeftRadius = '15px';
      cardsBlock.value.style.borderBottomRightRadius = '15px';
    }
    loading.value = true;
    try {
      const statusParam =
        activeVacancies.value
          ? 'filters[status]=active'
          : draftVacancies.value
            ? 'filters[status]=draft'
            : closedVacancies.value
              ? 'filters[status]=closed'
              : 'filters[status]=archive';
      const params = `${statusParam}&sort=${mode}`;
      const result = await getVacancies(params);
      const list = result ?? [];
      if (activeVacancies.value) vacancies.value = list;
      else if (draftVacancies.value) vacanciesDraft.value = list;
      else if (closedVacancies.value) vacanciesClosed.value = list;
      else vacanciesArchive.value = list;
    } catch (e) {
      console.warn('Ошибка сортировки:', e);
    } finally {
      loading.value = false;
    }
  }

  async function loadVacanciesForStatus(status) {
    const params = buildFilterParams(status);
    const result = await getVacancies(params);
    const list = Array.isArray(result) ? result : [];
    if (status === 'active') vacancies.value = list;
    else if (status === 'draft') vacanciesDraft.value = list;
    else if (status === 'closed') vacanciesClosed.value = list;
    else vacanciesArchive.value = list;
    loadedStatuses.value = new Set([...loadedStatuses.value, status]);
    return list;
  }

  async function ensureTabVacancies(status) {
    if (loadedStatuses.value.has(status)) return;
    tabLoading.value = true;
    try {
      await loadVacanciesForStatus(status);
    } catch (e) {
      console.warn(`Ошибка загрузки вакансий (${status}):`, e);
    } finally {
      tabLoading.value = false;
      await updateContainerHeight();
    }
  }

  function showActiveVacancies() {
    activeVacancies.value = true;
    draftVacancies.value = false;
    closedVacancies.value = false;
    archiveVacancies.value = false;
    void ensureTabVacancies('active');
  }

  function showDraftVacancies() {
    activeVacancies.value = false;
    draftVacancies.value = true;
    closedVacancies.value = false;
    archiveVacancies.value = false;
    void ensureTabVacancies('draft');
  }

  function showClosedVacancies() {
    activeVacancies.value = false;
    draftVacancies.value = false;
    closedVacancies.value = true;
    archiveVacancies.value = false;
    void ensureTabVacancies('closed');
  }

  function showArchiveVacancies() {
    activeVacancies.value = false;
    draftVacancies.value = false;
    closedVacancies.value = false;
    archiveVacancies.value = true;
    void ensureTabVacancies('archive');
  }

  // Функция для обновления высоты контейнера
  async function updateContainerHeight() {
    await nextTick();
    if (containerRef.value) {
      const activeBlock = containerRef.value.querySelector('.active-view');
      containerHeight.value = activeBlock?.offsetHeight || 0;
    }
  }


  // Обработчик удаления вакансии
  const handleVacancyDeleted = async vacancyId => {
    if (activeVacancies.value) {
      vacancies.value = vacancies.value.filter((v) => v.id !== vacancyId);
    } else if (draftVacancies.value) {
      vacanciesDraft.value = vacanciesDraft.value.filter((v) => v.id !== vacancyId);
    } else if (closedVacancies.value) {
      vacanciesClosed.value = vacanciesClosed.value.filter((v) => v.id !== vacancyId);
    } else if (archiveVacancies.value) {
      vacanciesArchive.value = vacanciesArchive.value.filter((v) => v.id !== vacancyId);
    }
    await updateContainerHeight();
  };

  const handleVacancyStatusChanged = async (vacancyId, newStatus) => {
    if (activeVacancies.value) {
      vacancies.value = vacancies.value.filter((v) => v.id !== vacancyId);
    } else if (draftVacancies.value) {
      vacanciesDraft.value = vacanciesDraft.value.filter((v) => v.id !== vacancyId);
    } else if (closedVacancies.value) {
      vacanciesClosed.value = vacanciesClosed.value.filter((v) => v.id !== vacancyId);
    } else if (archiveVacancies.value) {
      vacanciesArchive.value = vacanciesArchive.value.filter((v) => v.id !== vacancyId);
    }
    try {
      const params = await buildFilterParams(newStatus);
      const list = await getVacancies(params);
      const data = Array.isArray(list) ? list : [];
      if (newStatus === 'active') vacancies.value = data;
      else if (newStatus === 'draft') vacanciesDraft.value = data;
      else if (newStatus === 'closed') vacanciesClosed.value = data;
      else if (newStatus === 'archive') vacanciesArchive.value = data;
    } catch (e) {
      console.warn('Ошибка обновления списка после смены статуса:', e);
    }
  };

  async function loadFilterDictionaries() {
    if (filterDictionariesLoaded.value) return;
    filterDictionariesLoaded.value = true;
    try {
      const [{ clients: responseClients, errors: clientsErr }, { clients: responseRecruiters, errors: recruitersErr }] =
        await Promise.all([clientsList('clients'), clientsList('recruiters')]);
      if (!clientsErr) {
        clients.value = responseClients;
      }
      if (!recruitersErr) {
        recruiters.value = responseRecruiters;
      }
    } catch (e) {
      filterDictionariesLoaded.value = false;
      console.warn('Ошибка загрузки справочников фильтров:', e);
    }
  }

  async function loadFilterFormDictionaries() {
    try {
      const [depts, deptsRaw, respList, citiesList] = await Promise.all([
        getDepartments(),
        getDepartments(true).catch(() => null),
        responsiblesList(),
        getVacancyCities(),
      ]);
      departments.value = depts || [];
      responsibles.value = respList || [];
      if (Array.isArray(citiesList) && citiesList.length) {
        citiesFilterOptions.value = citiesList.map((name) => ({ value: name, name }));
      }
      if (deptsRaw && Array.isArray(deptsRaw)) {
        departmentsFilterOptions.value = deptsRaw.map((d) => ({
          value: d.id,
          name: d.name || '',
        }));
      }
    } catch (e) {
      console.warn('Ошибка загрузки справочников:', e);
    }
  }

  function loadOtherTabsInBackground() {
    const others = ['draft', 'closed', 'archive'].filter(
      (s) => !loadedStatuses.value.has(s)
    );
    if (!others.length) return;
    void Promise.all(others.map((s) => loadVacanciesForStatus(s)))
      .then(() => updateContainerHeight())
      .catch((e) => console.warn('Ошибка фоновой загрузки табов:', e));
  }

  onMounted(() => {
    document.addEventListener('click', handleFiltersClickOutside);
    void (async () => {
      loading.value = true;
      try {
        await loadVacanciesForStatus('active');
      } catch (e) {
        console.warn('Ошибка загрузки открытых вакансий:', e);
      } finally {
        loading.value = false;
        await updateContainerHeight();
      }
      loadOtherTabsInBackground();
      void loadFilterFormDictionaries();
    })();
  });

  watch(isActiveFunnel, (open) => {
    if (open) void loadFilterDictionaries();
  });

  function buildFilterParams(forceStatus) {
    const status = forceStatus ?? (activeVacancies.value ? 'active' : draftVacancies.value ? 'draft' : closedVacancies.value ? 'closed' : 'archive');
    const parts = [`filters[status]=${status}`, `sort=${sortMode.value}`];
    const f = filters.value;
    const cityList = Array.isArray(f.city) ? f.city : [];
    if (cityList.length) {
      cityList.forEach((v) => parts.push(`filters[city][]=${encodeURIComponent(String(v))}`));
    }
    if (f.department?.length) {
      f.department.forEach((v) => parts.push(`filters[department][]=${encodeURIComponent(v)}`));
    }
    if (f.executor?.length) {
      f.executor.forEach((v) => parts.push(`filters[executor][]=${v}`));
    }
    if (f.client?.length) {
      f.client.forEach((v) => parts.push(`filters[client][]=${v}`));
    }
    if (f.responsible?.length) {
      f.responsible.forEach((v) => parts.push(`filters[responsible][]=${v}`));
    }
    if (f.create?.from || f.create?.to) {
      const from = f.create.from || '01.01.1970';
      const to = f.create.to || '01.01.3000';
      parts.push(`filters[create]=${from};${to}`);
    }
    if (f.close?.from || f.close?.to) {
      const from = f.close.from || '01.01.1970';
      const to = f.close.to || '01.01.3000';
      parts.push(`filters[close]=${from};${to}`);
    }
    return parts.join('&');
  }

  /** Перезагрузка всех табов (после применения или сброса фильтров). */
  async function loadAllVacancyLists() {
    loading.value = true;
    loadedStatuses.value = new Set();
    try {
      await Promise.all([
        loadVacanciesForStatus('active'),
        loadVacanciesForStatus('draft'),
        loadVacanciesForStatus('closed'),
        loadVacanciesForStatus('archive'),
      ]);
    } catch (e) {
      console.warn('Ошибка загрузки списков вакансий:', e);
    } finally {
      loading.value = false;
      await updateContainerHeight();
    }
  }

  const filteredVacancies = async () => {
    await loadAllVacancyLists();
    isActiveFunnel.value = false;
  };

  function resetFilters() {
    filters.value = {
      city: [],
      department: [],
      create: { from: null, to: null },
      close: { from: null, to: null },
      responsible: [],
      executor: [],
      client: [],
    };
    loadAllVacancyLists();
    isActiveFunnel.value = false;
  }

  // Следим за изменением активных блоков
  watch(
    [activeVacancies, draftVacancies, closedVacancies, archiveVacancies],
    updateContainerHeight
  );

  onBeforeUnmount(() => {
    document.removeEventListener('click', handleFiltersClickOutside);
  });

  const totalVacancyCount = computed(
    () =>
      vacancies.value.length +
      vacanciesDraft.value.length +
      vacanciesClosed.value.length +
      vacanciesArchive.value.length
  );

  const showListPageHeader = computed(
    () => loading.value || totalVacancyCount.value > 0
  );
</script>

<template>
  <div class="pb-28px container pt-35px relative">
    <!-- header block -->
    <div
      v-if="showListPageHeader"
      class="flex w-full items-center justify-between rounded-t-fifteen bg-white p-25px"
    >
      <div>
        <p class="mb-2.5 text-xl font-semibold leading-normal text-space">
          Вакансии
        </p>
        <p class="text-sm font-normal leading-relaxed text-slate-custom">
          Открывайте позиции, ведите воронку кандидатов и размещайте на работных сайтах
        </p>
      </div>
      <NuxtLink to="/vacancies/newvacancy">
        <span
          class="rounded-ten bg-dodger px-[19px] py-11.5px text-sm font-semibold text-white"
        >
          Добавить вакансию
        </span>
      </NuxtLink>
    </div>
    <!-- cards block: табы и фильтры — только если есть хотя бы одна вакансия -->
    <div
      v-if="showListPageHeader"
      class="filters-wrapper relative mb-15px rounded-b-[10px] bg-catskill px-25px pt-[16px] pb-[16px] transition-all"
      ref="cardsBlock"
    >
      <div class="flex justify-between">
        <div class="flex">
          <div class="mr-2.5 flex justify-between gap-x-2.5">
            <button
              class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium"
              @click="showActiveVacancies()"
              style="
                transition-property: background-color, color;
                transition-duration: 0.2s;
                transition-timing-function: ease-in-out;
              "
              :class="
                activeVacancies
                  ? 'bg-space text-white'
                  : 'bg-transparent text-space'
              "
            >
              <p>Открытые</p>
              <span class="text-sm font-medium text-slate-custom">
                {{ vacancies.length }}
              </span>
            </button>
            <button
              class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium text-space"
              @click="showDraftVacancies()"
              style="
                transition-property: background-color, color;
                transition-duration: 0.2s;
                transition-timing-function: ease-in-out;
              "
              :class="
                draftVacancies
                  ? 'bg-space text-white'
                  : 'bg-transparent text-space'
              "
            >
              <p>Приостановлены</p>
              <span class="text-sm font-medium text-slate-custom">
                {{ vacanciesDraft.length }}
              </span>
            </button>
            <button
              class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium text-space"
              @click="showClosedVacancies()"
              style="
                transition-property: background-color, color;
                transition-duration: 0.2s;
                transition-timing-function: ease-in-out;
              "
              :class="
                closedVacancies
                  ? 'bg-space text-white'
                  : 'bg-transparent text-space'
              "
            >
              <p>Закрыты</p>
              <span class="text-sm font-medium text-slate-custom">
                {{ vacanciesClosed.length }}
              </span>
            </button>
            <button
              class="flex cursor-pointer gap-x-2.5 rounded-ten px-15px py-2.5 text-sm font-medium text-space"
              @click="showArchiveVacancies()"
              style="
                transition-property: background-color, color;
                transition-duration: 0.2s;
                transition-timing-function: ease-in-out;
              "
              :class="
                archiveVacancies
                  ? 'bg-space text-white'
                  : 'bg-transparent text-space'
              "
            >
              <p>Архив</p>
              <span class="text-sm font-medium text-slate-custom">
                {{ vacanciesArchive.length }}
              </span>
            </button>
          </div>
        </div>
        <div class="flex gap-x-15px">
          <div class="relative">
            <button
              class="rounded-ten border p-2.5 transition-colors"
              @mouseover="isHoveredSort = true"
              @mouseleave="isHoveredSort = false"
              @click="sortToggleActive()"
              :class="
                isHoveredSort
                  ? 'border-zumthor bg-zumthor text-dodger'
                  : 'border-athens bg-white text-slate-custom'
              "
            >
              <svg-icon name="sort-list" width="20" height="20" />
            </button>
            <transition name="fade">
              <div
                v-if="isActiveSort"
                class="sort-dropdown absolute left-0 left-[unset] right-0 top-[50px] z-10 w-max max-w-[calc(100vw-32px)] rounded-b-ten rounded-t-ten bg-white py-15px shadow-xl"
              >
                <p class="sort-dropdown__title px-25px pb-15px text-base font-semibold leading-normal text-space">
                  Сортировка
                </p>
                <div class="sort-dropdown__group">
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'new' }"
                    @click="applySort('new')"
                  >
                    <span class="whitespace-nowrap">Сначала недавно созданные</span>
                    <svg-icon v-if="sortMode === 'new'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'old' }"
                    @click="applySort('old')"
                  >
                    <span class="whitespace-nowrap">Сначала давно созданные</span>
                    <svg-icon v-if="sortMode === 'old'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                </div>
                <div class="sort-dropdown__divider" />
                <div class="sort-dropdown__group">
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'urgent' }"
                    @click="applySort('urgent')"
                  >
                    <span class="whitespace-nowrap">По дате закрытия. Сначала срочные</span>
                    <svg-icon v-if="sortMode === 'urgent'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'non-urgent' }"
                    @click="applySort('non-urgent')"
                  >
                    <span class="whitespace-nowrap">По дате закрытия. Сначала несрочные</span>
                    <svg-icon v-if="sortMode === 'non-urgent'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                </div>
                <div class="sort-dropdown__divider" />
                <div class="sort-dropdown__group">
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'asc' }"
                    @click="applySort('asc')"
                  >
                    <span class="whitespace-nowrap">По названию от А до Я</span>
                    <svg-icon v-if="sortMode === 'asc'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                  <button
                    type="button"
                    class="sort-dropdown__item flex w-full items-center justify-between gap-x-3 px-25px py-10px text-left text-sm font-normal text-space transition-colors hover:bg-athens-gray"
                    :class="{ 'bg-athens-gray/60': sortMode === 'desc' }"
                    @click="applySort('desc')"
                  >
                    <span class="whitespace-nowrap">По названию от Я до А</span>
                    <svg-icon v-if="sortMode === 'desc'" name="arrow-min-dropdown" width="16" height="16" class="shrink-0 text-dodger" />
                  </button>
                </div>
              </div>
            </transition>
          </div>
          <button
            ref="funnelButtonRef"
            class="rounded-ten border p-2.5 transition-colors"
            @mouseover="isHoveredFunnel = true"
            @mouseleave="isHoveredFunnel = false"
            @click="funnelToggleActive()"
            :class="
              isHoveredFunnel || hasActiveFilters
                ? 'border-zumthor bg-zumthor text-dodger'
                : 'border-athens bg-white text-slate-custom'
            "
          >
            <svg-icon name="funnel" width="20" height="20" />
          </button>
        </div>
      </div>
      <transition name="fade">
        <div
          v-if="isActiveFunnel"
          ref="filtersPanelRef"
          class="filters-wrapper relative left-0 top-[10px] z-10 w-full rounded-b-ten bg-white p-25px pt-15px"
          @click="event => updateFilters(event)"
        >
          <p class="mb-35px text-18px font-medium leading-normal text-space">
            Фильтры
          </p>
          <div class="filters mb-6 grid grid-cols-4 gap-15px">
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Город</p>
              <MultiSelect
                v-model="filters.city"
                :options="citiesFilterOptions"
                placeholder="Выберите город"
                defaultValue="Выберите города"
                class="w-full"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Отдел</p>
              <MultiSelect
                v-model="filters.department"
                :options="departmentsFilterOptions"
                placeholder="Выберите отдел"
                defaultValue="Выберите отделы"
                class="w-full"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Период создания</p>
              <DropdownPeriodPicker
                :model-value="{ from: filters.create.from, to: filters.create.to }"
                @update:model-value="v => { filters.create.from = v?.from ?? null; filters.create.to = v?.to ?? null }"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Период закрытия</p>
              <DropdownPeriodPicker
                :model-value="{ from: filters.close.from, to: filters.close.to }"
                @update:model-value="v => { filters.close.from = v?.from ?? null; filters.close.to = v?.to ?? null }"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Согласующий</p>
              <MultiSelect
                v-model="filters.responsible"
                :options="responsiblesOptions"
                placeholder="Выберите согласующего"
                defaultValue="Выберите согласующих"
                class="w-full"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Рекрутер</p>
              <MultiSelect
                v-model="filters.executor"
                :options="recruitersOptions"
                placeholder="Выберите рекрутера"
                defaultValue="Выберите рекрутеров"
                class="w-full"
              />
            </div>
            <div>
              <p class="mb-3.5 text-sm font-medium text-space">Заказчик</p>
              <MultiSelect
                v-model="filters.client"
                :options="clientsOptions"
                placeholder="Выберите заказчика"
                defaultValue="Выберите заказчиков"
                class="w-full"
              />
            </div>
          </div>
          <!-- <div class="mb-35px">
              <p class="text-sm font-medium text-space mb-3">Дополнительно</p>
              <div class="flex flex-col gap-y-2.5">
                <CheckboxGroup
                  :options="checkboxOptions"
                  v-model="selectedMore"
                />
              </div>
            </div> -->
          <div class="flex flex-wrap gap-2">
            <UiButton
              variant="action"
              size="semiaction"
              @click="filteredVacancies"
            >
              Применить
            </UiButton>
            <UiButton
              variant="semiaction"
              size="semiaction"
              class="text-space"
              @click="resetFilters"
            >
              Сбросить фильтры
            </UiButton>
          </div>
        </div>
      </transition>
      <!-- <transition name="fade">
          <div
            v-if="isActiveSort"
            class="relative bg-white w-full top-[10px] left-0 p-25px pt-15px rounded-b-ten z-10"
          >
            <p class="text-18px font-medium text-space leading-normal mb-25px">
              Фильтры
            </p>
            <div class="flex gap-x-2.5">
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('new')"
              >
                Новые
              </button>
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('old')"
              >
                Старые
              </button>
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('urgent')"
              >
                Срочные
              </button>
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('non-urgent')"
              >
                Несрочные
              </button>
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('asc')"
              >
                От А до Я
              </button>
              <button
                class="rounded-ten px-2.5 py-5px bg-athens-gray text-sm font-normal text-slate-custom"
                @click="sort('desc')"
              >
                От Я до А
              </button>
            </div>
          </div>
        </transition> -->
      <!-- </div> -->
    </div>
    <div
      ref="containerRef"
      :style="containerHeight > 0 ? { height: `${containerHeight}px` } : undefined"
      class="relative overflow-visible"
    >
      <transition name="fade" @after-enter="updateContainerHeight">
        <div v-if="activeVacancies" class="active-view absolute w-full">
          <div
            class="[&>*:not(:last-child)]:mb-15px"
            v-if="vacancies.length > 0"
            :class="totalPages === 1 ? 'pb-52' : 'pb-0'"
          >
            <VacancyCard
              v-for="(vacancy, index) in paginatedVacancies"
              :key="vacancy.id"
              :vacancy="vacancy"
              current-status="active"
              @vacancy-deleted="handleVacancyDeleted"
              @vacancy-status-changed="handleVacancyStatusChanged"
              :dropdownItems="VacancyCardDropdown"
              :class="{ 'mb-4': index !== paginatedVacancies.length - 1 }"
            />
            <Pagination
              v-if="totalPages > 1"
              :current-page="currentPage"
              :last-page="totalPages"
              @page-changed="handlePageChange"
            />
          </div>
          <ListSectionPlaceholder
            v-if="(loading || tabLoading) && activeVacancies"
            variant="vacancy"
            loading
          />
          <ListSectionPlaceholder
            v-else-if="vacancies.length === 0"
            variant="vacancy"
            :title="activeEmptyTitle"
            :description="activeEmptyDescription"
          >
            <NuxtLink
              v-if="!hasActiveFilters"
              to="/vacancies/newvacancy"
              class="inline-flex items-center justify-center rounded-ten bg-dodger px-[19px] py-11.5px text-sm font-semibold text-white transition-colors hover:bg-[#4680e6]"
            >
              Добавить вакансию
            </NuxtLink>
          </ListSectionPlaceholder>
        </div>
      </transition>
      <transition name="fade" @after-enter="updateContainerHeight">
        <div v-if="draftVacancies" class="active-view absolute w-full">
          <ListSectionPlaceholder
            v-if="(loading || tabLoading) && draftVacancies"
            variant="vacancy"
            loading
          />
          <ListSectionPlaceholder
            v-else-if="vacanciesDraft.length === 0"
            variant="vacancy"
            title="Черновиков пока нет"
            description="Здесь появятся вакансии, которые вы сохранили как черновик и ещё не опубликовали."
          />
          <div v-if="vacanciesDraft.length > 0" class="flex flex-col gap-15px">
            <VacancyCard
              v-for="(vacancy, index) in paginatedDraftVacancies"
              :key="vacancy.id"
              :vacancy="vacancy"
              current-status="draft"
              @vacancy-deleted="handleVacancyDeleted"
              @vacancy-status-changed="handleVacancyStatusChanged"
              :dropdownItems="VacancyCardDraftDropdown"
              :class="{ 'mb-4': index !== paginatedDraftVacancies.length - 1 }"
            />
            <Pagination
              v-if="totalDraftPages > 1"
              :current-page="currentDraftPage"
              :last-page="totalDraftPages"
              @page-changed="handleDraftPageChange"
            />
          </div>
        </div>
      </transition>
      <transition name="fade" @after-enter="updateContainerHeight">
        <div v-if="closedVacancies" class="active-view absolute w-full">
          <ListSectionPlaceholder
            v-if="(loading || tabLoading) && closedVacancies"
            variant="vacancy"
            loading
          />
          <ListSectionPlaceholder
            v-else-if="vacanciesClosed.length === 0"
            variant="vacancy"
            title="Закрытых вакансий пока нет"
            description="После закрытия позиции она появится в этом списке."
          />
          <div v-if="vacanciesClosed.length > 0" class="flex flex-col gap-15px">
            <VacancyCard
              v-for="(vacancy, index) in paginatedClosedVacancies"
              :key="vacancy.id"
              :vacancy="vacancy"
              current-status="closed"
              @vacancy-deleted="handleVacancyDeleted"
              @vacancy-status-changed="handleVacancyStatusChanged"
              :dropdownItems="VacancyCardClosedDropdown"
              :class="{ 'mb-4': index !== paginatedClosedVacancies.length - 1 }"
            />
            <Pagination
              v-if="totalClosedPages > 1"
              :current-page="currentClosedPage"
              :last-page="totalClosedPages"
              @page-changed="handleClosedPageChange"
            />
          </div>
        </div>
      </transition>
      <transition name="fade" @after-enter="updateContainerHeight">
        <div v-if="archiveVacancies" class="active-view absolute w-full">
          <ListSectionPlaceholder
            v-if="(loading || tabLoading) && archiveVacancies"
            variant="vacancy"
            loading
          />
          <ListSectionPlaceholder
            v-else-if="vacanciesArchive.length === 0"
            variant="vacancy"
            title="Архив пуст"
            description="Сюда попадают вакансии, которые вы перенесли в архив."
          />
          <div
            v-if="vacanciesArchive.length > 0"
            class="flex flex-col gap-15px"
          >
            <VacancyCard
              v-for="(vacancy, index) in paginatedArchiveVacancies"
              :key="vacancy.id"
              :vacancy="vacancy"
              current-status="archive"
              @vacancy-deleted="handleVacancyDeleted"
              @vacancy-status-changed="handleVacancyStatusChanged"
              :dropdownItems="VacancyCardArchiveDropdown"
              :class="{
                'mb-4': index !== paginatedArchiveVacancies.length - 1,
              }"
            />
            <Pagination
              v-if="totalArchivePages > 1"
              :current-page="currentArchivePage"
              :last-page="totalArchivePages"
              @page-changed="handleArchivePageChange"
            />
          </div>
          <div v-if="loadingCandidates" class="absolute left-1/2 top-1/2">
            <UiDotsLoader />
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
  .pagination {
    display: flex;
    gap: 5px;
    justify-content: center;
    margin-top: 10px;
  }

  .active {
    font-weight: bold;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.5s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }

  .slide-fade-enter-active {
    transition: all 0.3s ease-out;
  }

  .slide-fade-leave-active {
    transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    transform: translateX(20px);
    opacity: 0;
  }

  .filters-wrapper {
    border-radius: 0 0 15px 15px !important;
  }

  .sort-dropdown__divider {
    height: 1px;
    background-color: #e5e7eb;
    margin: 4px 0;
  }

  @media (max-width: 992px) {
    .filters {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }
  }
  @media (max-width: 768px) {
    .filters {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 560px) {
    .filters {
      grid-template-columns: 1fr;
    }
  }
</style>
