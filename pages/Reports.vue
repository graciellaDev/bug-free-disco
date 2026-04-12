<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick } from 'vue';
import MyDropdown from '~/components/custom/MyDropdown.vue';
import MultiSelect from '~/components/custom/MultiSelect.vue';
import DropdownPeriodPicker from '@/components/custom/DropdownPeriodPicker.vue';
import { getVacancies, getVacancyCities } from '~/utils/getVacancies';
import { clientsList } from '~/utils/clientsList';
import { getDepartments } from '~/utils/executorsList';
import {
  getCandidatesAllPages,
  getCandidateFunnelMetrics,
  getCandidateStageAverageDuration,
  getCandidateRejectionByStage,
} from '@/src/api/candidates';
import { getRecruitersReport } from '@/src/api/reports';
import { convertDateFromApi, convertDateToApi } from '@/helpers/date';
import type {
  Candidate,
  FunnelMetricsSort,
  RejectionByStageData,
  RejectionByStageRow,
  StageAverageDurationReport,
} from '~/types/candidates';
import type { RecruitersReportData, RecruitersReportVacancyRow } from '~/types/reports';

const segmentOptions = ['Сотрудники', 'Рекрутинг'];
const metricOptions = [
  'Воронка статусов по вакансии',
  'Отчет по отказам',
  'Отчет по рекрутерам',
  'Среднее время на этапе',
  'Возможные источники',
  'Поток кандидатов',
];

const segment = ref('Сотрудники');
const metric = ref('Воронка статусов по вакансии');
const dateRange = ref<{ from: string | null; to: string | null }>({ from: null, to: null });

const vacancyOptions = ref<{ value: number; name: string }[]>([]);
const selectedVacancy = ref<number | null>(null);
const vacancyStages = ref<{ id: number; name: string; count: number }[]>([]);
const vacancyCandidates = ref<Candidate[]>([]);
const candidatesLoading = ref(false);
/** Смена ключа перезапускает анимацию радиальных блоков «Возможные источники». */
const possibleSourcesRadialAnimKey = ref(0);

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
  if (metric.value === 'Воронка статусов по вакансии') {
    nextTick(() => triggerFunnelBarAnimation());
  }
  if (metric.value === 'Отчет по отказам') {
    nextTick(() => triggerRejectionReportAnimation());
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleFiltersClickOutside);
  funnelMetricsAbort?.abort();
  stageAvgAbort?.abort();
  rejectionReportAbort?.abort();
  recruitersReportAbort?.abort();
});

/** Кандидаты, созданные вручную в CRM без внешней площадки (пустой source). */
const PLATFORM_SOURCE_LABEL = 'Платформа';

/** Фиксированные цвета известных площадок (ключ — нормализованная строка). */
const SOURCE_COLORS: Record<string, string> = {
  [PLATFORM_SOURCE_LABEL]: '#5898ff',
  'hh.ru': '#FFBA08',
  'avito.ru': '#ef4444',
  'rabota.ru': '#a855f7',
  'superjob.ru': '#06b6d4',
  'zarplata.ru': '#ea580c',
  'linkedin.com': '#0a66c2',
  'linkedin': '#0a66c2',
  'habr.com': '#65a30d',
  'career.habr.com': '#65a30d',
  'geekjob.ru': '#7c3aed',
  'getmatch.ru': '#db2777',
  'djinni.co': '#16a34a',
  'Рекомендация': '#38bdf8',
  'Другое': '#22c55e',
};

/** Синонимы названий источника из API → ключ из SOURCE_COLORS. */
const SOURCE_COLOR_ALIASES: Record<string, string> = {
  hh: 'hh.ru',
  'hh.ru': 'hh.ru',
  headhunter: 'hh.ru',
  'хедхантер': 'hh.ru',
  sj: 'superjob.ru',
  superjob: 'superjob.ru',
  'superjob.ru': 'superjob.ru',
  avito: 'avito.ru',
  rabota: 'rabota.ru',
  zarplata: 'zarplata.ru',
  linkedin: 'linkedin.com',
};

function normalizeSourceColorKey(raw: string): string {
  let s = raw.trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/^www\./, '');
  const slash = s.indexOf('/');
  if (slash !== -1) s = s.slice(0, slash);
  return s;
}

