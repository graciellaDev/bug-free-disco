<script setup lang="ts">
  import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
  import { getTasks, completeTask } from '@/src/api/tasks';
  import { getCandidates, deleteCandidateTask } from '@/src/api/candidates';
  import { getExecutors } from '@/src/api/executors';
  import { getVacanciesNames } from '@/utils/getVacancies';
  import GeoInput from '~/components/custom/GeoInput.vue';
  import { useUserStore } from '@/stores/user';
  import type { Task, TaskFilter, TaskFilterTab, TaskSort, TaskSortOption, TaskSearchFilters } from '@/types/tasks';

  const userStore = useUserStore();

  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const activeFilter = ref<TaskFilter>('all');
  const counts = ref<Partial<Record<TaskFilter, number>>>({});
  const pagination = ref({
    total: 0,
    current_page: 1,
    last_page: 1,
    per_page: 20,
  });

  const filterTabs: TaskFilterTab[] = [
    { key: 'all', label: 'Все задачи' },
    { key: 'today', label: 'На сегодня' },
    { key: 'tomorrow', label: 'На завтра' },
    { key: 'week', label: 'Неделя' },
    { key: 'overdue', label: 'Просроченные' },
    { key: 'completed', label: 'Завершенные' },
  ];

  function tabCount(key: TaskFilter): number {
    return counts.value[key] ?? tasks.value.length;
  }

  // --- Sort ---
  const sortOptions: TaskSortOption[] = [
    { key: 'newest', label: 'Сначала новые' },
    { key: 'oldest', label: 'Сначало старые' },
    { key: 'has_comments', label: 'Есть комментарии' },
  ];
  const showSortPanel = ref(false);
  const activeSort = ref<TaskSort>('newest');
  const pendingSort = ref<TaskSort>('newest');

  function toggleSortPanel() {
    showSortPanel.value = !showSortPanel.value;
    if (showSortPanel.value) {
      showFilterPanel.value = false;
      pendingSort.value = activeSort.value;
    }
  }

  function applySort() {
    activeSort.value = pendingSort.value;
    showSortPanel.value = false;
    loadTasks(1);
  }

  // --- Filters ---
  const showFilterPanel = ref(false);
  const appliedFilters = ref<TaskSearchFilters>({});
  /** `filters[assignee]` — произвольная подстрока (LIKE); подсказки из executors через datalist */
  const pendingAssignee = ref('');
  /** `filters[vacancy_id]` / `filters[candidate_id]` — числовые id из справочников */
  const pendingVacancyId = ref<number | ''>('');
  const pendingCandidateId = ref<number | ''>('');

  const executorsOptions = ref<{ value: number; name: string }[]>([]);
  const vacanciesOptions = ref<{ value: number; name: string }[]>([]);
  const candidatesOptions = ref<{ value: number; name: string }[]>([]);

  async function loadFilterOptions() {
    try {
      const [vacancies, candidatesResult, executors] = await Promise.all([
        getVacanciesNames(),
        getCandidates(1, { per_page: 200 }),
        getExecutors(),
      ]);
      executorsOptions.value = (executors || [])
        .filter((e: { id?: number; name?: string }) => e.id != null && (e.name || '').trim())
        .map((e: { id: number; name: string }) => ({
          value: e.id,
          name: e.name.trim(),
        }));
      vacanciesOptions.value = (vacancies || []).map((v: { id?: number; name?: string; title?: string }) => ({
        value: v.id as number,
        name: v.name || v.title || String(v.id ?? ''),
      }));
      candidatesOptions.value = (candidatesResult.candidates || []).map((c: { id: number; surname?: string; firstname?: string }) => ({
        value: c.id,
        name: [c.surname, c.firstname].filter(Boolean).join(' ') || `ID ${c.id}`,
      }));
    } catch (e) {
      console.error('Ошибка загрузки справочников для фильтров задач:', e);
    }
  }

  function toggleFilterPanel() {
    showFilterPanel.value = !showFilterPanel.value;
    if (showFilterPanel.value) {
      showSortPanel.value = false;
      pendingAssignee.value = appliedFilters.value.assignee ?? '';
      pendingVacancyId.value = appliedFilters.value.vacancy_id ?? '';
      pendingCandidateId.value = appliedFilters.value.candidate_id ?? '';
    }
  }

  function applyFilters() {
    const assignee = pendingAssignee.value.trim() || undefined;
    const vid = pendingVacancyId.value;
    const cid = pendingCandidateId.value;
    const vacancy_id =
      vid !== '' && Number.isFinite(Number(vid)) && Number(vid) > 0 ? Number(vid) : undefined;
    const candidate_id =
      cid !== '' && Number.isFinite(Number(cid)) && Number(cid) > 0 ? Number(cid) : undefined;
    appliedFilters.value = {
      ...(assignee ? { assignee } : {}),
      ...(vacancy_id != null ? { vacancy_id } : {}),
      ...(candidate_id != null ? { candidate_id } : {}),
    };
    showFilterPanel.value = false;
    loadTasks(1);
  }

  function resetFilters() {
    pendingAssignee.value = '';
    pendingVacancyId.value = '';
    pendingCandidateId.value = '';
    appliedFilters.value = {};
    showFilterPanel.value = false;
    loadTasks(1);
  }

  const hasActiveFilters = computed(() => {
    const f = appliedFilters.value;
    return !!(
      f.assignee?.trim()
      || (f.vacancy_id != null && f.vacancy_id > 0)
      || (f.candidate_id != null && f.candidate_id > 0)
    );
  });

  /** Подсказки для GeoInput: исполнители с API + текущий пользователь, если его нет в списке (не исключаем себя) */
  const assigneeNameSuggestions = computed(() => {
    const names = executorsOptions.value.map((e) => e.name).filter(Boolean);
    const self = userStore.name?.trim();
    if (!self) return names;
    const hasSelf = names.some((n) => n.toLowerCase() === self.toLowerCase());
    if (hasSelf) return names;
    return [self, ...names];
  });

  onMounted(() => {
    loadFilterOptions();
    document.addEventListener('click', closeTaskMenuOnDocumentClick);
  });

  // --- Load ---
  async function loadTasks(page = 1) {
    loading.value = true;
    try {
      const result = await getTasks(
        page,
        activeFilter.value,
        activeSort.value !== 'newest' ? activeSort.value : undefined,
        hasActiveFilters.value ? appliedFilters.value : undefined
      );
      tasks.value = result.tasks;
      pagination.value = result.pagination;
      if (Object.keys(result.counts).length) {
        counts.value = result.counts;
      }
    } finally {
      loading.value = false;
    }
  }

  function setFilter(filter: TaskFilter) {
    activeFilter.value = filter;
  }

  watch(activeFilter, () => loadTasks(1), { immediate: true });

  function taskStatus(task: Task): 'completed' | 'overdue' | 'today' | 'tomorrow' | 'assigned' {
    if (task.payload?.completed_at) return 'completed';
    const scheduledAt = task.payload?.scheduled_at;
    if (!scheduledAt) return 'assigned';

    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const dayAfterTomorrow = new Date(todayStart);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);

    if (scheduled < now) return 'overdue';
    if (scheduled >= todayStart && scheduled < tomorrowStart) return 'today';
    if (scheduled >= tomorrowStart && scheduled < dayAfterTomorrow) return 'tomorrow';
    return 'assigned';
  }

  function timeBadgeClass(task: Task): string {
    const status = taskStatus(task);
    switch (status) {
      case 'completed': return 'bg-feta';
      case 'overdue': return 'bg-pink';
      case 'today': return 'bg-chilean';
      default: return 'bg-athens-gray';
    }
  }

  function timeBadgeText(task: Task): string {
    const status = taskStatus(task);
    const scheduledAt = task.payload?.scheduled_at;

    if (status === 'completed' && task.payload?.completed_at) {
      return `Завершена: ${formatDateTime(task.payload.completed_at)}`;
    }

    if (!scheduledAt) return '';

    const scheduled = new Date(scheduledAt);
    const timeStr = formatTime(scheduled);

    switch (status) {
      case 'overdue': {
        const daysDiff = getDaysDiff(scheduled);
        if (daysDiff === 1) return `Вчера: ${timeStr}`;
        return `${formatDate(scheduled)}: ${timeStr}`;
      }
      case 'today':
        return `Сегодня: ${timeStr}`;
      case 'tomorrow':
        return `Завтра: ${timeStr}`;
      default:
        return `${formatDate(scheduled)}: ${timeStr}`;
    }
  }

  function getDaysDiff(date: Date): number {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((todayStart.getTime() - dateStart.getTime()) / (1000 * 60 * 60 * 24));
  }

  function formatTime(d: Date): string {
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${min}`;
  }

  function formatDate(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function formatDateTime(iso: string): string {
    const d = new Date(iso);
    return `${formatDate(d)} в ${formatTime(d)}`;
  }

  function formatCreatedAt(iso: string): string {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} в ${h}:${min}`;
  }

  function taskComments(task: Task): string[] {
    const result: string[] = [];
    if (task.payload?.content) {
      result.push(task.payload.content);
    }
    if (task.payload?.notes && Array.isArray(task.payload.notes)) {
      result.push(...task.payload.notes.map((n) => n.text));
    }
    return result;
  }

  const completingIds = ref<Set<number>>(new Set());
  const deletingIds = ref<Set<number>>(new Set());
  const openTaskMenuId = ref<number | null>(null);

  function toggleTaskMenu(taskId: number) {
    openTaskMenuId.value = openTaskMenuId.value === taskId ? null : taskId;
  }

  function closeTaskMenuOnDocumentClick(e: MouseEvent) {
    const t = e.target as HTMLElement | null;
    if (t?.closest?.('[data-task-actions-root]')) return;
    openTaskMenuId.value = null;
  }

  onBeforeUnmount(() => {
    document.removeEventListener('click', closeTaskMenuOnDocumentClick);
  });

  async function handleMenuComplete(task: Task) {
    openTaskMenuId.value = null;
    await handleComplete(task);
  }

  async function handleDeleteTask(task: Task) {
    if (!task.candidate_id || deletingIds.value.has(task.id)) return;
    if (!confirm('Удалить задачу?')) return;
    deletingIds.value.add(task.id);
    try {
      await deleteCandidateTask(task.candidate_id, task.id);
      openTaskMenuId.value = null;
      await loadTasks(pagination.value.current_page);
    } catch (err) {
      console.error('Не удалось удалить задачу:', err);
    } finally {
      deletingIds.value.delete(task.id);
    }
  }

  async function handleComplete(task: Task) {
    if (!task.candidate_id || completingIds.value.has(task.id)) return;
    completingIds.value.add(task.id);
    try {
      await completeTask(task.candidate_id, task.id);
      await loadTasks(pagination.value.current_page);
    } finally {
      completingIds.value.delete(task.id);
    }
  }

  const isHoveredSort = ref(false);
  const isHoveredFunnel = ref(false);

  function navigateToCandidate(candidateId: number | null | undefined) {
    if (!candidateId) return;
    navigateTo(`/candidates/${candidateId}`);
  }

  function navigateToVacancy(vacancyId: number | null | undefined) {
    if (!vacancyId) return;
    navigateTo(`/vacancies/${vacancyId}`);
  }
