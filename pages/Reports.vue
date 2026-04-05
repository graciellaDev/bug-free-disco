<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import MyDropdown from '~/components/custom/MyDropdown.vue';
import MultiSelect from '~/components/custom/MultiSelect.vue';
import DropdownPeriodPicker from '@/components/custom/DropdownPeriodPicker.vue';
import { getVacancies, getVacancyCities } from '~/utils/getVacancies';
import { clientsList } from '~/utils/clientsList';
import { getDepartments } from '~/utils/executorsList';
import { getCandidates, getCandidateFunnelMetrics, getCandidateStageAverageDuration } from '@/src/api/candidates';
import { convertDateToApi } from '@/helpers/date';
import type { FunnelMetricsSort, StageAverageDurationReport } from '~/types/candidates';

const segmentOptions = ['Рекрутинг', 'Сотрудники'];
const metricOptions = [
  'Воронка статусов по вакансии',
  'Время закрытия позиций',
  'Среднее время на этапе',
  'Возможные источники',
  'Поток кандидатов',
  'Воронка найма',
];

const segment = ref('Рекрутинг');
const metric = ref('Воронка статусов по вакансии');
const dateRange = ref<{ from: string | null; to: string | null }>({ from: null, to: null });

const vacancyOptions = ref<{ value: number; name: string }[]>([]);
const selectedVacancy = ref<number | null>(null);
const vacancyStages = ref<{ id: number; name: string; count: number }[]>([]);
const vacancyCandidates = ref<{ stage?: number; source?: string | null }[]>([]);

const participantOptions = ref<{ value: number; name: string }[]>([]);
const selectedParticipants = ref<number[]>([]);

const isActiveFunnel = ref(false);
const isHoveredFunnel = ref(false);
const filtersPanelRef = ref<HTMLElement | null>(null);
const funnelButtonRef = ref<HTMLElement | null>(null);
const filterCity = ref<string[]>([]);
const filterDepartment = ref<number[]>([]);
const citiesFilterOptions = ref<{ value: string; name: string }[]>([]);
const departmentsFilterOptions = ref<{ value: number; name: string }[]>([]);

function funnelToggleActive() {
  isActiveFunnel.value = !isActiveFunnel.value;
}

function handleFiltersClickOutside(event: MouseEvent) {
  if (!isActiveFunnel.value) return;
  const path = event.composedPath?.() ? event.composedPath() : [];
  for (const el of path) {
    if (el instanceof HTMLElement) {
      if (filtersPanelRef.value?.contains(el) || funnelButtonRef.value?.contains(el)) return;
      if (el.closest?.('.options-wrapper') || el.getAttribute?.('role') === 'listbox' || el.closest?.('.calendar-wrapper')) return;
    }
  }
  isActiveFunnel.value = false;
}

onMounted(async () => {
  document.addEventListener('click', handleFiltersClickOutside);
  try {
    const [list, { clients: employees }, citiesList, deptsRaw] = await Promise.all([
      getVacancies('per_page=all'),
      clientsList('employees'),
      getVacancyCities(),
      getDepartments(true).catch(() => null),
    ]);
    const items = Array.isArray(list) ? list : [];
    vacancyOptions.value = items.map((v: { id: number; name?: string; title?: string }) => ({
      value: v.id,
      name: (v.name ?? v.title ?? '').trim() || `Вакансия #${v.id}`,
    }));
    if (vacancyOptions.value.length > 0 && selectedVacancy.value === null) {
      selectedVacancy.value = vacancyOptions.value[0].value;
    }
    const users = Array.isArray(employees) ? employees : [];
    participantOptions.value = users.map((u: { id: number; name?: string }) => ({
      value: u.id,
      name: (u.name ?? '').trim() || `Участник #${u.id}`,
    }));
    if (Array.isArray(citiesList) && citiesList.length) {
      citiesFilterOptions.value = citiesList.map((name) => ({ value: name, name }));
    }
    if (deptsRaw && Array.isArray(deptsRaw)) {
      departmentsFilterOptions.value = deptsRaw.map((d: { id: number; name?: string }) => ({ value: d.id, name: d.name || '' }));
    }
  } catch (e) {
    console.warn('Ошибка загрузки данных для фильтров:', e);
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleFiltersClickOutside);
  funnelMetricsAbort?.abort();
  stageAvgAbort?.abort();
});

const SOURCE_COLORS: Record<string, string> = {
  'hh.ru': '#f59e0b',
  'avito.ru': '#ef4444',
  'rabota.ru': '#a855f7',
  'Рекомендация': '#38bdf8',
  'Другое': '#22c55e',
};
const FALLBACK_COLORS = ['#f59e0b', '#ef4444', '#a855f7', '#38bdf8', '#22c55e', '#ec4899', '#8b5cf6'];

function buildCandidateFilters() {
  const filters: Record<string, string> = {};
  if (dateRange.value?.from && dateRange.value?.to) {
    filters['filters[created_at_from]'] = dateRange.value.from;
    filters['filters[created_at_to]'] = dateRange.value.to;
  }
  return filters;
}