/** Стабильный оттенок для любой неизвестной площадки (не один жёлтый для всех). */
function hashSourceToHslColor(str: string): string {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 58% 46%)`;
}

function colorForSourceLabel(source: string): string {
  if (source === PLATFORM_SOURCE_LABEL) {
    return SOURCE_COLORS[PLATFORM_SOURCE_LABEL]!;
  }
  const n = normalizeSourceColorKey(source);
  const alias = SOURCE_COLOR_ALIASES[n];
  const key = alias ?? n;
  if (SOURCE_COLORS[key]) {
    return SOURCE_COLORS[key]!;
  }
  for (const [needle, color] of Object.entries(SOURCE_COLORS)) {
    if (needle === PLATFORM_SOURCE_LABEL) continue;
    if (n === needle || n.endsWith(needle) || needle.endsWith(n)) {
      return color;
    }
  }
  return hashSourceToHslColor(source);
}

/** Laravel ожидает d.m.Y в filters; нормализуем однозначные дни/месяцы. */
function normalizeDotDateForApi(s: string): string {
  const t = String(s).trim();
  const m = t.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return t;
  const [, d, mo, y] = m;
  return `${d.padStart(2, '0')}.${mo.padStart(2, '0')}.${y}`;
}

function buildCandidateFilters() {
  const filters: Record<string, string> = {};
  if (dateRange.value?.from && dateRange.value?.to) {
    let from = String(dateRange.value.from);
    let to = String(dateRange.value.to);
    if (/^\d{4}-\d{2}-\d{2}/.test(from)) {
      from = convertDateFromApi(from) ?? from;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(to)) {
      to = convertDateFromApi(to) ?? to;
    }
    filters['filters[created_at_from]'] = normalizeDotDateForApi(from);
    filters['filters[created_at_to]'] = normalizeDotDateForApi(to);
  }
  return filters;
}

watch(
  [selectedVacancy, dateRange],
  async ([vacancyId]) => {
    if (vacancyId) {
      candidatesLoading.value = true;
      try {
        const candidateFilters = {
          vacancy_id: vacancyId,
          per_page: 'all',
          ...buildCandidateFilters(),
        };
        const [list, allCandidates] = await Promise.all([
          getVacancies(`filters[id]=${vacancyId}`),
          getCandidatesAllPages(candidateFilters),
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
      vacancyCandidates.value = allCandidates as Candidate[];
      possibleSourcesRadialAnimKey.value += 1;
    } catch {
      vacancyStages.value = [];
      vacancyCandidates.value = [];
    } finally {
      candidatesLoading.value = false;
    }
  } else {
    vacancyStages.value = [];
    vacancyCandidates.value = [];
    candidatesLoading.value = false;
  }
},
  { deep: true }
);

/** Заглушка для отчётов без своей логики (не «Возможные источники»). */
const fallbackChartData = [
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

const fallbackTableData = [
  { source: 'Платные доски объявлений', sourceIcon: true, views: 5000, responses: 700, funnel: 300, rejections: 100 },
  { source: 'hh.ru', views: 2320, responses: 321, funnel: 121, rejections: 43 },
  { source: 'superjob.ru', views: 1023, responses: 99, funnel: 41, rejections: 14 },
];

const activeSortColumn = ref('responses');

const REJECTION_STAGE_NAME = 'Отказ';

function candidateStageId(c: Candidate): number | null {
  const s = c.stage;
  if (typeof s === 'number' && Number.isFinite(s)) return s;
  if (s && typeof s === 'object' && 'id' in s) {
    const id = (s as { id?: number }).id;
    return id != null && Number.isFinite(id) ? Number(id) : null;
  }
  return null;
}

function stageNameById(stageId: number | null): string | null {
  if (stageId == null) return null;
  return vacancyStages.value.find((s) => s.id === stageId)?.name ?? null;
}

const firstVacancyStageId = computed(() => vacancyStages.value[0]?.id ?? null);

const rejectionStageId = computed(() => {
  const byName = vacancyStages.value.find((s) => s.name === REJECTION_STAGE_NAME);
  return byName?.id ?? null;
});

/** Отчёт «Возможные источники»: агрегация GET /candidates по полю source и этапам воронки. */
const possibleSourcesTableRows = computed(() => {
  const list = vacancyCandidates.value;
  const firstId = firstVacancyStageId.value;
  const rejId = rejectionStageId.value;
  const bySource = new Map<string, Candidate[]>();
  for (const c of list) {
    const raw = (c.source ?? '').trim();
    const key = raw || PLATFORM_SOURCE_LABEL;
    if (!bySource.has(key)) bySource.set(key, []);
    bySource.get(key)!.push(c);
  }
  const rows: {
    source: string;
    sourceIcon: boolean;
    views: number | string;
    responses: number;
    funnel: number;
    rejections: number;
    colorDot: string;
  }[] = [];
  for (const [source, arr] of bySource) {
    const responses = arr.length;
    const funnel = arr.filter((c) => {
      const sid = candidateStageId(c);
      return sid != null && firstId != null && sid !== firstId;
    }).length;
    const rejections = arr.filter((c) => {
      const sid = candidateStageId(c);
      if (rejId != null && sid === rejId) return true;
      return stageNameById(sid) === REJECTION_STAGE_NAME;
    }).length;
    rows.push({
      source,
      sourceIcon: true,
      views: '—',
      responses,
      funnel,
      rejections,
      colorDot: colorForSourceLabel(source),
    });
  }
  rows.sort((a, b) => b.responses - a.responses);
  return rows;
});

/** Кольцо conic-gradient по долям платформ (источников); углы от -90° (верх). */
function conicGradientFromPlatformSegments(segments: { color: string; ratio: number }[]): string {
  const filtered = segments.filter((s) => s.ratio > 0);
  if (filtered.length === 0) {
    return 'conic-gradient(from -90deg, #edeff5 0% 100%)';
  }
  let acc = 0;
  const stops: string[] = [];
  for (const seg of filtered) {
    const r = Math.min(1, Math.max(0, seg.ratio));
    if (r <= 0) continue;
    const startPct = acc * 100;
    acc += r;
    const endPct = Math.min(100, acc * 100);
    stops.push(`${seg.color} ${startPct}% ${endPct}%`);
  }
  if (acc < 0.999) {
    stops.push(`#edeff5 ${acc * 100}% 100%`);
  }
  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

/** Четыре радиальных блока: кольцо = доли по платформам (цвета как в таблице), в центре — сумма по метрике. */
const possibleSourcesRadialCharts = computed(() => {
  const rows = possibleSourcesTableRows.value;

  const sum = (k: 'responses' | 'funnel' | 'rejections') =>
    rows.reduce((s, r) => s + r[k], 0);

  function segmentsFor(metric: 'responses' | 'funnel' | 'rejections') {
    const total = sum(metric);
    if (total <= 0) return [];
    return rows.map((r) => ({
      color: r.colorDot,
      ratio: r[metric] / total,
    }));
  }

  const totalResponses = sum('responses');
  const totalFunnel = sum('funnel');
  const totalRejections = sum('rejections');

  return [
    {
      value: '0',
      label: 'просмотры',
      gradient: 'conic-gradient(from -90deg, #e2e8f0 0% 100%)',
    },
    {
      value: String(totalResponses),
      label: 'отклики',
      gradient: conicGradientFromPlatformSegments(segmentsFor('responses')),
    },
    {
      value: String(totalFunnel),
      label: 'воронка',
      gradient: conicGradientFromPlatformSegments(segmentsFor('funnel')),
    },
    {
      value: String(totalRejections),
      label: 'отказы',
      gradient: conicGradientFromPlatformSegments(segmentsFor('rejections')),
    },
  ];
});