</script>

<template>
  <div class="container pb-28px pt-35px flex flex-col gap-[15px]">
    <!-- Header -->
    <div class="flex flex-col gap-px">
      <div class="flex items-center justify-between gap-[35px] rounded-t-[15px] bg-white px-[25px] py-[25px]">
        <div class="flex flex-col gap-[10px]">
          <h1 class="text-[20px] font-semibold leading-[1.3] text-space">Планировщик</h1>
          <p class="text-[14px] font-normal leading-[1.21] text-slate-custom">
            Управляйте задачами с этого раздела
          </p>
        </div>
        <button
          class="shrink-0 rounded-[10px] bg-dodger px-[20px] py-[11.5px] text-[14px] font-semibold leading-[1.21] text-white transition-colors hover:bg-dodger/90"
        >
          Новая задача
        </button>
      </div>

      <!-- Filter Tabs: без закругления снизу, если ниже открыта панель сортировки/фильтров -->
      <div
        class="flex items-center gap-[10px] bg-catskill px-[25px] py-[15px] transition-[border-bottom-left-radius,border-bottom-right-radius] duration-300 ease-out"
        :class="!showSortPanel && !showFilterPanel ? 'rounded-b-[15px]' : 'rounded-b-none'"
      >
        <div class="flex flex-1 items-center gap-[10px]">
          <button
            v-for="tab in filterTabs"
            :key="tab.key"
            class="flex h-[40px] shrink-0 items-center gap-[10px] rounded-[10px] px-[15px] text-[14px] font-medium leading-[1.3] transition-colors"
            :class="
              activeFilter === tab.key
                ? 'bg-space text-white'
                : 'text-space hover:bg-athens-gray'
            "
            @click="setFilter(tab.key)"
          >
            <span>{{ tab.label }}</span>
            <span
              class="text-[14px] font-medium leading-[1.5]"
              :class="activeFilter === tab.key ? 'text-white/60' : 'text-slate-custom'"
            >
              {{ tabCount(tab.key) }}
            </span>
          </button>

          <!-- More (...) -->
          <button class="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] transition-colors hover:bg-athens-gray">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="5" viewBox="0 0 18 5" fill="#2F353D">
              <circle cx="2.5" cy="2.5" r="2" />
              <circle cx="9" cy="2.5" r="2" />
              <circle cx="15.5" cy="2.5" r="2" />
            </svg>
          </button>
        </div>

        <!-- Sort button -->
        <button
          class="rounded-ten border p-2.5 transition-colors"
          :class="
            isHoveredSort || showSortPanel || activeSort !== 'newest'
              ? 'border-zumthor bg-zumthor text-dodger'
              : 'border-athens bg-white text-slate-custom'
          "
          @mouseover="isHoveredSort = true"
          @mouseleave="isHoveredSort = false"
          @click="toggleSortPanel"
        >
          <svg-icon name="sort-list" width="20" height="20" />
        </button>

        <!-- Filter button -->
        <button
          class="rounded-ten border p-2.5 transition-colors"
          :class="
            isHoveredFunnel || showFilterPanel || hasActiveFilters
              ? 'border-zumthor bg-zumthor text-dodger'
              : 'border-athens bg-white text-slate-custom'
          "
          @mouseover="isHoveredFunnel = true"
          @mouseleave="isHoveredFunnel = false"
          @click="toggleFilterPanel"
        >
          <svg-icon name="funnel" width="20" height="20" />
        </button>
      </div>

      <!-- Sort Panel -->
      <div
        v-if="showSortPanel"
        class="rounded-b-[15px] border-t border-athens bg-white px-[25px] py-[20px]"
      >
        <h3 class="mb-[15px] text-[15px] font-medium leading-[1.5] text-space">Сортировать</h3>
        <div class="flex flex-wrap items-center gap-[10px]">
          <button
            v-for="opt in sortOptions"
            :key="opt.key"
            class="rounded-[10px] px-[15px] py-[8px] text-[14px] font-medium leading-[1.3] transition-colors"
            :class="
              pendingSort === opt.key
                ? 'bg-space text-white'
                : 'bg-athens-gray text-space hover:bg-athens'
            "
            @click="pendingSort = opt.key"
          >
            {{ opt.label }}
          </button>
        </div>
        <button
          class="mt-[20px] rounded-[10px] bg-dodger px-[20px] py-[10px] text-[14px] font-semibold text-white transition-colors hover:bg-dodger/90"
          @click="applySort"
        >
          Применить
        </button>
      </div>

      <!-- Filter Panel -->
      <div
        v-if="showFilterPanel"
        class="rounded-b-[15px] border-t border-athens bg-white px-[25px] py-[20px]"
      >
        <h3 class="mb-[15px] text-[15px] font-medium leading-[1.5] text-space">Фильтры</h3>

        <div class="mb-[20px] grid grid-cols-1 gap-[15px] md:grid-cols-3">
          <!-- filters[assignee]: тот же UX, что «Город публикации» в форме вакансии (GeoInput) -->
          <div>
            <p class="mb-3.5 text-sm font-medium text-space">Ответственный задачи</p>
            <ClientOnly>
              <GeoInput
                v-model="pendingAssignee"
                class="mb-2.5"
                :suggestions="assigneeNameSuggestions"
                no-match-text="Нет совпадений"
                placeholder="Например, Иван Петров"
              />
              <template #fallback>
                <div class="h-11 w-full animate-pulse rounded-ten border border-athens bg-athens-gray" />
              </template>
            </ClientOnly>
          </div>

          <!-- filters[vacancy_id] -->
          <div>
            <label class="mb-3.5 block text-sm font-medium text-space" for="tasks-filter-vacancy">
              Вакансия
            </label>
            <select
              id="tasks-filter-vacancy"
              v-model="pendingVacancyId"
              class="w-full rounded-[10px] border border-athens bg-athens-gray px-3 py-2.5 text-[14px] text-space focus:border-dodger focus:outline-none"
            >
              <option value="">Все вакансии</option>
              <option v-for="v in vacanciesOptions" :key="v.value" :value="v.value">
                {{ v.name }}
              </option>
            </select>
          </div>

          <!-- filters[candidate_id] -->
          <div>
            <label class="mb-3.5 block text-sm font-medium text-space" for="tasks-filter-candidate">
              Кандидат
            </label>
            <select
              id="tasks-filter-candidate"
              v-model="pendingCandidateId"
              class="w-full rounded-[10px] border border-athens bg-athens-gray px-3 py-2.5 text-[14px] text-space focus:border-dodger focus:outline-none"
            >
              <option value="">Все кандидаты</option>
              <option v-for="c in candidatesOptions" :key="c.value" :value="c.value">
                {{ c.name }}
              </option>
            </select>
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button
            class="rounded-[10px] bg-dodger px-[20px] py-[10px] text-[14px] font-semibold text-white transition-colors hover:bg-dodger/90"
            @click="applyFilters"
          >
            Применить
          </button>
          <button
            class="rounded-[10px] bg-athens-gray px-[20px] py-[10px] text-[14px] font-semibold text-space transition-colors hover:bg-athens"
            @click="resetFilters"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>
    </div>

    <!-- Список задач: прелоадер при первой загрузке или оверлей при обновлении -->
    <div class="relative flex flex-col gap-[15px]">
      <Transition name="tasks-body" mode="out-in">
        <div
          v-if="loading && !tasks.length"
          key="tasks-loading"
          class="flex min-h-[200px] items-center justify-center py-20"
        >
          <div class="text-[14px] text-slate-custom">Загрузка задач...</div>
        </div>

        <div v-else key="tasks-list" class="flex flex-col gap-[15px]">
        <!-- Empty State -->
        <div
          v-if="!tasks.length"
          class="flex flex-col items-center justify-center gap-3 rounded-[15px] bg-white px-[25px] py-[60px]"
        >
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#79869A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
      <p class="text-[15px] font-medium text-space">Нет задач</p>
      <p class="text-[14px] text-slate-custom">Задачи появятся здесь после создания</p>
        </div>

        <!-- Task Cards -->
        <div
          v-for="task in tasks"
          :key="task.id"
          class="flex gap-[15px] rounded-[15px] bg-white px-[25px] py-[25px]"
        >
      <!-- Checkbox -->
      <div class="flex shrink-0 pt-[2px]">
        <button
          class="flex h-[20px] w-[20px] items-center justify-center rounded-[5px] border border-athens bg-athens-gray transition-colors hover:border-dodger"
          :class="{ 'bg-dodger border-dodger': !!task.payload?.completed_at }"
          :disabled="completingIds.has(task.id)"
          @click="handleComplete(task)"
        >
          <svg
            v-if="task.payload?.completed_at"
            xmlns="http://www.w3.org/2000/svg"
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>

      <!-- Content -->
      <div class="flex min-w-0 flex-1 flex-col gap-[20px]">
        <!-- Title + Notes -->
        <div class="flex flex-col gap-[10px]">
          <div class="flex flex-col gap-[5px]">
            <h3
              class="text-[15px] font-medium leading-[1.5] text-space"
              :class="{ 'line-through text-slate-custom': !!task.payload?.completed_at }"
            >
              {{ task?.payload?.content || 'Без названия' }}
            </h3>
            <div
              v-for="(comment, idx) in taskComments(task)"
              :key="idx"
              class="flex items-center gap-[5px]"
            >
              <svg class="shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.85938 0C4.3059 0.00170601 2.81653 0.619579 1.71806 1.71806C0.619579 2.81653 0.00170601 4.3059 0 5.85938V10.7812C0 11.0299 0.098772 11.2683 0.274587 11.4442C0.450403 11.62 0.68886 11.7188 0.9375 11.7188H5.85938C7.41338 11.7188 8.90373 11.1014 10.0026 10.0026C11.1014 8.90373 11.7188 7.41338 11.7188 5.85938C11.7188 4.30537 11.1014 2.81502 10.0026 1.71617C8.90373 0.617325 7.41338 0 5.85938 0ZM7.73438 7.5H3.75C3.62568 7.5 3.50645 7.45061 3.41854 7.36271C3.33064 7.2748 3.28125 7.15557 3.28125 7.03125C3.28125 6.90693 3.33064 6.7877 3.41854 6.69979C3.50645 6.61189 3.62568 6.5625 3.75 6.5625H7.73438C7.8587 6.5625 7.97792 6.61189 8.06583 6.69979C8.15374 6.7877 8.20312 6.90693 8.20312 7.03125C8.20312 7.15557 8.15374 7.2748 8.06583 7.36271C7.97792 7.45061 7.8587 7.5 7.73438 7.5ZM7.73438 5.625H3.75C3.62568 5.625 3.50645 5.57561 3.41854 5.48771C3.33064 5.3998 3.28125 5.28057 3.28125 5.15625C3.28125 5.03193 3.33064 4.9127 3.41854 4.82479C3.50645 4.73689 3.62568 4.6875 3.75 4.6875H7.73438C7.8587 4.6875 7.97792 4.73689 8.06583 4.82479C8.15374 4.9127 8.20312 5.03193 8.20312 5.15625C8.20312 5.28057 8.15374 5.3998 8.06583 5.48771C7.97792 5.57561 7.8587 5.625 7.73438 5.625Z" fill="#79869A"/>
              </svg>
              <span class="text-[14px] font-normal leading-[1.5] text-slate-custom">
                {{ comment }}
              </span>
            </div>
          </div>

          <!-- Meta: Для, кандидат, Вакансия -->
          <div class="flex flex-wrap items-center gap-[5px]">
            <div v-if="task?.author_name" class="flex items-center gap-[5px]">
              <span class="text-[14px] font-medium leading-[1.5] text-space">Для:</span>
              <button class="text-[14px] font-medium leading-[1.21] text-dodger hover:underline">
                {{ task.author_name }},
              </button>
            </div>
            <div v-if="task.candidate_name" class="flex items-center gap-[5px]">
              <span class="text-[14px] font-medium leading-[1.5] text-space">кандидат</span>
              <button
                class="text-[14px] font-medium leading-[1.21] text-dodger hover:underline"
                @click="navigateToCandidate(task.candidate_id)"
              >
                {{ task.candidate_name }},
              </button>
            </div>
            <div v-if="task.vacancy_id" class="flex items-center gap-[5px]">
              <span class="text-[14px] font-medium leading-[1.5] text-space">Вакансия</span>
              <button
                type="button"
                class="text-[14px] font-medium leading-[1.21] text-dodger hover:underline"
                @click="navigateToVacancy(task.vacancy_id)"
              >
                {{ task.vacancy_name || `ID ${task.vacancy_id}` }}
              </button>
            </div>
          </div>
        </div>

        <!-- Time Badge -->
        <div
          v-if="task.payload?.scheduled_at || task.payload?.completed_at"
          class="flex items-center gap-[10px]"
        >
          <div
            class="flex items-center gap-[10px] rounded-[10px] px-[10px] py-[5px]"
            :class="timeBadgeClass(task)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 256 256" fill="#2F353D">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z"/>
            </svg>
            <span class="text-[13px] font-medium leading-[1.5] text-space">
              {{ timeBadgeText(task) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Right column: actions + date -->
      <div class="flex shrink-0 flex-col items-end justify-between gap-[15px]">
        <div data-task-actions-root class="relative shrink-0">
          <button
            type="button"
            class="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] transition-colors"
            :class="
              openTaskMenuId === task.id
                ? 'border border-zumthor bg-zumthor text-dodger'
                : 'text-space hover:bg-athens-gray'
            "
            :aria-expanded="openTaskMenuId === task.id"
            aria-haspopup="menu"
            aria-label="Действия с задачей"
            @click.stop="toggleTaskMenu(task.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="21" height="6" viewBox="0 0 21 6" class="text-current">
              <circle cx="3" cy="3" r="2.5" fill="currentColor" />
              <circle cx="10.5" cy="3" r="2.5" fill="currentColor" />
              <circle cx="18" cy="3" r="2.5" fill="currentColor" />
            </svg>
          </button>
          <Transition name="slide-fade">
            <ul
              v-if="openTaskMenuId === task.id"
              role="menu"
              class="absolute right-0 top-[calc(100%+4px)] z-30 min-w-[200px] divide-y divide-athens overflow-hidden rounded-[10px] border border-athens bg-white py-0 shadow-shadow-droplist"
              @click.stop
            >
              <li
                v-if="task.candidate_id"
                role="menuitem"
                class="px-4 py-2.5 text-left text-[14px] font-normal text-space transition-colors"
                :class="
                  task.payload?.completed_at || completingIds.has(task.id)
                    ? 'cursor-default text-slate-custom opacity-60'
                    : 'cursor-pointer hover:bg-zumthor'
                "
                @click="!task.payload?.completed_at && !completingIds.has(task.id) && handleMenuComplete(task)"
              >
                Завершить
              </li>
              <li
                v-if="task.candidate_id"
                role="menuitem"
                class="cursor-pointer px-4 py-2.5 text-left text-[14px] font-normal text-space transition-colors hover:bg-zumthor"
                :class="{ 'pointer-events-none opacity-50': deletingIds.has(task.id) }"
                @click="handleDeleteTask(task)"
              >
                Удалить
              </li>
            </ul>
          </Transition>
        </div>
        <span class="text-[12px] font-normal leading-[1.3] text-slate-custom">
          {{ formatCreatedAt(task.occurred_at) }}
        </span>
      </div>
        </div>
        </div>
      </Transition>

      <!-- Оверлей при перезагрузке списка (фильтры, сортировка, табы, пагинация), пока есть предыдущие данные -->
      <Transition name="tasks-loading-overlay">
        <div
          v-if="loading && tasks.length"
          class="absolute inset-0 z-10 flex min-h-[200px] items-center justify-center rounded-[15px] bg-white/75 backdrop-blur-[1px]"
        >
          <div class="text-[14px] font-medium text-slate-custom">Загрузка задач...</div>
        </div>
      </Transition>

      <!-- Pagination -->
      <div
        v-if="pagination.last_page > 1"
        class="relative z-0 flex items-center justify-center gap-2 py-4"
      >
        <button
          v-for="page in pagination.last_page"
          :key="page"
          class="flex h-[36px] min-w-[36px] items-center justify-center rounded-[10px] px-3 text-[14px] font-medium transition-colors"
          :class="
            page === pagination.current_page
              ? 'bg-dodger text-white'
              : 'text-space hover:bg-athens-gray'
          "
          :disabled="loading"
          @click="loadTasks(page)"
        >
          {{ page }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .tasks-body-enter-active,
  .tasks-body-leave-active {
    transition:
      opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tasks-body-enter-from {
    opacity: 0;
    transform: translateY(8px);
  }

  .tasks-body-leave-to {
    opacity: 0;
    transform: translateY(-6px);
  }

  .tasks-loading-overlay-enter-active,
  .tasks-loading-overlay-leave-active {
    transition: opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .tasks-loading-overlay-enter-from,
  .tasks-loading-overlay-leave-to {
    opacity: 0;
  }

  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition:
      opacity 0.2s ease,
      transform 0.2s ease;
  }

  .slide-fade-enter-from,
  .slide-fade-leave-to {
    opacity: 0;
    transform: translateY(-4px);
  }
</style>