watch(
  [selectedVacancy, dateRange],
  async ([vacancyId]) => {
    if (vacancyId) {
      try {
        const candidateFilters = {
          vacancy_id: vacancyId,
          per_page: 'all',
          ...buildCandidateFilters(),
        };
        const [list, candidatesRes] = await Promise.all([
          getVacancies(`filters[id]=${vacancyId}`),
          getCandidates(1, candidateFilters),
        ]);
      const items = Array.isArray(list) ? list : [];
      const vacancy = items.find((v: { id?: number }) => v.id === vacancyId) ?? items[0];
      const footerStages = vacancy?.footerData?.stages;
      if (Array.isArray(footerStages) && footerStages.length > 0) {
        vacancyStages.value = footerStages
          .filter((s: { id?: number }) => s.id != null)
          .map((s: { id: number; name: string; count?: number }) => ({
            id: s.id,
            name: s.name,
            count: typeof s.count === 'number' ? s.count : 0,
          }));
      } else {
        vacancyStages.value = [];
      }
      vacancyCandidates.value = candidatesRes?.candidates ?? [];
    } catch {
      vacancyStages.value = [];
      vacancyCandidates.value = [];
    }
  } else {
    vacancyStages.value = [];
    vacancyCandidates.value = [];
  }
},
  { deep: true }
);

const chartData = [
  { value: '5000', label: 'просмотры' },
  { value: '832', label: 'отклики' },
  { value: '384', label: 'воронка' },
  { value: '141', label: 'отказы' },
];

const tableColumns = [
  { key: 'source', label: 'Источник' },
  { key: 'views', label: 'Просмотры' },
  { key: 'responses', label: 'Отклики' },
  { key: 'funnel', label: 'Движение по воронке' },
  { key: 'rejections', label: 'Отказы' },
];

const tableData = [
  { source: 'Платные доски объявлений', sourceIcon: true, views: 5000, responses: 700, funnel: 300, rejections: 100 },
  { source: 'hh.ru', views: 2320, responses: 321, funnel: 121, rejections: 43 },
  { source: 'superjob.ru', views: 1023, responses: 99, funnel: 41, rejections: 14 },
];

const activeSortColumn = ref('views');

/** Отчёт «Поток кандидатов» (GET /candidates/funnel-metrics) */
const funnelBucketOptions = [
  { value: 'day' as const, name: 'День' },
  { value: 'week' as const, name: 'Неделя' },
  { value: 'month' as const, name: 'Месяц' },
];
const funnelBucket = ref<'day' | 'week' | 'month'>('week');
const funnelSort = ref<FunnelMetricsSort>('period');
const funnelAsc = ref<0 | 1>(1);
const funnelMetrics = ref<Awaited<ReturnType<typeof getCandidateFunnelMetrics>> | null>(null);
const funnelLoading = ref(false);
const funnelError = ref<string | null>(null);
/** Смена ключа перезапускает CSS-анимацию столбиков после загрузки данных. */
const funnelBarAnimKey = ref(0);
let funnelMetricsAbort: AbortController | null = null;

const funnelRows = computed(() => funnelMetrics.value?.rows ?? []);
const maxFunnelChartValue = computed(() => {
  let m = 1;
  for (const r of funnelRows.value) {
    m = Math.max(m, r.responses, r.funnel_movements);
  }
  return m;
});

/** Подписи оси Y (0 … max, равномерно). */
const funnelChartYTicks = computed(() => {
  const max = maxFunnelChartValue.value;
  const n = 5;
  return Array.from({ length: n }, (_, i) => Math.round((max * i) / (n - 1)));
});

function funnelBarHeightPct(value: number) {
  const max = maxFunnelChartValue.value;
  if (max <= 0) return '0%';
  return `${(value / max) * 100}%`;
}