const sortedPossibleSourcesRows = computed(() => {
  const col = activeSortColumn.value;
  const rows = [...possibleSourcesTableRows.value];
  rows.sort((a, b) => {
    const va = a[col as keyof typeof a];
    const vb = b[col as keyof typeof b];
    if (col === 'source') {
      return String(a.source).localeCompare(String(b.source), 'ru');
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return vb - va;
    }
    return 0;
  });
  return rows;
});

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
  return `calc(${(value / max) * 100}% - 4px)`;
}

/** Дата из календаря (д.м.год) → Y-m-d для API. */
function datePickerToYmd(s: string | null | undefined): string | null {
  if (!s) return null;
  const raw = String(s).trim();
  // Иногда компонент периода уже отдаёт Y-m-d.
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const t = convertDateToApi(raw);
  if (t && /^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
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
  void fetchRejectionByStageReport();
  void fetchRecruitersReport();
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

watch(
  [metric, selectedVacancy, dateRange, selectedParticipants, filterCity, filterDepartment],
  () => {
    void fetchStageAverageDuration();
    void fetchRejectionByStageReport();
    void fetchRecruitersReport();
  },
  { deep: true }
);

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
  return sorted.map(name => ({
    name,
    count: totals[name] ?? 0,
    color: colorForSourceLabel(name === 'Не указан' ? PLATFORM_SOURCE_LABEL : name),
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

/** Отчёт «Отчет по отказам» — GET /candidates/rejection-by-stage */
const rejectionReportData = ref<RejectionByStageData | null>(null);
const rejectionReportLoading = ref(false);
const rejectionReportError = ref<string | null>(null);
let rejectionReportAbort: AbortController | null = null;
let rejectionReportRequestId = 0;

function enrichRejectionReportStageIds(rows: RejectionByStageRow[]): RejectionByStageRow[] {
  const stages = vacancyStages.value;
  const byName = new Map(stages.map((s) => [s.name.trim().toLowerCase(), s.id]));
  return rows.map((r) => {
    if (r.stage_id > 0) return r;
    const id = byName.get(r.stage_name.trim().toLowerCase());
    return id != null ? { ...r, stage_id: id } : r;
  });
}

function sortRejectionReportRows(rows: RejectionByStageRow[]): RejectionByStageRow[] {
  const stages = vacancyStages.value;
  const order = new Map(stages.map((s, i) => [s.id, i]));
  return [...rows].sort((a, b) => {
    const oa = order.has(a.stage_id) ? order.get(a.stage_id)! : 9999;
    const ob = order.has(b.stage_id) ? order.get(b.stage_id)! : 9999;
    if (oa !== ob) return oa - ob;
    return a.stage_name.localeCompare(b.stage_name, 'ru');
  });
}

const rejectionReportDisplayRows = computed(() => {
  const rows = rejectionReportData.value?.rows;
  if (!rows?.length) return [];
  return sortRejectionReportRows(enrichRejectionReportStageIds([...rows]));
});

const rejectionReportMaxRejections = computed(() => {
  const rows = rejectionReportDisplayRows.value;
  if (!rows.length) return 1;
  return Math.max(...rows.map((r) => r.rejections_count), 1);
});

function rejectionReportRowPct(row: RejectionByStageRow): number {
  if (row.candidates_count <= 0) return 0;
  return Math.round((row.rejections_count / row.candidates_count) * 100);
}

function rejectionReportRowSegments(row: RejectionByStageRow): { color: string; share: number }[] {
  const rc = row.rejections_count;
  if (rc <= 0) return [];
  if (row.reasons?.length) {
    return row.reasons
      .filter((x) => x.count > 0)
      .map((r) => ({
        color: (r.color && r.color.trim()) || colorForSourceLabel(r.label),
        share: r.count / rc,
      }));
  }
  return [{ color: '#5898ff', share: 1 }];
}

async function fetchRejectionByStageReport() {
  if (metric.value !== 'Отчет по отказам') return;
  const vid = selectedVacancy.value;
  if (!vid) {
    rejectionReportData.value = null;
    rejectionReportError.value = null;
    return;
  }
  const from = datePickerToYmd(dateRange.value?.from);
  const to = datePickerToYmd(dateRange.value?.to);
  const reqId = ++rejectionReportRequestId;
  rejectionReportAbort?.abort();
  rejectionReportAbort = new AbortController();
  const signal = rejectionReportAbort.signal;
  rejectionReportLoading.value = true;
  rejectionReportError.value = null;
  try {
    const params =
      from && to
        ? { vacancy_id: vid, date_from: from, date_to: to }
        : { vacancy_id: vid };
    const data = await getCandidateRejectionByStage(params, { signal });
    if (reqId !== rejectionReportRequestId || selectedVacancy.value !== vid) return;
    if (data == null) {
      rejectionReportData.value = null;
      rejectionReportError.value =
        'Не удалось загрузить отчёт. Убедитесь, что на бэкенде доступен GET /candidates/rejection-by-stage (vacancy_id, опционально date_from, date_to).';
      return;
    }
    rejectionReportData.value = data;
    triggerRejectionReportAnimation();
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    if (reqId !== rejectionReportRequestId) return;
    rejectionReportData.value = null;
    rejectionReportError.value = 'Не удалось загрузить отчёт по отказам';
  } finally {
    if (reqId === rejectionReportRequestId) rejectionReportLoading.value = false;
  }
}

/** Отчёт «Отчет по рекрутерам» — GET /reports/recruiters */
const recruitersReportData = ref<RecruitersReportData | null>(null);
const recruitersReportLoading = ref(false);
const recruitersReportError = ref<string | null>(null);
let recruitersReportAbort: AbortController | null = null;
let recruitersReportRequestId = 0;

function vacanciesCountWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d1 = abs % 10;
  if (abs > 10 && abs < 20) return 'вакансий';
  if (d1 === 1) return 'вакансия';
  if (d1 >= 2 && d1 <= 4) return 'вакансии';
  return 'вакансий';
}

function formatAvgDaysDays(d: number | null): string {
  if (d == null || !Number.isFinite(d)) return '—';
  const rounded = Math.round(d);
  return `${rounded} дн.`;
}

function vacancyIsOnPause(status: string): boolean {
  const s = status.trim().toLowerCase();
  return (
    s === 'on_pause' ||
    s === 'paused' ||
    s === 'pause' ||
    s.includes('пауз')
  );
}

function hiredProgressPercent(v: RecruitersReportVacancyRow): string | null {
  if (v.hired_percentage != null && Number.isFinite(v.hired_percentage)) {
    return `${Math.round(v.hired_percentage)}%`;
  }
  if (v.hired_target > 0) {
    return `${Math.round((v.hired_count / v.hired_target) * 100)}%`;
  }
  return null;
}

function rejectionsRatePercent(v: RecruitersReportVacancyRow): string | null {
  if (v.rejections_percentage != null && Number.isFinite(v.rejections_percentage)) {
    return `${Math.round(v.rejections_percentage)}%`;
  }
  if (v.candidates_added_count > 0) {
    return `${Math.round((v.rejections_count / v.candidates_added_count) * 100)}%`;
  }
  return null;
}

const recruitersReportHasRows = computed(() => {
  const list = recruitersReportData.value?.recruiters ?? [];
  return list.some((r) => (r.vacancies?.length ?? 0) > 0);
});

async function fetchRecruitersReport() {
  if (metric.value !== 'Отчет по рекрутерам') return;
  const from = datePickerToYmd(dateRange.value?.from);
  const to = datePickerToYmd(dateRange.value?.to);
  const reqId = ++recruitersReportRequestId;
  recruitersReportAbort?.abort();
  recruitersReportAbort = new AbortController();
  const signal = recruitersReportAbort.signal;
  recruitersReportLoading.value = true;
  recruitersReportError.value = null;
  try {
    const params: Parameters<typeof getRecruitersReport>[0] = {};
    if (from) params.date_from = from;
    if (to) params.date_to = to;
    if (selectedVacancy.value != null) params.vacancy_id = selectedVacancy.value;
    if (selectedParticipants.value.length) {
      params.participant_ids = [...selectedParticipants.value];
    }
    if (filterDepartment.value.length) {
      params.department_ids = [...filterDepartment.value];
    }
    if (filterCity.value.length) {
      params.cities = [...filterCity.value];
    }
    const data = await getRecruitersReport(params, { signal });
    if (reqId !== recruitersReportRequestId) return;
    if (data == null) {
      recruitersReportData.value = null;
      recruitersReportError.value =
        'Не удалось загрузить отчёт. Нужен GET /reports/recruiters (см. описание в docs/API.md).';
      return;
    }
    recruitersReportData.value = data;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    if (reqId !== recruitersReportRequestId) return;
    recruitersReportData.value = null;
    recruitersReportError.value = 'Не удалось загрузить отчёт по рекрутерам';
  } finally {
    if (reqId === recruitersReportRequestId) recruitersReportLoading.value = false;
  }
}

/** Количество кандидатов на каждом этапе (из отфильтрованных кандидатов, учитывая дату создания). */
const funnelBarTotals = computed(() => {
  const byStage: Record<number, number> = {};
  for (const c of vacancyCandidates.value) {
    const sid = c.stage ?? 0;
    byStage[sid] = (byStage[sid] ?? 0) + 1;
  }
  return vacancyStages.value.map((s) => byStage[s.id] ?? 0);
});
const maxFunnelTotal = computed(() => Math.max(...funnelBarTotals.value, 1));

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

/** После смены данных — сначала ширина 0%, затем переход к целевой (анимация полос воронки). */
const funnelBarsAnimActive = ref(false);
/** Анимация полос отчёта «Отчет по отказам». */
const rejectionReportAnimActive = ref(false);

function triggerFunnelBarAnimation() {
  funnelBarsAnimActive.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      funnelBarsAnimActive.value = true;
    });
  });
}

