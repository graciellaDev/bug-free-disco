<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import MyInput from '~/components/custom/MyInput.vue';
  import BtnIcon from '@/components/custom/BtnIcon.vue';
  import UiDotsLoader from '@/components/custom/UiDotsLoader.vue';
  import UiDialog from '~/components/ui/dialog/Dialog.vue';
  import UiDialogContent from '~/components/ui/dialog/DialogContent.vue';
  import UiDialogFooter from '~/components/ui/dialog/DialogFooter.vue';
  import UiDialogHeader from '~/components/ui/dialog/DialogHeader.vue';
  import UiDialogTitle from '~/components/ui/dialog/DialogTitle.vue';
  import DropdownCalendarStatic from '~/components/custom/DropdownCalendarStatic.vue';
  import ResponseInput from '~/components/custom/ResponseInput.vue';
  import MultiSelect from '~/components/custom/MultiSelect.vue';
  import { getActivityFeed } from '@/src/api/candidates';
  import { employeesList } from '~/utils/executorsList';
  import { getVacancies } from '@/src/api/vacancies';
  import type {
    ActivityFeedItem,
    ActivityFeedCandidateRow,
    ActivityFeedApiFilters,
  } from '@/types/candidates';
  import type { Vacancy } from '@/types/vacancy';

  const ACTIVITY_KIND_OPTIONS = [
    { value: 'comment', label: 'Комментарий' },
    { value: 'chat', label: 'Чат' },
    { value: 'email', label: 'Письмо' },
    { value: 'task', label: 'Задача' },
    { value: 'system_stage', label: 'Смена этапа' },
    { value: 'system_tag', label: 'Теги' },
    { value: 'system_field', label: 'Изменение поля / реквизитов' },
    { value: 'system_other', label: 'Прочие системные' },
  ] as const;

  const activityKindMultiOptions = computed(() =>
    ACTIVITY_KIND_OPTIONS.map(o => ({ name: o.label, value: o.value }))
  );

  const activityVacancyMultiOptions = computed(() =>
    vacancyOptions.value
      .filter((v): v is Vacancy & { id: number } => v.id != null && Number(v.id) > 0)
      .map(v => {
        const label = String(v.name ?? v.title ?? '').trim();
        return {
          name: label || `Вакансия #${v.id}`,
          value: v.id,
        };
      })
  );

  useHead({
    title: 'Лента активности',
  });

  const headerSearch = ref('');

  interface ActivityFiltersState {
    occurredFrom: string;
    occurredTo: string;
    author: string;
    entity: '' | 'candidate' | 'task';
    kinds: string[];
    valueBefore: string;
    valueAfter: string;
    vacancyIds: number[];
  }

  function emptyFilters(): ActivityFiltersState {
    return {
      occurredFrom: '',
      occurredTo: '',
      author: '',
      entity: '',
      kinds: [],
      valueBefore: '',
      valueAfter: '',
      vacancyIds: [],
    };
  }

  function cloneFilters(f: ActivityFiltersState): ActivityFiltersState {
    return { ...f, kinds: [...f.kinds], vacancyIds: [...f.vacancyIds] };
  }

  const filterPanelOpen = ref(false);
  const filtersApplied = ref<ActivityFiltersState>(emptyFilters());
  const filtersDraft = ref<ActivityFiltersState>(emptyFilters());
  const vacancyOptions = ref<Vacancy[]>([]);
  const vacanciesLoading = ref(false);

  type ActivityAuthorOption = { id: number; name: string; role: string };
  const activityAuthorOptions = ref<ActivityAuthorOption[]>([]);
  const activityAuthorsLoading = ref(false);

  type ActivitySortKey =
    | 'date'
    | 'author'
    | 'object'
    | 'vacancy'
    | 'name'
    | 'event'
    | 'valueBefore'
    | 'valueAfter';
  const sortColumn = ref<ActivitySortKey | null>(null);
  const sortDir = ref<'asc' | 'desc'>('desc');
  const events = ref<ActivityFeedItem[]>([]);
  const loading = ref(true);
  const loadingMore = ref(false);
  const errorText = ref<string | null>(null);
  const meta = ref<{
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  } | null>(null);

  /** Дата и время без секунд (колонка «Дата» и сроки в таблице). */
  function formatTimestampFull(occurredAt: string): string {
    const d = new Date(occurredAt);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${h}:${min}`;
  }

  function candidateDisplayName(c: ActivityFeedCandidateRow): string {
    const parts = [c.firstname, c.surname].filter(
      (x): x is string => typeof x === 'string' && x.trim() !== ''
    );
    return parts.length ? parts.join(' ') : 'Кандидат';
  }

  function candidateSubtitle(c: ActivityFeedCandidateRow): string {
    return (c.quickInfo ?? '').trim() || '—';
  }

  function payloadRecord(event: ActivityFeedItem): Record<string, unknown> {
    const p = event.payload;
    return p && typeof p === 'object' && !Array.isArray(p)
      ? (p as Record<string, unknown>)
      : {};
  }

  function strVal(v: unknown): string {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return String(v);
  }

  function eventTypeRu(type: string): string {
    const map: Record<string, string> = {
      system: 'Системное',
      email: 'Письмо',
      task: 'Задача',
      comment: 'Комментарий',
      chat: 'Чат',
    };
    return map[type] ?? type;
  }

  /** Убрать префикс «Имя: » в начале системного текста (совпадает с author_name). */
  function stripLeadingAuthor(text: string, author: string | null | undefined): string {
    let t = text.trim();
    const a = author?.trim();
    if (a && t.startsWith(`${a}: `)) {
      t = t.slice(a.length + 2);
    }
    return t.trim();
  }

  interface ParsedSystem {
    name: string;
    eventKind: string;
    before: string;
    after: string;
  }

  /** Разбор текстов из SystemEventMessageBuilder (стрелка «→», этапы, теги и т.д.). */
  function parseSystemBody(body: string): ParsedSystem {
    if (!body) {
      return {
        name: '—',
        eventKind: 'Системное',
        before: '—',
        after: '—',
      };
    }

    const arrowIdx = body.lastIndexOf(' → ');
    if (arrowIdx !== -1) {
      const right = body.slice(arrowIdx + 3).trim();
      const left = body.slice(0, arrowIdx);

      const recruiters = left.match(/^Рекрутеры:\s*(.+)$/s);
      if (recruiters) {
        return {
          name: 'Рекрутеры',
          eventKind: 'Изменение',
          before: recruiters[1].trim(),
          after: right,
        };
      }

      const fio = left.match(/^Изменено ФИО:\s*(.+)$/s);
      if (fio) {
        return {
          name: 'ФИО',
          eventKind: 'Изменение',
          before: fio[1].trim(),
          after: right,
        };
      }

      const changed = left.match(/^Изменено\s+(.+?):\s*(.+)$/s);
      if (changed) {
        return {
          name: changed[1].trim(),
          eventKind: 'Изменение поля',
          before: changed[2].trim(),
          after: right,
        };
      }
    }

    const stage = body.match(/^Новый этап:\s*(.+?)\s+из\s+(.+)$/s);
    if (stage) {
      return {
        name: 'Этап воронки',
        eventKind: 'Смена этапа',
        before: stage[2].trim(),
        after: stage[1].trim(),
      };
    }

    const tagAdd = body.match(/^Добавлен тег:\s*#(.+)$/);
    if (tagAdd) {
      return {
        name: 'Тег',
        eventKind: 'Добавлен тег',
        before: '—',
        after: `#${tagAdd[1].trim()}`,
      };
    }

    const tagRem = body.match(/^Удалён тег:\s*#(.+)$/);
    if (tagRem) {
      return {
        name: 'Тег',
        eventKind: 'Удалён тег',
        before: `#${tagRem[1].trim()}`,
        after: '—',
      };
    }

    const fieldSet = body.match(/^Для поля "([^"]+)" установлено значение "(.*)"$/s);
    if (fieldSet) {
      return {
        name: fieldSet[1].trim(),
        eventKind: 'Установка значения',
        before: '—',
        after: fieldSet[2],
      };
    }

    const truncated =
      body.length > 200 ? `${body.slice(0, 200)}…` : body;
    return {
      name: truncated,
      eventKind: 'Системное',
      before: '—',
      after: '—',
    };
  }

  interface ActivityTableRow {
    event: ActivityFeedItem;
    date: string;
    author: string;
    objectKindLabel: 'Кандидат' | 'Задача' | '—';
    objectHref: string | null;
    candidateId: number;
    candidateName: string;
    vacancyLabel: string;
    vacancyLinkId: number | null;
    nameCol: string;
    eventCol: string;
    valueBefore: string;
    valueAfter: string;
  }

  function buildTableRow(event: ActivityFeedItem): ActivityTableRow {
    const date = formatTimestampFull(event.occurred_at);
    const author = (event.author_name ?? '').trim() || '—';
    const candidateId = event.candidate.id;
    const candidateName = candidateDisplayName(event.candidate);
    const vacName = event.vacancy?.name?.trim();
    const vid = event.vacancy?.id ?? event.vacancy_id ?? null;
    const vacancyLabel =
      vacName || (vid != null ? `Вакансия #${vid}` : '—');
    const vacancyLinkId = vid != null ? Number(vid) : null;

    let objectKindLabel: 'Кандидат' | 'Задача' | '—' = '—';
    let objectHref: string | null = null;
    if (event.type === 'task') {
      objectKindLabel = 'Задача';
      objectHref = `/candidates/${candidateId}`;
    } else if (vacancyLinkId != null) {
      objectKindLabel = 'Кандидат';
      objectHref = `/candidates/${candidateId}`;
    }

    const p = payloadRecord(event);

    let nameCol = '—';
    let eventCol = eventTypeRu(event.type);
    let valueBefore = '—';
    let valueAfter = '—';

    if (event.type === 'system') {
      const content = strVal(p.content);
      const body = stripLeadingAuthor(content, event.author_name);
      const parsed = parseSystemBody(body);
      nameCol = parsed.name;
      eventCol = parsed.eventKind;
      valueBefore = parsed.before || '—';
      valueAfter = parsed.after || '—';
    } else if (event.type === 'comment') {
      nameCol = 'Комментарий';
      eventCol = 'Комментарий';
      valueAfter = strVal(p.content).trim() || '—';
    } else if (event.type === 'chat') {
      nameCol = strVal(p.provider) || 'Сообщение';
      eventCol = 'Сообщение в чат';
      valueAfter = strVal(p.content).trim() || '—';
    } else if (event.type === 'email') {
      nameCol = strVal(p.subject).trim() || '—';
      eventCol =
        event.direction === 'incoming' ? 'Входящее письмо' : 'Исходящее письмо';
      valueBefore = '—';
      const prev = strVal(p.body_preview).trim();
      valueAfter = prev || '—';
    } else if (event.type === 'task') {
      nameCol = strVal(p.content).trim().slice(0, 200) || 'Задача';
      eventCol = p.completed_at ? 'Задача (выполнена)' : 'Задача';
      const sched = strVal(p.scheduled_at);
      valueBefore = '—';
      valueAfter = sched
        ? `Срок: ${formatTimestampFull(sched)}`
        : strVal(p.content).trim() || '—';
    }

    return {
      event,
      date,
      author,
      objectKindLabel,
      objectHref,
      candidateId,
      candidateName,
      vacancyLabel,
      vacancyLinkId,
      nameCol,
      eventCol,
      valueBefore,
      valueAfter,
    };
  }

  function eventSearchHaystack(e: ActivityFeedItem): string {
    const row = buildTableRow(e);
    return [
      row.date,
      row.author,
      row.objectKindLabel,
      row.candidateName,
      candidateSubtitle(e.candidate),
      row.vacancyLabel,
      row.nameCol,
      row.eventCol,
      row.valueBefore,
      row.valueAfter,
      e.type,
    ]
      .join(' ')
      .toLowerCase();
  }

  function onSortColumnClick(key: ActivitySortKey) {
    if (sortColumn.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn.value = key;
      sortDir.value = key === 'date' ? 'desc' : 'asc';
    }
  }

  function compareEventsForSort(
    a: ActivityFeedItem,
    b: ActivityFeedItem,
    key: ActivitySortKey,
    dir: 'asc' | 'desc'
  ): number {
    const ra = buildTableRow(a);
    const rb = buildTableRow(b);
    let cmp = 0;
    switch (key) {
      case 'date':
        cmp =
          new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
        break;
      case 'author':
        cmp = ra.author.localeCompare(rb.author, 'ru', { sensitivity: 'base' });
        break;
      case 'object':
        cmp = ra.objectKindLabel.localeCompare(rb.objectKindLabel, 'ru', {
          sensitivity: 'base',
        });
        break;
      case 'vacancy':
        cmp = ra.vacancyLabel.localeCompare(rb.vacancyLabel, 'ru', {
          sensitivity: 'base',
        });
        break;
      case 'name':
        cmp = ra.nameCol.localeCompare(rb.nameCol, 'ru', { sensitivity: 'base' });
        break;
      case 'event':
        cmp = ra.eventCol.localeCompare(rb.eventCol, 'ru', {
          sensitivity: 'base',
        });
        break;
      case 'valueBefore':
        cmp = ra.valueBefore.localeCompare(rb.valueBefore, 'ru', {
          sensitivity: 'base',
        });
        break;
      case 'valueAfter':
        cmp = ra.valueAfter.localeCompare(rb.valueAfter, 'ru', {
          sensitivity: 'base',
        });
        break;
      default:
        cmp = 0;
    }
    return dir === 'asc' ? cmp : -cmp;
  }

  async function loadVacanciesIfNeeded() {
    if (vacancyOptions.value.length > 0 || vacanciesLoading.value) return;
    vacanciesLoading.value = true;
    try {
      const list = await getVacancies({ per_page: 'all' });
      vacancyOptions.value = list ?? [];
    } catch (e) {
      console.error('[Activity] vacancies', e);
    } finally {
      vacanciesLoading.value = false;
    }
  }

  async function loadActivityAuthorOptions() {
    if (activityAuthorsLoading.value) return;
    activityAuthorsLoading.value = true;
    try {
      const employees = await employeesList();
      activityAuthorOptions.value = employees.map(e => ({
        id: e.id,
        name: e.name,
        role: e.role ?? '',
      }));
    } catch (e) {
      console.warn('[Activity] employeesList', (e as Error)?.message || e);
      activityAuthorOptions.value = [];
    } finally {
      activityAuthorsLoading.value = false;
    }
  }

  function openFilterPanel() {
    filtersDraft.value = cloneFilters(filtersApplied.value);
    filterPanelOpen.value = true;
    void loadVacanciesIfNeeded();
    void loadActivityAuthorOptions();
  }

  function closeFilterPanel() {
    filterPanelOpen.value = false;
  }

  function applyFiltersFromPanel() {
    filtersApplied.value = cloneFilters(filtersDraft.value);
    filterPanelOpen.value = false;
    fetchPage(1, false);
  }

  function resetAllFiltersAndFetch() {
    filtersApplied.value = emptyFilters();
    filtersDraft.value = emptyFilters();
    filterPanelOpen.value = false;
    fetchPage(1, false);
  }

  const hasActiveFilters = computed(() => {
    const f = filtersApplied.value;
    return !!(
      f.occurredFrom.trim() ||
      f.occurredTo.trim() ||
      f.author.trim() ||
      f.entity ||
      f.kinds.length ||
      f.valueBefore.trim() ||
      f.valueAfter.trim() ||
      f.vacancyIds.length > 0
    );
  });

  /** Кнопка «Сбросить фильтры»: видна, если в открытой форме заполнено хотя бы одно поле. */
  const hasAnyDraftFilter = computed(() => {
    const f = filtersDraft.value;
    return !!(
      f.occurredFrom.trim() ||
      f.occurredTo.trim() ||
      f.author.trim() ||
      f.entity ||
      f.kinds.length ||
      f.valueBefore.trim() ||
      f.valueAfter.trim() ||
      f.vacancyIds.length > 0
    );
  });

  /** Дата из DropdownCalendarStatic (Д.М.ГГГГ / ДД.ММ.ГГГГ) → компоненты для API. */
  function ruDateOnlyToParts(raw: string): { y: string; m: string; d: string } | null {
    const s = raw.trim();
    const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s);
    if (!m) return null;
    return {
      d: m[1].padStart(2, '0'),
      m: m[2].padStart(2, '0'),
      y: m[3],
    };
  }

  function activityPeriodFromToApi(raw: string): string {
    const p = ruDateOnlyToParts(raw);
    if (!p) return raw.trim();
    return `${p.y}-${p.m}-${p.d} 00:00:00`;
  }

  /** Конец дня включительно для фильтра «по». */
  function activityPeriodToToApi(raw: string): string {
    const p = ruDateOnlyToParts(raw);
    if (!p) return raw.trim();
    return `${p.y}-${p.m}-${p.d} 23:59:59`;
  }

  function buildFeedFiltersForApi(): Partial<ActivityFeedApiFilters> {
    const f = filtersApplied.value;
    const out: Partial<ActivityFeedApiFilters> = {};
    const from = f.occurredFrom.trim();
    const to = f.occurredTo.trim();
    if (from) out.occurred_from = activityPeriodFromToApi(from);
    if (to) out.occurred_to = activityPeriodToToApi(to);
    if (f.author.trim()) out.author = f.author.trim();
    if (f.entity) out.entity = f.entity;
    if (f.kinds.length) out.kinds = f.kinds.join(',');
    if (f.valueBefore.trim()) out.value_before = f.valueBefore.trim();
    if (f.valueAfter.trim()) out.value_after = f.valueAfter.trim();
    if (f.vacancyIds.length > 0) {
      out.vacancy_ids = f.vacancyIds.join(',');
    }
    return out;
  }

  const filteredEvents = computed(() => {
    let list = events.value;
    const h = headerSearch.value.trim().toLowerCase();
    if (h) {
      list = list.filter(e => eventSearchHaystack(e).includes(h));
    }
    const col = sortColumn.value;
    if (col != null) {
      const dir = sortDir.value;
      list = [...list].sort((a, b) => compareEventsForSort(a, b, col, dir));
    }
    return list;
  });

  const tableRows = computed(() =>
    filteredEvents.value.map(e => buildTableRow(e))
  );

  async function fetchPage(page: number, append: boolean) {
    if (append) loadingMore.value = true;
    else {
      loading.value = true;
      errorText.value = null;
    }
    try {
      const { items, meta: m } = await getActivityFeed({
        page,
        per_page: 100,
        filters: buildFeedFiltersForApi(),
      });
      if (append) {
        events.value = [...events.value, ...items];
      } else {
        events.value = items;
      }
      meta.value = m;
    } catch (e) {
      console.error('[Activity] load feed', e);
      if (!append) {
        errorText.value = 'Не удалось загрузить ленту событий.';
        events.value = [];
      }
    } finally {
      loading.value = false;
      loadingMore.value = false;
    }
  }

  function loadMore() {
    const m = meta.value;
    if (!m || m.current_page >= m.last_page) return;
    fetchPage(m.current_page + 1, true);
  }

  onMounted(() => {
    fetchPage(1, false);
  });