/** Дата из календаря (д.м.год) → Y-m-d для API. */
function datePickerToYmd(s: string | null | undefined): string | null {
  if (!s) return null;
  const t = convertDateToApi(s);
  if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = String(s).trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (m) {
    const [, d, mo, y] = m;
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return null;
}

async function fetchFunnelMetrics() {
  if (metric.value !== 'Поток кандидатов') return;
  const vid = selectedVacancy.value;
  const from = datePickerToYmd(dateRange.value?.from);
  const to = datePickerToYmd(dateRange.value?.to);
  if (!vid || !from || !to) {
    funnelMetrics.value = null;
    funnelError.value = null;
    return;
  }
  funnelMetricsAbort?.abort();
  funnelMetricsAbort = new AbortController();
  const signal = funnelMetricsAbort.signal;
  funnelLoading.value = true;
  funnelError.value = null;
  try {
    funnelMetrics.value = await getCandidateFunnelMetrics(
      {
        vacancy_id: vid,
        date_from: from,
        date_to: to,
        bucket: funnelBucket.value,
        sort: funnelSort.value,
        asc: funnelAsc.value,
      },
      { signal }
    );
    funnelBarAnimKey.value += 1;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    funnelMetrics.value = null;
    let msg = 'Не удалось загрузить отчёт';
    if (e && typeof e === 'object' && 'response' in e) {
      const res = (e as { response?: { _data?: { message?: string } } }).response?._data;
      if (res?.message) msg = res.message;
    }
    funnelError.value = msg;
  } finally {
    funnelLoading.value = false;
  }
}

function toggleFunnelSort(column: FunnelMetricsSort) {
  if (funnelSort.value === column) {
    funnelAsc.value = funnelAsc.value === 1 ? 0 : 1;
  } else {
    funnelSort.value = column;
    funnelAsc.value = column === 'period' ? 1 : 0;
  }
}

function applyReportsFilters() {
  void fetchFunnelMetrics();
  void fetchStageAverageDuration();
}

watch(
  [metric, selectedVacancy, dateRange, funnelBucket, funnelSort, funnelAsc],
  () => {
    void fetchFunnelMetrics();
  },
  { deep: true }
);

/** Отчёт «Среднее время на этапе» */
const stageAvgReport = ref<StageAverageDurationReport | null>(null);
const stageAvgLoading = ref(false);
const stageAvgBarAnimKey = ref(0);
let stageAvgAbort: AbortController | null = null;
let stageAvgRequestId = 0;

/** Демо-значения по макету (если API нет или вернул неполные данные). */
const STAGE_AVG_DEMO = {
  avg_close_days: 30,
  avg_overdue_days: 92,
  hired_count: 18,
  hired_total: 68,
  closure_on_time_percent: 30,
  closure_on_time: 150,
  closure_overdue: 109,
  stageDaysPattern: [32, 17, 10, 7, 5] as const,
};

function buildStageAvgFallback(vacancyId: number): StageAverageDurationReport {
  const pattern = STAGE_AVG_DEMO.stageDaysPattern;
  const stages =
    vacancyStages.value.length > 0
      ? vacancyStages.value.map((s, i) => ({
          stage_id: s.id,
          stage_name: s.name,
          avg_days: pattern[i % pattern.length] ?? pattern[0],
        }))
      : [
          { stage_name: 'Подумать', avg_days: 32 },
          { stage_name: 'Подходящие', avg_days: 17 },
          { stage_name: 'Отклоненные', avg_days: 10 },
          { stage_name: 'Подходящие', avg_days: 7 },
          { stage_name: 'У заказчика', avg_days: 5 },
        ];
  return {
    vacancy_id: vacancyId,
    avg_close_days: STAGE_AVG_DEMO.avg_close_days,
    avg_overdue_days: STAGE_AVG_DEMO.avg_overdue_days,
    hired_count: STAGE_AVG_DEMO.hired_count,
    hired_total: STAGE_AVG_DEMO.hired_total,
    closure_on_time_percent: STAGE_AVG_DEMO.closure_on_time_percent,
    closure_on_time: STAGE_AVG_DEMO.closure_on_time,
    closure_overdue: STAGE_AVG_DEMO.closure_overdue,
    stages,
  };
}

async function fetchStageAverageDuration() {
  if (metric.value !== 'Среднее время на этапе') return;
  const vid = selectedVacancy.value;
  const from = datePickerToYmd(dateRange.value?.from);
  const to = datePickerToYmd(dateRange.value?.to);
  if (!vid || !from || !to) {
    stageAvgReport.value = null;
    return;
  }
  const reqId = ++stageAvgRequestId;
  stageAvgAbort?.abort();
  stageAvgAbort = new AbortController();
  const signal = stageAvgAbort.signal;
  stageAvgLoading.value = true;
  try {
    const api = await getCandidateStageAverageDuration(
      { vacancy_id: vid, date_from: from, date_to: to },
      { signal }
    );
    if (reqId !== stageAvgRequestId || selectedVacancy.value !== vid) return;
    stageAvgReport.value = api;
    stageAvgBarAnimKey.value += 1;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    if (reqId !== stageAvgRequestId) return;
    stageAvgReport.value = null;
    stageAvgBarAnimKey.value += 1;
  } finally {
    if (reqId === stageAvgRequestId) stageAvgLoading.value = false;
  }
}

const stageAvgEffective = computed((): StageAverageDurationReport | null => {
  const vid = selectedVacancy.value;
  if (!vid) return null;
  if (stageAvgLoading.value) return null;
  if (stageAvgReport.value && stageAvgReport.value.vacancy_id === vid) {
    return stageAvgReport.value;
  }
  const from = datePickerToYmd(dateRange.value?.from);
  const to = datePickerToYmd(dateRange.value?.to);
  if (!from || !to) return null;
  return buildStageAvgFallback(vid);
});

const stageAvgBarMax = computed(() => {
  const rows = stageAvgEffective.value?.stages ?? [];
  let m = 1;
  for (const r of rows) m = Math.max(m, r.avg_days);
  return m;
});

function stageAvgBarWidthPct(days: number) {
  const max = stageAvgBarMax.value;
  if (max <= 0) return '0%';
  return `${(days / max) * 100}%`;
}

watch([metric, selectedVacancy, dateRange], () => {
  void fetchStageAverageDuration();
}, { deep: true });

// Данные для отчёта «Воронка статусов по вакансии»: источники и сегменты из реальных кандидатов
/** Разбивка по этапам и источникам: stageId -> { sourceName -> count } */
const stageSourceBreakdown = computed(() => {
  const breakdown: Record<number, Record<string, number>> = {};
  for (const c of vacancyCandidates.value) {
    const stageId = c.stage ?? 0;
    const source = c.source?.trim() || 'Не указан';
    if (!breakdown[stageId]) breakdown[stageId] = {};
    breakdown[stageId][source] = (breakdown[stageId][source] ?? 0) + 1;
  }
  return breakdown;
});

/** Уникальные источники с цветами и общим количеством (для легенды справа) */
const stagesLegendSources = computed(() => {
  const totals: Record<string, number> = {};
  for (const c of vacancyCandidates.value) {
    const source = c.source?.trim() || 'Не указан';
    totals[source] = (totals[source] ?? 0) + 1;
  }
  const order = ['hh.ru', 'avito.ru', 'rabota.ru', 'Рекомендация', 'Другое', 'Не указан'];
  const sorted = [...new Set([...order.filter(s => totals[s] > 0), ...Object.keys(totals).filter(s => !order.includes(s))])];
  let colorIndex = 0;
  return sorted.map(name => ({
    name,
    count: totals[name] ?? 0,
    color: SOURCE_COLORS[name] ?? FALLBACK_COLORS[colorIndex++ % FALLBACK_COLORS.length],
  })).filter(s => s.count > 0);
});

/** Сегменты полосы для конкретного этапа (по stage.id) */
function getStageSegments(stageId: number): { color: string; share: number; count: number }[] {
  const bySource = stageSourceBreakdown.value[stageId] ?? {};
  const total = Object.values(bySource).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const sources = stagesLegendSources.value;
  return sources
    .filter(s => (bySource[s.name] ?? 0) > 0)
    .map(s => ({
      color: s.color,
      share: (bySource[s.name] ?? 0) / total,
      count: bySource[s.name] ?? 0,
    }));
}

const mockRejectionValues = [15, 8, 4, 3];
const rejectionsLegend = [
  { color: '#4b5563', name: 'Несоответствующая квалификация', count: 27 },
  { color: '#9ca3af', name: 'Неудобно добираться до работы', count: 3 },
];
const rejectionsLegendTotal = 30;

/** Количество кандидатов на каждом этапе (из отфильтрованных кандидатов, учитывая дату создания). */
const funnelBarTotals = computed(() => {
  const byStage: Record<number, number> = {};
  for (const c of vacancyCandidates.value) {
    const sid = c.stage ?? 0;
    byStage[sid] = (byStage[sid] ?? 0) + 1;
  }
  return vacancyStages.value.map((s) => byStage[s.id] ?? 0);
});
const rejectionBarValues = computed(() => {
  const n = vacancyStages.value.length;
  if (!n) return [];
  const out = [];
  for (let i = 0; i < n; i++) out.push(mockRejectionValues[i % mockRejectionValues.length] ?? mockRejectionValues[0]);
  return out;
});
const maxFunnelTotal = computed(() => Math.max(...funnelBarTotals.value, 1));
const maxRejectionValue = computed(() => Math.max(...rejectionBarValues.value, 1));

/** Всего кандидатов в воронке выбранной вакансии. */
const stagesLegendTotal = computed(() => funnelBarTotals.value.reduce((a, b) => a + b, 0));

/** Процент: нарастающий итог (или фактическое кол-во для закрытых этапов) от общего количества. */
const stagePercentOfTotal = computed(() => {
  const stages = vacancyStages.value;
  const passedThrough = stagePassedThroughCounts.value;
  const totals = funnelBarTotals.value;
  const total = stagesLegendTotal.value;
  if (total === 0) return [];
  return stages.map((s, i) => {
    const val = CLOSED_STAGE_NAMES.includes(s.name) ? (totals[i] ?? 0) : (passedThrough[i] ?? 0);
    return Math.round((val / total) * 100);
  });
});

const CLOSED_STAGE_NAMES = ['Нанят на работу', 'Отказ'];

/** Накопительный подсчёт: количество кандидатов, прошедших через этап (сумма текущего этапа и всех следующих). */
const stagePassedThroughCounts = computed(() => {
  const totals = funnelBarTotals.value;
  if (!totals.length) return [];
  const out: number[] = [];
  for (let i = 0; i < totals.length; i++) {
    out.push(totals.slice(i).reduce((a, b) => a + b, 0));
  }
  return out;
});

/** Для отображения: закрытые этапы — фактическое количество, остальные — нарастающий итог. */
const stageDisplayCounts = computed(() => {
  const stages = vacancyStages.value;
  const passedThrough = stagePassedThroughCounts.value;
  return stages.map((s, i) =>
    CLOSED_STAGE_NAMES.includes(s.name) ? s.count : (passedThrough[i] ?? 0)
  );
});

const maxPassedThrough = computed(() => {
  const p = stageDisplayCounts.value;
  return p.length ? Math.max(...p, 1) : 1;
});

function barStyle(rowIndex: number) {
  const passedThrough = stageDisplayCounts.value[rowIndex] ?? 0;
  const max = maxPassedThrough.value;
  const widthPct = max > 0 ? (passedThrough / max) * 100 : 0;
  return {
    width: `${widthPct}%`,
    minWidth: passedThrough > 0 ? '24px' : '4px',
    backgroundColor: passedThrough > 0 ? 'transparent' : '#e5e7eb',
  };
}

</script>

<template>
  <div class="container pb-28px pt-35px">
    <!-- Карточка 1: Фильтры и селекты (relative z-10 чтобы выпадающие списки были поверх блоков ниже) -->
    <div class="relative z-10 mb-15px rounded-ten bg-white p-25px shadow-sm">
      <div class="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-end">
        <div>
          <label class="mb-2 block text-sm font-medium text-space">Сегмент</label>
          <MyDropdown
            v-model="segment"
            :options="segmentOptions"
            placeholder="Выберите сегмент"
            trigger-variant="semiaction"
            class="w-full"
          />
        </div>
        <div>
          <label class="mb-2 block text-sm font-medium text-space">Отчет</label>
          <MyDropdown
            v-model="metric"
            :options="metricOptions"
            placeholder="Выберите отчет"
            trigger-variant="semiaction"
            class="w-full"
          />
        </div>
        <div class="flex justify-end">
          <UiButton
            variant="semiaction"
            size="semiaction"
            class="bg-space text-white hover:bg-space/90"
          >
            Экспорт CSV
          </UiButton>
        </div>
      </div>

      <div class="my-5 border-b border-athens" role="separator" aria-hidden="true" />

      <!-- Поля и кнопки: Вакансия (один выбор), Кандидаты за период, Участники, кнопка фильтров, Применить -->
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 basis-40">
          <label class="mb-2 block text-sm font-medium text-space">Вакансия</label>
          <MyDropdown
            v-model="selectedVacancy"
            :options="vacancyOptions"
            placeholder="Выберите вакансию"
            clearable
            searchable
            search-placeholder="Поиск вакансий"
            class="w-full"
          />
        </div>
        <div class="min-w-0 flex-1 basis-40">
          <label class="mb-2 block text-sm font-medium text-space">Кандидаты за период</label>
          <DropdownPeriodPicker
            v-model="dateRange"
            class="w-full"
          />
        </div>
        <div class="min-w-0 flex-1 basis-40">
          <label class="mb-2 block text-sm font-medium text-space">Участники</label>
          <MultiSelect
            v-model="selectedParticipants"
            :options="participantOptions"
            default-value="Участники"
            searchable
            search-placeholder="Поиск участников"
            class="w-full"
          />
        </div>
        <div class="flex-shrink-0">
          <button
            ref="funnelButtonRef"
            type="button"
            class="flex h-10 w-10 items-center justify-center rounded-ten border border-zumthor bg-zumthor text-dodger transition-colors hover:bg-zumthor/90"
            :class="
              isHoveredFunnel || (filterCity.length > 0 || filterDepartment.length > 0)
                ? 'border-dodger bg-zumthor text-dodger'
                : ''
            "
            @mouseover="isHoveredFunnel = true"
            @mouseleave="isHoveredFunnel = false"
            @click="funnelToggleActive"
          >
            <svg-icon name="funnel" width="20" height="20" />
          </button>
        </div>
        <div class="flex-shrink-0">
          <UiButton variant="action" size="semiaction" @click="applyReportsFilters">
            Применить
          </UiButton>
        </div>
      </div>

      <transition name="fade">
        <div
          v-if="isActiveFunnel"
          ref="filtersPanelRef"
          class="filters-wrapper relative left-0 top-[10px] z-20 w-full rounded-b-ten bg-white pb-25px pt-15px"
        >
          <p class="mb-4 text-lg font-medium leading-normal text-space">
            Дополнительные фильтры
          </p>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p class="mb-2 text-sm font-medium text-space">Город</p>
              <MultiSelect
                v-model="filterCity"
                :options="citiesFilterOptions"
                default-value="Выберите города"
                searchable
                search-placeholder="Поиск городов"
                class="w-full"
              />
            </div>
            <div>
              <p class="mb-2 text-sm font-medium text-space">Отдел</p>
              <MultiSelect
                v-model="filterDepartment"
                :options="departmentsFilterOptions"
                default-value="Выберите отделы"
                class="w-full"
              />
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- Контент зависит от выбранного отчёта -->
    <template v-if="metric === 'Воронка статусов по вакансии'">
      <!-- Отчёт «Воронка статусов по вакансии»: этапы и полосы по выбранной вакансии -->
      <div class="rounded-ten bg-white p-25px shadow-sm">
        <template v-if="!selectedVacancy">
          <p class="py-8 text-center text-slate-custom">Выберите вакансию, чтобы отобразить этапы и воронку кандидатов.</p>
        </template>
        <template v-else-if="vacancyStages.length === 0">
          <p class="py-8 text-center text-slate-custom">Загрузка этапов вакансии…</p>
        </template>
        <div v-else class="flex gap-8">
          <!-- Воронка кандидатов: название этапа напротив полосы, в скобках — накопительное количество (прошло через этап) -->
          <div class="min-w-0 flex-1">
            <p class="mb-3 text-sm font-bold text-space">Воронка кандидатов</p>
            <div class="flex flex-col gap-4">
              <div
                v-for="(stage, rowIndex) in vacancyStages"
                :key="'funnel-' + stage.id"
                class="flex h-[40px] items-center gap-4"
              >
                <div class="flex w-48 min-w-0 flex-shrink-0 items-center gap-1 text-sm font-medium text-space">
                  <span class="min-w-0 truncate" :title="stage.name">{{ stage.name }}</span>
                  <span class="flex-shrink-0">({{ stageDisplayCounts[rowIndex] ?? 0 }})</span>
                </div>
                <div class="flex h-[40px] min-w-0 flex-1 overflow-hidden rounded-[10px] bg-athens-gray/40">
                  <div
                    class="flex h-[40px] overflow-hidden rounded-[10px]"
                    :style="barStyle(rowIndex)"
                  >
                    <template v-if="(stageDisplayCounts[rowIndex] ?? 0) > 0">
                      <div
                        v-for="(seg, segIndex) in getStageSegments(stage.id)"
                        :key="segIndex"
                        class="transition-colors"
                        :style="{
                          width: `${seg.share * 100}%`,
                          backgroundColor: seg.color,
                          minWidth: seg.count > 0 ? '2px' : '0',
                        }"
                      />
                    </template>
                  </div>
                </div>
                <span class="flex-shrink-0 text-sm text-slate-custom">
                  {{ stagePercentOfTotal[rowIndex] ?? 0 }}%
                </span>
              </div>
            </div>
          </div>

          <!-- Правая колонка: источники кандидатов с цветами и количеством -->
          <div class="w-56 flex-shrink-0">
            <p class="mb-2 text-sm font-bold text-space">Источники кандидатов</p>
            <p class="mb-3 text-lg font-bold text-dodger">{{ stagesLegendTotal }}</p>
            <ul class="space-y-1.5 text-sm text-slate-custom">
              <li
                v-for="item in stagesLegendSources"
                :key="item.name"
                class="flex items-center gap-2"
              >
                <span
                  class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :style="{ backgroundColor: item.color }"
                />
                <span class="min-w-0 truncate">{{ item.name }}</span>
                <span class="flex-shrink-0">{{ item.count }}</span>
              </li>
            </ul>
          </div>
        </div>

        <!-- Один контейнер в одну линию: «Отказы после этапов» + полосы и «Отказы» + счётчик и список -->
        <div v-if="selectedVacancy && vacancyStages.length > 0" class="mt-6 flex flex-wrap items-start gap-8 border-t border-athens pt-6">
          <div class="min-w-0 flex-1">
            <p class="mb-3 text-sm font-bold text-space">Отказы после этапов</p>
            <div class="flex flex-col gap-4">
              <div
                v-for="(stage, rowIndex) in vacancyStages"
                :key="'rej-' + stage.id"
                class="flex h-10 items-center gap-4"
              >
                <div class="flex w-48 min-w-0 flex-shrink-0 items-center text-sm font-medium text-space">
                  <span class="min-w-0 truncate" :title="stage.name">{{ stage.name }}</span>
                </div>
                <div class="flex min-w-0 flex-1 items-center">
                  <div
                    class="h-6 rounded-full bg-gray-300"
                    :style="{
                      width: `${(rejectionBarValues[rowIndex] / maxRejectionValue) * 100}%`,
                      minWidth: rejectionBarValues[rowIndex] > 0 ? '8px' : '0',
                    }"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="w-56 flex-shrink-0">
            <p class="mb-2 text-sm font-bold text-space">Отказы</p>
            <p class="mb-3 text-lg font-bold text-dodger">{{ rejectionsLegendTotal }}</p>
            <ul class="space-y-1.5 text-sm text-slate-custom">
              <li
                v-for="item in rejectionsLegend"
                :key="item.name"
                class="flex items-center gap-2"
              >
                <span
                  class="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  :style="{ backgroundColor: item.color }"
                />
                <span class="min-w-0 flex-1">{{ item.name }}</span>
                <span class="flex-shrink-0">{{ item.count }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="metric === 'Поток кандидатов'">
      <div class="rounded-ten bg-white p-25px shadow-sm">
        <div class="mb-6 flex flex-wrap items-end gap-4">
          <div class="min-w-[200px] flex-1 sm:max-w-xs">
            <label class="mb-2 block text-sm font-medium text-space">Интервал</label>
            <MyDropdown
              v-model="funnelBucket"
              :options="funnelBucketOptions"
              placeholder="Неделя"
              trigger-variant="semiaction"
              class="w-full"
            />
          </div>
        </div>

        <template v-if="!selectedVacancy || !dateRange?.from || !dateRange?.to">
          <p class="py-8 text-center text-slate-custom">Выберите вакансию и период в фильтрах выше.</p>
        </template>
        <template v-else-if="funnelLoading">
          <p class="py-8 text-center text-slate-custom">Загрузка…</p>
        </template>
        <template v-else-if="funnelError">
          <p class="py-8 text-center text-red-custom">{{ funnelError }}</p>
        </template>
        <template v-else>
          <p class="mb-4 text-sm font-bold text-space">Поток кандидатов</p>

          <div class="mb-2 flex flex-wrap items-center gap-6 text-sm">
            <span class="inline-flex items-center gap-2 text-slate-custom">
              <span class="h-3 w-3 rounded-sm bg-space" />
              Отклики
            </span>
            <span class="inline-flex items-center gap-2 text-slate-custom">
              <span class="h-3 w-3 rounded-sm bg-orange" />
              Движение по воронке
            </span>
          </div>

          <div class="flex gap-3 overflow-x-auto pb-2">
            <div
              class="flex shrink-0 flex-col justify-between py-1 text-right text-xs text-slate-custom"
              :style="{ height: '220px' }"
            >
              <span v-for="tick in [...funnelChartYTicks].reverse()" :key="'y-' + tick">{{ tick }}</span>
            </div>
            <div
              class="relative min-h-[220px] min-w-0 flex-1 border-b border-athens bg-[length:100%_20%] bg-[linear-gradient(to_bottom,#edeff5_1px,transparent_1px)]"
            >
              <div :key="funnelBarAnimKey" class="flex h-[220px] items-end gap-2 px-1">
                <div
                  v-for="(row, ri) in funnelRows"
                  :key="row.period_from + '-' + row.period_to + '-' + ri"
                  class="flex min-w-[52px] flex-col items-center justify-end gap-2"
                >
                  <div class="flex h-[200px] w-full items-end justify-center gap-1">
                    <div
                      class="funnel-bar-fill w-[42%] max-w-[18px] rounded-t-md bg-space"
                      :style="{
                        height: funnelBarHeightPct(row.responses),
                        animationDelay: `${ri * 45}ms`,
                      }"
                      :title="'Отклики: ' + row.responses"
                    />
                    <div
                      class="funnel-bar-fill w-[42%] max-w-[18px] rounded-t-md bg-orange"
                      :style="{
                        height: funnelBarHeightPct(row.funnel_movements),
                        animationDelay: `${ri * 45 + 55}ms`,
                      }"
                      :title="'Движение: ' + row.funnel_movements"
                    />
                  </div>
                  <span
                    class="max-w-[96px] text-center text-[10px] leading-tight text-slate-custom sm:text-xs"
                    :title="row.period_label"
                  >{{ row.period_label }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-8 overflow-x-auto">
            <table class="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr class="border-b border-athens">
                  <th class="pb-3 pr-4 font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex items-center gap-1 hover:text-dodger"
                      :class="{ 'border-b-2 border-dodger text-dodger': funnelSort === 'period' }"
                      @click="toggleFunnelSort('period')"
                    >
                      Период
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          funnelSort === 'period'
                            ? funnelAsc === 1
                              ? '-rotate-90'
                              : 'rotate-90'
                            : 'rotate-90 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                  <th class="pb-3 pr-4 text-right font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-end gap-1 hover:text-dodger"
                      :class="{ 'border-b-2 border-dodger text-dodger': funnelSort === 'responses' }"
                      @click="toggleFunnelSort('responses')"
                    >
                      Отклики
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          funnelSort === 'responses'
                            ? funnelAsc === 1
                              ? '-rotate-90'
                              : 'rotate-90'
                            : 'rotate-90 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                  <th class="pb-3 text-right font-medium text-space">
                    <button
                      type="button"
                      class="inline-flex w-full items-center justify-end gap-1 hover:text-dodger"
                      :class="{ 'border-b-2 border-dodger text-dodger': funnelSort === 'funnel_movements' }"
                      @click="toggleFunnelSort('funnel_movements')"
                    >
                      Движение по воронке
                      <svg-icon
                        name="dropdown-arrow"
                        width="16"
                        height="16"
                        class="text-slate-custom transition-transform"
                        :class="[
                          funnelSort === 'funnel_movements'
                            ? funnelAsc === 1
                              ? '-rotate-90'
                              : 'rotate-90'
                            : 'rotate-90 opacity-40',
                        ]"
                      />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, idx) in funnelRows"
                  :key="'tbl-' + idx + '-' + row.period_label"
                  class="border-b border-athens last:border-0"
                >
                  <td class="py-3 pr-4 text-space">{{ row.period_label }}</td>
                  <td class="py-3 pr-4 text-right text-slate-custom">{{ row.responses }}</td>
                  <td class="py-3 text-right text-slate-custom">{{ row.funnel_movements }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <template v-else-if="metric === 'Среднее время на этапе'">
      <div class="rounded-ten bg-white p-25px shadow-sm">
        <template v-if="!selectedVacancy || !dateRange?.from || !dateRange?.to">
          <p class="py-8 text-center text-slate-custom">Выберите вакансию и период в фильтрах выше.</p>
        </template>
        <template v-else-if="stageAvgLoading">
          <p class="py-8 text-center text-slate-custom">Загрузка…</p>
        </template>
        <template v-else-if="stageAvgEffective">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div class="rounded-ten bg-[#FEFCE8] px-6 py-5">
              <p class="text-3xl font-bold leading-tight text-space">
                {{ stageAvgEffective.avg_close_days }}
              </p>
              <p class="mt-2 text-sm leading-snug text-slate-custom">
                Средний срок закрытия (дни)
              </p>
            </div>
            <div class="rounded-ten bg-[#FEE2E2] px-6 py-5">
              <p class="text-3xl font-bold leading-tight text-red-custom">
                {{ stageAvgEffective.avg_overdue_days }}
              </p>
              <p class="mt-2 text-sm leading-snug text-slate-custom">
                Средний срок просрочки (дни)
              </p>
            </div>
            <div class="rounded-ten bg-[#EFF6FF] px-6 py-5">
              <p class="text-3xl font-bold leading-tight text-dodger">
                {{ stageAvgEffective.hired_count }} из {{ stageAvgEffective.hired_total }}
              </p>
              <p class="mt-2 text-sm leading-snug text-slate-custom">
                Нанято кандидатов
              </p>
            </div>
          </div>

          <div class="mt-6 rounded-ten bg-[#F8F9FB] px-6 py-4">
            <p class="text-base font-medium text-space">
              Из закрытых позиций {{ stageAvgEffective.closure_on_time_percent }}% закрыты в срок
            </p>
            <p class="mt-1 text-sm text-slate-custom">
              {{ stageAvgEffective.closure_on_time }} позиций закрыты в срок,
              {{ stageAvgEffective.closure_overdue }} просрочены
            </p>
          </div>

          <p class="mb-4 mt-8 text-sm font-bold text-space">
            Среднее время на этапе
          </p>
          <div :key="stageAvgBarAnimKey" class="flex flex-col gap-1">
            <div
              v-for="(row, si) in stageAvgEffective.stages"
              :key="(row.stage_id ?? row.stage_name) + '-' + si"
              class="flex min-h-[40px] items-center gap-4 py-1"
            >
              <div class="w-44 min-w-0 flex-shrink-0 text-sm font-medium text-space sm:w-52">
                <span class="truncate" :title="row.stage_name">{{ row.stage_name }}</span>
              </div>
              <div class="min-w-0 flex-1">
                <div class="h-3 w-full overflow-hidden rounded-full bg-athens">
                  <div
                    class="stage-avg-bar-fill h-full rounded-full bg-[#052137]"
                    :style="{
                      width: stageAvgBarWidthPct(row.avg_days),
                      animationDelay: `${si * 48}ms`,
                    }"
                  />
                </div>
              </div>
              <div class="w-10 flex-shrink-0 text-right text-sm font-medium tabular-nums text-space">
                {{ row.avg_days }}
              </div>
            </div>
          </div>
        </template>
        <template v-else>
          <p class="py-8 text-center text-slate-custom">Нет данных для отображения.</p>
        </template>
      </div>
    </template>

    <template v-else>
      <!-- Контент для остальных отчётов: донат-графики и таблица -->
      <div class="mb-15px flex flex-wrap justify-between gap-6 rounded-ten bg-white p-25px shadow-sm">
        <div
          v-for="(item, index) in chartData"
          :key="index"
          class="relative flex h-36 w-36 flex-col items-center justify-center"
        >
          <div
            class="absolute inset-0 rounded-full"
            style="
              background: conic-gradient(
                #f59e0b 0deg 300deg,
                #ec4899 300deg 330deg,
                #a855f7 330deg 360deg
              );
            "
          />
          <div class="absolute flex h-28 w-28 items-center justify-center rounded-full bg-white" />
          <div class="relative z-10 text-center">
            <span class="block text-xl font-bold text-space">{{ item.value }}</span>
            <span class="block text-xs font-normal text-slate-custom">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="rounded-ten bg-white p-25px shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr class="border-b border-athens">
                <th class="pb-3 pr-4 font-medium text-space">
                  {{ tableColumns[0].label }}
                </th>
                <th
                  v-for="col in tableColumns.slice(1)"
                  :key="col.key"
                  class="cursor-pointer pb-3 pr-4 font-medium text-space hover:text-dodger"
                  :class="{ 'border-b-2 border-dodger': activeSortColumn === col.key }"
                  @click="activeSortColumn = col.key"
                >
                  <span class="inline-flex items-center gap-1">
                    {{ col.label }}
                    <svg-icon name="dropdown-arrow" width="16" height="16" class="rotate-90 text-slate-custom" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(row, idx) in tableData"
                :key="idx"
                class="border-b border-athens last:border-0"
              >
                <td class="py-3 pr-4">
                  <span class="inline-flex items-center gap-2">
                    <span
                      v-if="row.sourceIcon"
                      class="h-3 w-3 rounded-full bg-amber-400"
                    />
                    {{ row.source }}
                  </span>
                </td>
                <td class="py-3 pr-4 text-slate-custom">{{ row.views }}</td>
                <td class="py-3 pr-4 text-slate-custom">{{ row.responses }}</td>
                <td class="py-3 pr-4 text-slate-custom">{{ row.funnel }}</td>
                <td class="py-3 pr-4 text-slate-custom">{{ row.rejections }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
@keyframes funnel-bar-grow {
  from {
    transform: scaleY(0);
  }
  to {
    transform: scaleY(1);
  }
}

.funnel-bar-fill {
  transform-origin: bottom;
  animation: funnel-bar-grow 0.55s cubic-bezier(0.33, 1, 0.68, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .funnel-bar-fill {
    animation: none;
    transform: none;
  }
}

@keyframes stage-avg-bar-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

.stage-avg-bar-fill {
  transform-origin: left center;
  animation: stage-avg-bar-grow 0.55s cubic-bezier(0.33, 1, 0.68, 1) both;
}

@media (prefers-reduced-motion: reduce) {
  .stage-avg-bar-fill {
    animation: none;
    transform: none;
  }
}
</style>