function triggerRejectionReportAnimation() {
  rejectionReportAnimActive.value = false;
  nextTick(() => {
    requestAnimationFrame(() => {
      rejectionReportAnimActive.value = true;
    });
  });
}

watch(
  () => metric.value,
  (m) => {
    if (m === 'Воронка статусов по вакансии') {
      triggerFunnelBarAnimation();
    }
    if (m === 'Отчет по отказам') {
      triggerRejectionReportAnimation();
    }
  }
);

watch(
  [selectedVacancy, vacancyStages, vacancyCandidates],
  () => {
    if (metric.value !== 'Воронка статусов по вакансии') return;
    triggerFunnelBarAnimation();
  },
  { deep: true }
);

function barStyle(rowIndex: number) {
  const passedThrough = stageDisplayCounts.value[rowIndex] ?? 0;
  const max = maxPassedThrough.value;
  const widthPct = max > 0 ? (passedThrough / max) * 100 : 0;
  const w = funnelBarsAnimActive.value ? widthPct : 0;
  return {
    width: `${w}%`,
    minWidth: w > 0 && passedThrough > 0 ? '24px' : '0',
    backgroundColor: passedThrough > 0 ? 'transparent' : '#e5e7eb',
  };
}

function rejectionReportTrackWidthPct(row: RejectionByStageRow) {
  const maxR = rejectionReportMaxRejections.value;
  if (row.rejections_count <= 0) return 0;
  return maxR > 0 ? (row.rejections_count / maxR) * 100 : 0;
}