</script>

<template>
  <div class="container pb-28 pt-6">
    <div class="relative mb-15px rounded-fifteen bg-white p-25px">
      <div class="mb-50px flex items-center justify-between">
        <div class="flex flex-col gap-2.5">
          <h2 class="mb-2.5 text-xl font-semibold leading-normal text-space">
            События
          </h2>
          <p class="text-sm font-normal text-slate-custom">
            Лента действий по кандидатам вашего кабинета
          </p>
        </div>
      </div>
      <div class="absolute left-0 top-[103px] h-px w-full bg-athens" aria-hidden="true" />
      <div class="flex min-w-0 gap-x-15px">
        <MyInput
          v-model="headerSearch"
          class="h-10 min-h-0 min-w-0 flex-1 rounded-fifteen border-athens bg-athens-gray text-sm"
          placeholder="Поиск по событиям, кандидатам или ключевым фразам"
          :search="true"
        />
        <div class="flex shrink-0 gap-x-15px">
          <BtnIcon
            icon="funnel"
            :is-active="hasActiveFilters"
            tooltip-text="Фильтры"
            @click="openFilterPanel"
          />
        </div>
      </div>
    </div>

    <!-- modal=false: иначе Radix блокирует клики по телепорту календаря (body). Затемнение — как у Popup (DeleteConfirmPopup): bg-black + opacity 50%. -->
    <Teleport to="body">
      <Transition name="activity-filter-backdrop-fade">
        <div
          v-if="filterPanelOpen"
          class="activity-filter-backdrop fixed inset-0 z-50 bg-black bg-opacity-50"
          aria-hidden="true"
          @click="closeFilterPanel"
        />
      </Transition>
    </Teleport>
    <UiDialog v-model:open="filterPanelOpen" :modal="false">
      <UiDialogContent
        hide-close
        class="!z-[51] max-h-none w-[min(100vw-2rem,56rem)] max-w-none gap-3 overflow-visible !border-0 bg-white p-6 shadow-xl outline-none ring-0 ring-offset-0 focus:outline-none focus-visible:ring-0 data-[state=open]:outline-none sm:rounded-fifteen"
      >
        <UiDialogHeader class="text-left">
          <UiDialogTitle class="text-space">
            Фильтры
          </UiDialogTitle>
        </UiDialogHeader>

        <div class="activity-filter-fields">
          <div class="activity-filter-span-2 relative z-[40] min-w-0">
            <label class="activity-filter-label">
              Период: с
            </label>
            <DropdownCalendarStatic
              :model-value="filtersDraft.occurredFrom || null"
              @update:model-value="
                v => (filtersDraft.occurredFrom = v ? String(v) : '')
              "
            />
          </div>
          <div class="activity-filter-span-2 relative z-[40] min-w-0">
            <label class="activity-filter-label">
              Период: по
            </label>
            <DropdownCalendarStatic
              :model-value="filtersDraft.occurredTo || null"
              @update:model-value="
                v => (filtersDraft.occurredTo = v ? String(v) : '')
              "
            />
          </div>
          <div class="activity-filter-span-2 relative z-[38] min-w-0">
            <label class="activity-filter-label">Автор</label>
            <ResponseInput
              class="w-full min-w-0"
              :show-search-icon="false"
              :show-roles="true"
              placeholder="Менеджер аккаунта — выберите или введите имя"
              :responses="activityAuthorOptions"
              :model-value="filtersDraft.author"
              not-found="Нет совпадений — можно оставить как введено"
              @update:model-value="v => (filtersDraft.author = (v ?? '').toString())"
            />
          </div>
          <div class="activity-filter-span-2 relative z-[25] min-w-0">
            <label class="activity-filter-label">Сущность</label>
            <select v-model="filtersDraft.entity" class="activity-filter-input">
              <option value="">
                Все
              </option>
              <option value="candidate">
                Кандидат
              </option>
              <option value="task">
                Задача
              </option>
            </select>
          </div>
          <div class="activity-filter-span-2 relative z-[32] min-w-0">
            <label class="activity-filter-label">Тип события</label>
            <MultiSelect
              :model-value="filtersDraft.kinds"
              :options="activityKindMultiOptions"
              default-value="Выберите тип события"
              @update:model-value="v => (filtersDraft.kinds = Array.isArray(v) ? [...v] : [])"
            />
          </div>
          <div class="activity-filter-span-2 relative z-[31] min-w-0">
            <label class="activity-filter-label">Вакансия</label>
            <MultiSelect
              :model-value="filtersDraft.vacancyIds"
              :options="activityVacancyMultiOptions"
              :default-value="
                vacanciesLoading ? 'Загрузка…' : 'Все вакансии'
              "
              @update:model-value="
                v =>
                  (filtersDraft.vacancyIds = Array.isArray(v)
                    ? v.map(id => Number(id)).filter(n => n > 0)
                    : [])
              "
            />
          </div>
          <div class="activity-filter-span-2">
            <label class="activity-filter-label">Значение до</label>
            <input
              v-model="filtersDraft.valueBefore"
              type="text"
              class="activity-filter-input"
              placeholder="Подстрока в тексте / содержимом"
            >
          </div>
          <div class="activity-filter-span-2">
            <label class="activity-filter-label">Значение после</label>
            <input
              v-model="filtersDraft.valueAfter"
              type="text"
              class="activity-filter-input"
              placeholder="Подстрока в тексте / содержимом"
            >
          </div>
        </div>

        <UiDialogFooter
          class="mt-1 !flex !flex-row !flex-wrap items-center !justify-between gap-x-3 gap-y-2 border-t-0 pt-4"
        >
          <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
            <button
              type="button"
              class="rounded-ten bg-dodger px-4 py-2.5 text-sm font-semibold text-white"
              @click="applyFiltersFromPanel"
            >
              Применить
            </button>
            <UiButton variant="back" size="second-back" @click="closeFilterPanel">
              Отмена
            </UiButton>
          </div>
          <button
            v-if="hasAnyDraftFilter"
            type="button"
            class="shrink-0 text-sm font-light text-dodger hover:underline"
            @click="resetAllFiltersAndFetch"
          >
            Сбросить фильтры
          </button>
        </UiDialogFooter>
      </UiDialogContent>
    </UiDialog>

    <div class="relative rounded-fifteen bg-white">
      <div v-if="loading" class="flex min-h-[280px] items-center justify-center p-12">
        <UiDotsLoader />
      </div>
      <template v-else>
        <p v-if="errorText" class="p-25px text-sm text-red-custom">
          {{ errorText }}
        </p>
        <template v-else-if="tableRows.length === 0">
          <p class="p-25px text-center text-sm text-slate-custom">
            Событий пока нет или ничего не подошло под фильтр.
          </p>
        </template>
        <div v-else class="activity-table">
          <div class="activity-table-header">
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'date' }"
              @click="onSortColumnClick('date')"
            >
              Дата
              <span
                v-if="sortColumn === 'date'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'author' }"
              @click="onSortColumnClick('author')"
            >
              Автор
              <span
                v-if="sortColumn === 'author'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'object' }"
              @click="onSortColumnClick('object')"
            >
              Объект
              <span
                v-if="sortColumn === 'object'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'vacancy' }"
              @click="onSortColumnClick('vacancy')"
            >
              Вакансия
              <span
                v-if="sortColumn === 'vacancy'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'name' }"
              @click="onSortColumnClick('name')"
            >
              Название
              <span
                v-if="sortColumn === 'name'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'event' }"
              @click="onSortColumnClick('event')"
            >
              Событие
              <span
                v-if="sortColumn === 'event'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'valueBefore' }"
              @click="onSortColumnClick('valueBefore')"
            >
              Значение до
              <span
                v-if="sortColumn === 'valueBefore'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
            <button
              type="button"
              class="activity-th"
              :class="{ 'activity-th--active': sortColumn === 'valueAfter' }"
              @click="onSortColumnClick('valueAfter')"
            >
              Значение после
              <span
                v-if="sortColumn === 'valueAfter'"
                class="activity-th-arrow"
                aria-hidden="true"
              >{{ sortDir === 'asc' ? '↑' : '↓' }}</span>
            </button>
          </div>
          <div class="activity-table-body">
            <div
              v-for="row in tableRows"
              :key="`${row.event.candidate_id}-${row.event.id}`"
              class="activity-table-row"
            >
              <div class="text-sm font-normal text-space whitespace-nowrap" :title="row.date">
                {{ row.date }}
              </div>
              <div
                class="min-w-0 truncate text-sm font-normal text-space"
                :title="row.author"
              >
                {{ row.author }}
              </div>
              <div class="min-w-0">
                <NuxtLink
                  v-if="row.objectHref"
                  :to="row.objectHref"
                  class="block truncate text-sm font-normal text-dodger hover:underline"
                  title="Открыть карточку кандидата"
                >
                  {{ row.objectKindLabel }}
                </NuxtLink>
                <span
                  v-else
                  class="block truncate text-sm font-normal text-slate-custom"
                  title="Не задача и у события нет вакансии"
                >
                  —
                </span>
              </div>
              <div class="min-w-0">
                <NuxtLink
                  v-if="row.vacancyLinkId"
                  :to="`/vacancies/${row.vacancyLinkId}`"
                  class="block truncate text-sm font-normal text-dodger hover:underline"
                  :title="row.vacancyLabel"
                >
                  {{ row.vacancyLabel }}
                </NuxtLink>
                <span
                  v-else
                  class="block truncate text-sm font-normal text-slate-custom"
                  title="Событие не привязано к вакансии"
                >
                  —
                </span>
              </div>
              <div
                class="min-w-0 truncate text-sm font-normal text-space"
                :title="row.nameCol"
              >
                {{ row.nameCol }}
              </div>
              <div
                class="min-w-0 truncate text-sm font-normal text-slate-custom"
                :title="row.eventCol"
              >
                {{ row.eventCol }}
              </div>
              <div
                class="min-w-0 truncate text-sm font-normal text-space"
                :title="row.valueBefore"
              >
                {{ row.valueBefore }}
              </div>
              <div
                class="min-w-0 truncate text-sm font-normal text-space"
                :title="row.valueAfter"
              >
                {{ row.valueAfter }}
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="meta && meta.current_page < meta.last_page && !errorText"
          class="border-t border-athens p-25px text-center"
        >
          <button
            type="button"
            class="text-sm font-medium text-dodger hover:underline disabled:opacity-50"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? 'Загрузка…' : 'Показать ещё' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
  .activity-table {
    display: grid;
    gap: 1px;
  }

  .activity-table-header,
  .activity-table-row {
    display: grid;
    grid-template-columns:
      minmax(118px, 0.95fr)
      minmax(88px, 0.85fr)
      minmax(72px, 0.48fr)
      minmax(120px, 1.12fr)
      minmax(100px, 1fr)
      minmax(100px, 0.9fr)
      minmax(100px, 1fr)
      minmax(100px, 1fr);
    gap: 10px;
    padding: 18px 25px;
    align-items: center;
  }

  .activity-table-header {
    background-color: #f5f7fa;
    border-radius: 15px 15px 0 0;
    font-weight: 500;
    font-size: 14px;
    color: #79869a;
    text-align: left;
  }

  .activity-th {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    cursor: pointer;
    border-radius: 6px;
    max-width: 100%;
  }

  .activity-th:hover {
    color: #3eadef;
  }

  .activity-th--active {
    color: #3eadef;
  }

  .activity-th-arrow {
    flex-shrink: 0;
    font-size: 12px;
    line-height: 1;
    opacity: 0.9;
  }

  .activity-table-body {
    background: #fff;
    border-radius: 0 0 15px 15px;
    overflow: hidden;
  }

  .activity-table-row {
    background-color: #ffffff;
    padding-top: 14px;
    padding-bottom: 14px;
  }

  .activity-table-row:not(:last-child) {
    margin-bottom: 1px;
    box-shadow: 0 1px 0 0 #edeff5;
  }

  .activity-table-row:last-child {
    border-radius: 0 0 15px 15px;
  }

  .activity-filter-fields {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 12px 16px;
    align-content: start;
    /* Общий контекст наложения: z-index ячеек не «протекает» наружу диалога */
    isolation: isolate;
  }

  .activity-filter-span-2 {
    grid-column: span 2;
  }

  @media (max-width: 640px) {
    .activity-filter-fields {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .activity-filter-label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 500;
    color: #79869a;
  }

  .activity-filter-input {
    box-sizing: border-box;
    width: 100%;
    min-height: 40px;
    border-radius: 10px;
    border: 1px solid #edeff5;
    padding: 9px 15px;
    font-size: 14px;
    font-weight: 400;
    line-height: normal;
    color: #2f353d;
    background: #f5f7fa;
  }

  .activity-filter-input::placeholder {
    color: #9098b4;
    font-weight: 400;
  }

  .activity-filter-backdrop-fade-enter-active,
  .activity-filter-backdrop-fade-leave-active {
    transition: opacity 0.15s ease;
  }

  .activity-filter-backdrop-fade-enter-from,
  .activity-filter-backdrop-fade-leave-to {
    opacity: 0;
  }
</style>