function rejectionReportBarTrackStyle(row: RejectionByStageRow) {
  const target = rejectionReportTrackWidthPct(row);
  const w = rejectionReportAnimActive.value ? target : 0;
  return {
    width: `${w}%`,
    maxWidth: '100%',
    minWidth: row.rejections_count > 0 && w > 0 ? '8px' : '0',
    transition: 'width 0.7s cubic-bezier(0.33, 1, 0.68, 1)',
  };
}

</script>

<template>
  <div class="container pb-28px pt-35px">
    <!-- Карточка фильтров: макет Figma — белая карточка 15px, отступы 25px -->
    <div class="relative z-10 mb-15px rounded-fifteen bg-white p-25px shadow-sm">
      <div class="mb-5 grid grid-cols-1 gap-5 md:grid-cols-3 md:items-end">
        <!--<div>
          <label class="mb-2 block text-sm font-medium text-space">Сегмент</label>
          <MyDropdown
            v-model="segment"
            :options="segmentOptions"
            placeholder="Выберите сегмент"
            trigger-variant="semiaction"
            class="w-full"
          />
        </div>-->
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
          class="filters-wrapper relative left-0 top-[10px] z-20 w-full rounded-b-fifteen bg-white pb-25px pt-15px"
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
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
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
                    class="flex h-[40px] overflow-hidden rounded-[10px] transition-[width] duration-700 ease-out will-change-[width]"
                    :style="barStyle(rowIndex)"
                  >
                    <template v-if="(stageDisplayCounts[rowIndex] ?? 0) > 0">
                      <div
                        v-for="(seg, segIndex) in getStageSegments(stage.id)"
                        :key="segIndex"
                        class="transition-[width] duration-700 ease-out"
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
      </div>
    </template>

    <template v-else-if="metric === 'Отчет по отказам'">
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
        <p class="mb-6 text-lg font-bold text-space">
          Отчет по отказам
        </p>
        <template v-if="!selectedVacancy">
          <p class="py-8 text-center text-slate-custom">Выберите вакансию, чтобы открыть отчёт.</p>
        </template>
        <template v-else-if="rejectionReportLoading">
          <p class="py-8 text-center text-slate-custom">Загрузка данных…</p>
        </template>
        <template v-else-if="rejectionReportError">
          <p class="py-8 text-center text-red-custom">{{ rejectionReportError }}</p>
        </template>
        <template v-else-if="!rejectionReportDisplayRows.length">
          <p class="py-8 text-center text-slate-custom">Нет строк в ответе сервера за выбранный период.</p>
        </template>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr class="border-b border-athens">
                  <th colspan="2" class="pb-2 pr-4 text-xs font-normal text-bali">
                    Статус и кол-во кандидатов
                  </th>
                  <th colspan="2" class="pb-2 text-xs font-normal text-bali">
                    Отказы
                  </th>
                </tr>
                <tr class="border-b border-athens">
                  <th class="py-3 pr-4 font-medium text-space">Этап</th>
                  <th class="w-24 py-3 pr-4 text-right font-medium text-space">
                    Кандидатов
                  </th>
                  <th class="w-36 py-3 pr-4 text-right font-medium text-space">
                    Отказы
                  </th>
                  <th class="min-w-[200px] py-3 font-medium text-space" />
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, ri) in rejectionReportDisplayRows"
                  :key="'rejrep-' + (row.stage_id || row.stage_name) + '-' + ri"
                  class="align-middle"
                >
                  <td class="py-3 pr-4 font-medium text-space">
                    {{ row.stage_name }}
                  </td>
                  <td class="py-3 pr-4 text-right tabular-nums text-slate-custom">
                    {{ row.candidates_count }}
                  </td>
                  <td class="py-3 pr-4 text-right tabular-nums text-slate-custom">
                    {{ row.rejections_count }} ({{ rejectionReportRowPct(row) }}%)
                  </td>
                  <td class="py-3">
                    <div class="flex min-h-7 min-w-0 items-center">
                      <template v-if="rejectionReportRowSegments(row).length > 0">
                        <div
                          class="flex h-7 overflow-hidden rounded-full bg-athens"
                          :style="rejectionReportBarTrackStyle(row)"
                        >
                          <div class="flex h-full min-w-0 flex-1">
                            <div
                              v-for="(seg, si) in rejectionReportRowSegments(row)"
                              :key="si"
                              class="h-full min-w-0"
                              :style="{
                                width: `${seg.share * 100}%`,
                                backgroundColor: seg.color,
                                minWidth: seg.share > 0 ? '2px' : '0',
                              }"
                            />
                          </div>
                        </div>
                      </template>
                      <div
                        v-else
                        class="h-7 rounded-full bg-[#e5e7eb] transition-[width] duration-700 ease-out"
                        :style="{
                          width: rejectionReportAnimActive ? '48px' : '0',
                          minWidth: rejectionReportAnimActive ? '48px' : '0',
                        }"
                      />
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <template v-else-if="metric === 'Поток кандидатов'">
      <div class="flex flex-col gap-[25px] rounded-fifteen bg-white p-25px shadow-sm">
        <div class="flex flex-wrap items-end gap-4">
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
              <span class="h-3 w-3 rounded-sm bg-[#FFBA08]" />
              Движение по воронке
            </span>
          </div>

          <div class="flex gap-3 overflow-x-auto pb-2 sm:pl-[60px]">
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
                  class="flex min-w-[110px] flex-col items-center justify-end gap-2"
                >
                  <div class="flex h-[200px] w-full items-end justify-center gap-1">
                    <div
                      class="funnel-bar-fill w-[49px] max-w-[49px] shrink-0 rounded-[5px] bg-space"
                      :style="{
                        height: funnelBarHeightPct(row.responses),
                        animationDelay: `${ri * 45}ms`,
                      }"
                      :title="'Отклики: ' + row.responses"
                    />
                    <div
                      class="funnel-bar-fill w-[49px] max-w-[49px] shrink-0 rounded-[5px] bg-[#FFBA08]"
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

          <div class="mt-[25px] overflow-hidden overflow-x-auto rounded-fifteen bg-athens">
            <table class="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr class="bg-catskill">
                  <th class="py-3 pl-15px pr-25px font-medium text-space">
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
                  <th class="py-3 pl-15px pr-25px text-right font-medium text-space">
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
                  <th class="py-3 pl-15px pr-25px text-right font-medium text-space">
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
              <tbody class="bg-white">
                <tr
                  v-for="(row, idx) in funnelRows"
                  :key="'tbl-' + idx + '-' + row.period_label"
                  class="border-b border-athens last:border-0"
                >
                  <td class="py-3 pl-15px pr-25px text-space">{{ row.period_label }}</td>
                  <td class="py-3 pl-15px pr-25px text-right text-slate-custom">{{ row.responses }}</td>
                  <td class="py-3 pl-15px pr-25px text-right text-slate-custom">{{ row.funnel_movements }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <template v-else-if="metric === 'Среднее время на этапе'">
      <div class="flex flex-col gap-[15px]">
        <template v-if="!selectedVacancy || !dateRange?.from || !dateRange?.to">
          <div class="rounded-fifteen bg-white p-25px shadow-sm">
            <p class="py-8 text-center text-slate-custom">Выберите вакансию и период в фильтрах выше.</p>
          </div>
        </template>
        <template v-else-if="stageAvgLoading">
          <div class="rounded-fifteen bg-white p-25px shadow-sm">
            <p class="py-8 text-center text-slate-custom">Загрузка…</p>
          </div>
        </template>
        <template v-else-if="stageAvgEffective">
          <!-- Верхняя карточка: сводка + баннер (Figma Variant3) -->
          <div class="flex flex-col gap-[15px] rounded-fifteen bg-white p-25px shadow-sm">
            <div class="grid grid-cols-1 gap-[15px] sm:grid-cols-3">
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-chilean p-25px">
                <p class="text-3xl font-bold leading-tight text-space">
                  {{ stageAvgEffective.avg_close_days }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Средний срок закрытия (дни)
                </p>
              </div>
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-pink p-25px">
                <p class="text-3xl font-bold leading-tight text-red-custom">
                  {{ stageAvgEffective.avg_overdue_days }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Средний срок просрочки (дни)
                </p>
              </div>
              <div class="flex flex-col gap-2.5 rounded-fifteen bg-zumthor p-25px">
                <p class="text-3xl font-bold leading-tight text-dodger">
                  {{ stageAvgEffective.hired_count }} из {{ stageAvgEffective.hired_total }}
                </p>
                <p class="text-sm leading-snug text-slate-custom">
                  Нанято кандидатов
                </p>
              </div>
            </div>

            <div class="rounded-fifteen bg-athens-gray p-25px">
              <p class="text-base font-medium text-space">
                Из закрытых позиций {{ stageAvgEffective.closure_on_time_percent }}% закрыты в срок
              </p>
              <p class="mt-1.5 text-sm leading-snug text-slate-custom">
                {{ stageAvgEffective.closure_on_time }} позиций закрыты в срок,
                {{ stageAvgEffective.closure_overdue }} просрочены
              </p>
            </div>
          </div>

          <!-- Нижняя карточка: горизонтальные бары -->
          <div class="rounded-fifteen bg-white p-25px shadow-sm">
            <p class="mb-4 text-sm font-bold text-space">
              Среднее время на этапе
            </p>
            <div :key="stageAvgBarAnimKey" class="flex flex-col gap-2">
              <div
                v-for="(row, si) in stageAvgEffective.stages"
                :key="(row.stage_id ?? row.stage_name) + '-' + si"
                class="flex min-h-10 items-center gap-4"
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
          </div>
        </template>
        <template v-else>
          <div class="rounded-fifteen bg-white p-25px shadow-sm">
            <p class="py-8 text-center text-slate-custom">Нет данных для отображения.</p>
          </div>
        </template>
      </div>
    </template>

    <template v-else-if="metric === 'Отчет по рекрутерам'">
      <div class="rounded-fifteen bg-white p-25px shadow-sm sm:px-[50px]">
        <p class="mb-6 text-lg font-bold text-space">
          Отчет по рекрутерам
        </p>
        <template v-if="recruitersReportLoading">
          <p class="py-8 text-center text-slate-custom">Загрузка данных…</p>
        </template>
        <template v-else-if="recruitersReportError">
          <p class="py-8 text-center text-red-custom">{{ recruitersReportError }}</p>
        </template>
        <template v-else-if="!(recruitersReportData?.recruiters?.length)">
          <p class="py-8 text-center text-slate-custom">Нет данных за выбранные фильтры.</p>
        </template>
        <template v-else>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[720px] table-fixed text-left text-sm">
              <thead>
                <tr class="border-b border-athens bg-catskill">
                  <th class="w-[32%] py-3 pl-15px pr-4 font-medium text-space">
                    Сотрудники и их вакансии
                  </th>
                  <th class="w-[14%] py-3 pr-4 text-right font-medium text-space">
                    Добавленные кандидаты
                  </th>
                  <th class="w-[16%] py-3 pr-4 text-right font-medium text-space">
                    Нанятые
                  </th>
                  <th class="w-[16%] py-3 pr-4 text-right font-medium text-space">
                    Отказы
                  </th>
                  <th class="w-[22%] bg-athens py-3 pr-15px pl-4 text-right font-medium text-space">
                    Ср. срок найма и закрытия
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <template
                  v-for="rec in recruitersReportData?.recruiters ?? []"
                  :key="'recruiter-' + rec.recruiter_id"
                >
                  <tr class="border-b border-athens bg-zumthor/60">
                    <td colspan="4" class="py-3 pl-15px pr-4 align-middle">
                      <span class="font-bold text-space">{{ rec.name }}</span>
                      <span v-if="rec.position_title" class="font-bold text-space">
                        ({{ rec.position_title }})
                      </span>
                      <span class="font-normal text-slate-custom">
                        • {{ rec.vacancies_count }} {{ vacanciesCountWord(rec.vacancies_count) }} на
                        {{ rec.target_headcount }} чел.
                      </span>
                    </td>
                    <td class="bg-athens py-3 pr-15px pl-4" />
                  </tr>
                  <tr
                    v-for="vac in rec.vacancies"
                    :key="'vac-' + rec.recruiter_id + '-' + vac.vacancy_id"
                    class="border-b border-athens last:border-0"
                  >
                    <td class="py-3 pl-15px pr-4 align-top">
                      <div class="font-medium text-space">{{ vac.title }}</div>
                      <div
                        v-if="vacancyIsOnPause(vac.status)"
                        class="mt-0.5 text-xs font-medium text-amber-600"
                      >
                        На паузе
                      </div>
                    </td>
                    <td class="py-3 pr-4 text-right tabular-nums text-space">
                      {{ vac.candidates_added_count }}
                    </td>
                    <td class="py-3 pr-4 text-right align-top tabular-nums">
                      <div class="text-space">
                        {{ vac.hired_count }} из {{ vac.hired_target }}
                      </div>
                      <div class="mt-0.5 text-xs text-slate-custom">
                        {{ hiredProgressPercent(vac) ?? '—' }}
                      </div>
                    </td>
                    <td class="py-3 pr-4 text-right align-top tabular-nums">
                      <div class="text-space">
                        {{ vac.rejections_count }}
                      </div>
                      <div class="mt-0.5 text-xs text-slate-custom">
                        {{ rejectionsRatePercent(vac) ?? '—' }}
                      </div>
                    </td>
                    <td class="bg-athens py-3 pr-15px pl-4 text-right align-top tabular-nums text-space">
                      <span class="inline-block min-w-[3.5rem] text-right">{{
                        formatAvgDaysDays(vac.avg_days_to_hire)
                      }}</span>
                      <span class="mx-2 text-slate-custom">/</span>
                      <span class="inline-block min-w-[3.5rem] text-right">{{
                        formatAvgDaysDays(vac.avg_days_to_close)
                      }}</span>
                    </td>
                  </tr>
                </template>
                <tr v-if="!recruitersReportHasRows">
                  <td colspan="5" class="py-6 text-center text-slate-custom">
                    В ответе нет строк по вакансиям — проверьте фильтры или настройку эндпоинта.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
      </div>
    </template>

    <template v-else-if="metric === 'Возможные источники'">
      <template v-if="!selectedVacancy">
        <div class="rounded-fifteen bg-white p-25px shadow-sm">
          <p class="py-8 text-center text-slate-custom">Выберите вакансию — данные подтягиваются из списка кандидатов по выбранной вакансии и периоду.</p>
        </div>
      </template>
      <template v-else-if="candidatesLoading">
        <div class="rounded-fifteen bg-white p-25px shadow-sm">
          <p class="py-8 text-center text-slate-custom">Загрузка кандидатов…</p>
        </div>
      </template>
      <template v-else>
        <div
          class="mb-[46px] flex flex-wrap items-center justify-between gap-[35px] rounded-fifteen bg-white px-6 py-6 shadow-sm sm:px-[50px]"
        >
          <div
            v-for="(item, index) in possibleSourcesRadialCharts"
            :key="'ps-' + possibleSourcesRadialAnimKey + '-' + index"
            class="possible-sources-donut relative flex h-[200px] w-[200px] flex-shrink-0 flex-col items-center justify-center"
            :style="{ animationDelay: `${index * 70}ms` }"
          >
            <div
              class="absolute inset-0 rounded-full bg-athens"
              aria-hidden="true"
            />
            <div
              class="possible-sources-donut-ring absolute inset-0 rounded-full"
              :style="{
                background: item.gradient,
                animationDelay: `${index * 70}ms`,
              }"
              aria-hidden="true"
            />
            <div class="absolute flex h-32 w-32 items-center justify-center rounded-full bg-white" />
            <div class="relative z-10 max-w-[140px] text-center">
              <span class="block text-xl font-bold text-space">{{ item.value }}</span>
              <span class="mt-1 block text-xs font-normal leading-tight text-slate-custom">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <div class="overflow-hidden rounded-fifteen bg-athens shadow-sm">
          <p class="border-b border-athens bg-white px-15px py-3 text-xs text-bali">
            Кольца «отклики», «воронка» и «отказы» — доли по платформам (цвета совпадают с таблицей). «Просмотры» в CRM по площадкам не разбиваются; кольцо нейтральное. Список кандидатов подгружается постранично. Без поля источника — «{{ PLATFORM_SOURCE_LABEL }}». Движение по воронке — не на первом этапе; отказы — этап «{{ REJECTION_STAGE_NAME }}».
          </p>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr class="bg-catskill">
                  <th class="py-3 pl-15px pr-25px font-medium text-space">
                    {{ tableColumns[0].label }}
                  </th>
                  <th
                    v-for="col in tableColumns.slice(1)"
                    :key="col.key"
                    class="cursor-pointer py-3 pl-15px pr-25px font-medium text-space hover:text-dodger"
                    :class="{ 'border-b-2 border-dodger text-dodger': activeSortColumn === col.key }"
                    @click="activeSortColumn = col.key"
                  >
                    <span class="inline-flex items-center gap-1">
                      {{ col.label }}
                      <svg-icon name="dropdown-arrow" width="16" height="16" class="rotate-90 text-slate-custom" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white">
                <tr v-if="sortedPossibleSourcesRows.length === 0">
                  <td colspan="5" class="py-8 text-center text-slate-custom">
                    Нет кандидатов за выбранные фильтры.
                  </td>
                </tr>
                <tr
                  v-for="(row, idx) in sortedPossibleSourcesRows"
                  :key="row.source + '-' + idx"
                  class="border-b border-athens last:border-0"
                >
                  <td class="py-3 pl-15px pr-25px">
                    <span class="inline-flex items-center gap-2">
                      <span
                        v-if="row.sourceIcon"
                        class="h-3 w-3 flex-shrink-0 rounded-full"
                        :style="{ backgroundColor: row.colorDot }"
                      />
                      {{ row.source }}
                    </span>
                  </td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.views }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.responses }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.funnel }}</td>
                  <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.rejections }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </template>
    </template>

    <template v-else>
      <!-- Остальные отчёты: блок донатов + таблица (Figma Default: gap 35px в ряду, 200×200, до таблицы 46px) -->
      <div
        class="mb-[46px] flex flex-wrap items-center justify-between gap-[35px] rounded-fifteen bg-white px-6 py-6 shadow-sm sm:px-[50px]"
      >
        <div
          v-for="(item, index) in fallbackChartData"
          :key="index"
          class="relative flex h-[200px] w-[200px] flex-shrink-0 flex-col items-center justify-center"
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
          <div class="absolute flex h-32 w-32 items-center justify-center rounded-full bg-white" />
          <div class="relative z-10 max-w-[140px] text-center">
            <span class="block text-xl font-bold text-space">{{ item.value }}</span>
            <span class="mt-1 block text-xs font-normal leading-tight text-slate-custom">{{ item.label }}</span>
          </div>
        </div>
      </div>

      <div class="overflow-hidden rounded-fifteen bg-athens shadow-sm">
        <div class="overflow-x-auto">
          <table class="w-full min-w-[600px] text-left text-sm">
            <thead>
              <tr class="bg-catskill">
                <th class="py-3 pl-15px pr-25px font-medium text-space">
                  {{ tableColumns[0].label }}
                </th>
                <th
                  v-for="col in tableColumns.slice(1)"
                  :key="col.key"
                  class="cursor-pointer py-3 pl-15px pr-25px font-medium text-space hover:text-dodger"
                  :class="{ 'border-b-2 border-dodger text-dodger': activeSortColumn === col.key }"
                  @click="activeSortColumn = col.key"
                >
                  <span class="inline-flex items-center gap-1">
                    {{ col.label }}
                    <svg-icon name="dropdown-arrow" width="16" height="16" class="rotate-90 text-slate-custom" />
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white">
              <tr
                v-for="(row, idx) in fallbackTableData"
                :key="idx"
                class="border-b border-athens last:border-0"
              >
                <td class="py-3 pl-15px pr-25px">
                  <span class="inline-flex items-center gap-2">
                    <span
                      v-if="row.sourceIcon"
                      class="h-3 w-3 flex-shrink-0 rounded-full bg-amber-400"
                    />
                    {{ row.source }}
                  </span>
                </td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.views }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.responses }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.funnel }}</td>
                <td class="py-3 pl-15px pr-25px text-slate-custom">{{ row.rejections }}</td>
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

@keyframes possible-sources-donut-in {
  from {
    transform: scale(0.88);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.possible-sources-donut {
  animation: possible-sources-donut-in 0.6s cubic-bezier(0.33, 1, 0.68, 1) both;
}

@keyframes possible-sources-ring-spin {
  from {
    transform: rotate(-90deg);
  }
  to {
    transform: rotate(270deg);
  }
}

@property --ps-reveal {
  syntax: '<percentage>';
  inherits: false;
  initial-value: 0%;
}

@keyframes possible-sources-ring-reveal {
  from {
    --ps-reveal: 0%;
  }
  to {
    --ps-reveal: 100%;
  }
}

.possible-sources-donut-ring {
  /* Заполнение по кругу: маска раскрывает conic-gradient. */
  -webkit-mask-image: conic-gradient(from -90deg, #000 0% var(--ps-reveal), transparent var(--ps-reveal) 100%);
  mask-image: conic-gradient(from -90deg, #000 0% var(--ps-reveal), transparent var(--ps-reveal) 100%);
  animation: possible-sources-ring-reveal 0.95s cubic-bezier(0.33, 1, 0.68, 1) both;
  will-change: -webkit-mask-image, mask-image;
}

@media (prefers-reduced-motion: reduce) {
  .possible-sources-donut {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .possible-sources-donut-ring {
    animation: none;
    transform: none;
    -webkit-mask-image: none;
    mask-image: none;
  }
}
</style>
