<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed, watch, nextTick, provide, reactive } from 'vue';
import { REPORTS_CONTEXT_KEY } from '@/composables/reports/reportsContext';
import ReportsMetricRouter from '@/components/reports/ReportsMetricRouter.vue';
import { debounce } from '@/utils/debounce';
import ListSectionPlaceholder from '~/components/custom/ListSectionPlaceholder.vue';
import MyDropdown from '~/components/custom/MyDropdown.vue';
import MultiSelect from '~/components/custom/MultiSelect.vue';
import DropdownPeriodPicker from '@/components/custom/DropdownPeriodPicker.vue';
import { getVacancies, getVacancyCities } from '~/utils/getVacancies';
import { clientsList } from '~/utils/clientsList';
import { getDepartments } from '~/utils/executorsList';
import { getVacancyById, getVacanciesByBaseVacancyId } from '@/src/api/vacancies';
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
  'Отчет по рекрутерам',
  'Отчет по отказам',
  'Среднее время на этапе',
  'Источники',
  'Поток кандидатов',
];

/** Метрики, для которых нужен полный список кандидатов (остальные — только report API). */
const METRICS_NEEDING_ALL_CANDIDATES = new Set([
  'Воронка статусов по вакансии',
  'Источники',
]);

function metricNeedsAllCandidates(m: string) {
  return METRICS_NEEDING_ALL_CANDIDATES.has(m);
}

const VACANCY_OPTIONS_PAGE_SIZE = 100;
let vacancyContextRequestId = 0;
let vacancyCandidatesRequestId = 0;
const vacancyOptionsFullyLoaded = ref(false);

const segment = ref('Сотрудники');
const metric = ref('Воронка статусов по вакансии');
const dateRange = ref<{ from: string | null; to: string | null }>({ from: null, to: null });

const vacancyOptions = ref<{ value: number; name: string }[]>([]);
const selectedVacancy = ref<number | null>(null);
const selectedRecruiterVacancies = ref<number[]>([]);
const vacancyMetaById = ref<Record<number, { opened_at: string | null; days_in_work: number | null }>>({});
const vacancyStages = ref<{ id: number; name: string; count: number }[]>([]);
const vacancyCandidates = ref<Candidate[]>([]);
const candidatesLoading = ref(false);
const selectedVacancyRaw = ref<any | null>(null);
const vacancyPlatformViewsBySourceKey = ref<Record<string, number>>({});
/** Смена ключа перезапускает анимацию радиальных блоков «Источники». */
const possibleSourcesRadialAnimKey = ref(0);

const participantOptions = ref<{ value: number; name: string; role?: string }[]>([]);
const selectedParticipants = ref<number[]>([]);
const participantsFilterLabel = computed(() =>
  metric.value === 'Отчет по рекрутерам' ? 'Рекрутеры' : 'Участники'
);

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

function mapVacancyListToOptions(items: { id: number; name?: string; title?: string }[]) {
  return items.map((v) => ({
    value: v.id,
    name: (v.name ?? v.title ?? '').trim() || `Вакансия #${v.id}`,
  }));
}

function applyVacancyListItems(items: Array<Record<string, unknown>>) {
  vacancyMetaById.value = buildVacancyMetaById(items);
  vacancyOptions.value = mapVacancyListToOptions(items as { id: number; name?: string; title?: string }[]);
}

async function ensureSelectedVacancyInOptions() {
  const id = selectedVacancy.value;
  if (id == null) return;
  if (vacancyOptions.value.some((o) => o.value === id)) return;
  const vacancy = await getVacancyById(String(id));
  if (!vacancy?.id) return;
  const name = (vacancy.name ?? vacancy.title ?? '').trim() || `Вакансия #${vacancy.id}`;
  vacancyOptions.value = [{ value: vacancy.id, name }, ...vacancyOptions.value];
}

async function loadVacancyFilterOptions(loadAll = false) {
  const query = loadAll
    ? 'per_page=all'
    : `per_page=${VACANCY_OPTIONS_PAGE_SIZE}&filters[status]=active&sort=-updated_at`;
  const list = await getVacancies(query);
  const items = Array.isArray(list) ? list : [];
  applyVacancyListItems(items as Array<Record<string, unknown>>);
  vacancyOptionsFullyLoaded.value = loadAll;
  await ensureSelectedVacancyInOptions();
  return items;
}

onMounted(async () => {
  document.addEventListener('click', handleFiltersClickOutside);
  try {
    const [items, { clients: employees }, citiesList, deptsRaw] = await Promise.all([
      loadVacancyFilterOptions(false),
      clientsList('employees'),
      getVacancyCities(),
      getDepartments(true).catch(() => null),
    ]);
    if (items.length > 0 && selectedVacancy.value === null) {
      selectedVacancy.value = pickDefaultVacancyId(items);
    }
    const users = Array.isArray(employees) ? employees : [];
    participantOptions.value = users.map((u: { id: number; name?: string; role?: string }) => ({
      value: u.id,
      name: (u.name ?? '').trim() || `Участник #${u.id}`,
      role: (u.role ?? '').trim() || undefined,
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
  debouncedLoadReportData.cancel();
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

/** Число кандидатов по вакансии из списка GET /vacancies (без отдельного запроса). */
function vacancyListItemCandidatesCount(v: Record<string, unknown>): number {
  const footer = v.footerData as { candidatesTotal?: number } | undefined;
  if (typeof footer?.candidatesTotal === 'number') {
    return footer.candidatesTotal;
  }
  if (typeof v.candidatesTotal === 'number') {
    return v.candidatesTotal;
  }
  const stages = v.stages;
  if (Array.isArray(stages)) {
    const allRow = stages.find(
      (s: { name?: string; id?: number | null }) => s?.name === 'Все' || s?.id == null
    ) as { count?: number } | undefined;
    if (typeof allRow?.count === 'number') {
      return allRow.count;
    }
  }
  return 0;
}

function pickDefaultVacancyId(items: { id: number }[]): number | null {
  if (!items.length) return null;
  const withData = items.find((v) => vacancyListItemCandidatesCount(v as Record<string, unknown>) > 0);
  return (withData ?? items[0]).id;
}

function firstString(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function firstNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function buildVacancyMetaById(items: Array<Record<string, unknown>>): Record<number, { opened_at: string | null; days_in_work: number | null }> {
  const out: Record<number, { opened_at: string | null; days_in_work: number | null }> = {};
  for (const v of items) {
    const id = Number(v.id);
    if (!Number.isFinite(id)) continue;
    out[id] = {
      opened_at: firstString(
        v.opened_at,
        v.open_date,
        v.opened_date,
        v.date_opened,
        v.started_at,
        v.start_date,
        v.date_start,
        v.created_at
      ),
      days_in_work: firstNumber(
        v.days_in_work,
        v.days_in_job,
        v.work_days,
        v.days_open
      ),
    };
  }
  return out;
}

function selectedRecruiterVacancyIds(): number[] {
  const uniq = [...new Set(selectedRecruiterVacancies.value)]
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));
  return uniq;
}

function allRecruiterVacancyIds(): number[] {
  return vacancyOptions.value
    .map((v) => Number(v.value))
    .filter((id) => Number.isFinite(id));
}

function ensureRecruiterVacanciesSelectedByDefault() {
  if (metric.value !== 'Отчет по рекрутерам') return;
  const allIds = allRecruiterVacancyIds();
  if (!allIds.length) {
    selectedRecruiterVacancies.value = [];
    return;
  }
  const allIdsSet = new Set(allIds);
  const normalized = selectedRecruiterVacancies.value
    .map((id) => Number(id))
    .filter((id) => allIdsSet.has(id));
  if (!normalized.length) {
    selectedRecruiterVacancies.value = [...allIds];
    return;
  }
  if (normalized.length !== selectedRecruiterVacancies.value.length) {
    selectedRecruiterVacancies.value = normalized;
  }
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

function applyVacancyStagesFromRaw(vacancy: { stages?: Array<{ id?: number; name: string; count?: number }> } | null) {
  const stagesRaw = vacancy?.stages;
  if (Array.isArray(stagesRaw) && stagesRaw.length > 0) {
    vacancyStages.value = stagesRaw
      .filter((s) => s.id != null)
      .map((s) => ({
        id: s.id as number,
        name: s.name,
        count: typeof s.count === 'number' ? s.count : 0,
      }));
  } else {
    vacancyStages.value = [];
  }
}

async function loadVacancyBaseContext(vacancyId: number) {
  const reqId = ++vacancyContextRequestId;
  candidatesLoading.value = true;
  try {
    const vacancy = await getVacancyById(String(vacancyId));
    if (reqId !== vacancyContextRequestId) return;
    selectedVacancyRaw.value = vacancy ?? null;
    void hydrateVacancyPlatformViews(vacancyId);
    applyVacancyStagesFromRaw(vacancy);
  } catch {
    if (reqId !== vacancyContextRequestId) return;
    selectedVacancyRaw.value = null;
    vacancyPlatformViewsBySourceKey.value = {};
    vacancyStages.value = [];
  } finally {
    if (reqId === vacancyContextRequestId && !metricNeedsAllCandidates(metric.value)) {
      candidatesLoading.value = false;
    }
  }
}

async function loadVacancyCandidatesIfNeeded() {
  if (!metricNeedsAllCandidates(metric.value)) {
    vacancyCandidates.value = [];
    return;
  }
  const vacancyId = selectedVacancy.value;
  if (!vacancyId) {
    vacancyCandidates.value = [];
    return;
  }
  const reqId = ++vacancyCandidatesRequestId;
  candidatesLoading.value = true;
  try {
    const candidateFilters = {
      vacancy_id: vacancyId,
      per_page: 'all',
      ...buildCandidateFilters(),
    };
    const allCandidates = await getCandidatesAllPages(candidateFilters);
    if (reqId !== vacancyCandidatesRequestId) return;
    vacancyCandidates.value = allCandidates as Candidate[];
    possibleSourcesRadialAnimKey.value += 1;
  } catch {
    if (reqId !== vacancyCandidatesRequestId) return;
    vacancyCandidates.value = [];
  } finally {
    if (reqId === vacancyCandidatesRequestId) candidatesLoading.value = false;
  }
}

function resetVacancyContext() {
  vacancyContextRequestId += 1;
  vacancyCandidatesRequestId += 1;
  selectedVacancyRaw.value = null;
  vacancyPlatformViewsBySourceKey.value = {};
  vacancyStages.value = [];
  vacancyCandidates.value = [];
  candidatesLoading.value = false;
}

watch(
  selectedVacancy,
  (vacancyId) => {
    if (!vacancyId) {
      resetVacancyContext();
      return;
    }
    void (async () => {
      await loadVacancyBaseContext(vacancyId);
      await loadVacancyCandidatesIfNeeded();
    })();
  },
);

watch(
  [dateRange, () => metric.value],
  () => {
    void loadVacancyCandidatesIfNeeded();
  },
  { deep: true },
);

watch(
  () => metric.value,
  async (m, prev) => {
    if (m === 'Отчет по рекрутерам' && !vacancyOptionsFullyLoaded.value) {
      try {
        const items = await loadVacancyFilterOptions(true);
        if (items.length > 0) ensureRecruiterVacanciesSelectedByDefault();
      } catch (e) {
        console.warn('Ошибка загрузки полного списка вакансий для отчёта по рекрутерам:', e);
      }
    }
    if (metricNeedsAllCandidates(m) && !metricNeedsAllCandidates(prev ?? '')) {
      void loadVacancyCandidatesIfNeeded();
    } else if (!metricNeedsAllCandidates(m) && metricNeedsAllCandidates(prev ?? '')) {
      vacancyCandidatesRequestId += 1;
      vacancyCandidates.value = [];
      candidatesLoading.value = false;
    }
  },
);

/** Заглушка для отчётов без своей логики (не «Источники»). */
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
const tableSortAsc = ref<0 | 1>(0);

function toggleTableSort(columnKey: string) {
  if (activeSortColumn.value === columnKey) {
    tableSortAsc.value = tableSortAsc.value === 1 ? 0 : 1;
  } else {
    activeSortColumn.value = columnKey;
    tableSortAsc.value = columnKey === 'source' ? 1 : 0;
  }
}

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

function viewsForSourceFromVacancy(sourceLabel: string): number {
  const key = normalizeSourceColorKey(sourceLabel);
  const alias = SOURCE_COLOR_ALIASES[key] ?? key;
  const map = vacancyPlatformViewsBySourceKey.value;
  return map[alias] ?? map[key] ?? 0;
}

let vacancyViewsAbort: AbortController | null = null;
let vacancyViewsReqId = 0;

async function hydrateVacancyPlatformViews(baseVacancyId: number | null) {
  vacancyViewsAbort?.abort();
  vacancyViewsAbort = new AbortController();
  const signal = vacancyViewsAbort.signal;
  const reqId = ++vacancyViewsReqId;

  if (!baseVacancyId) {
    vacancyPlatformViewsBySourceKey.value = {};
    return;
  }

  try {
    const list = await getVacanciesByBaseVacancyId(baseVacancyId, { signal });
    if (reqId !== vacancyViewsReqId) return;
    const out: Record<string, number> = {};
    const rows = Array.isArray(list) ? list : [];
    for (const v of rows) {
      const views = Number((v as any)?.views ?? 0);
      const n = Number.isFinite(views) ? views : 0;
      const plats: any[] = Array.isArray((v as any)?.platforms_data) ? (v as any).platforms_data : [];
      if (!plats.length) continue;
      for (const p of plats) {
        const name = String(p?.name ?? '').trim();
        if (!name) continue;
        const key = normalizeSourceColorKey(name);
        out[key] = (out[key] ?? 0) + n;
      }
    }
    vacancyPlatformViewsBySourceKey.value = out;
  } catch (e: unknown) {
    if (e && typeof e === 'object' && 'name' in e && (e as { name: string }).name === 'AbortError') return;
    if (reqId !== vacancyViewsReqId) return;
    vacancyPlatformViewsBySourceKey.value = {};
  }
}

const firstVacancyStageId = computed(() => vacancyStages.value[0]?.id ?? null);

const rejectionStageId = computed(() => {
  const byName = vacancyStages.value.find((s) => s.name === REJECTION_STAGE_NAME);
  return byName?.id ?? null;
});

/** Отчёт «Источники»: агрегация GET /candidates по полю source и этапам воронки. */
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
    const views = viewsForSourceFromVacancy(source);
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
      views,
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

  const totalViews = rows.reduce((s, r) => s + (typeof r.views === 'number' ? r.views : 0), 0);
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
      value: String(totalViews),
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
  const asc = tableSortAsc.value === 1;
  const rows = [...possibleSourcesTableRows.value];
  rows.sort((a, b) => {
    const va = a[col as keyof typeof a];
    const vb = b[col as keyof typeof b];
    if (col === 'source') {
      const res = String(a.source).localeCompare(String(b.source), 'ru');
      return asc ? res : -res;
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return asc ? va - vb : vb - va;
    }
    return 0;
  });
  return rows;
});

const sortedFallbackRows = computed(() => {
  const col = activeSortColumn.value;
  const asc = tableSortAsc.value === 1;
  const rows = [...fallbackTableData];
  rows.sort((a, b) => {
    const va = a[col as keyof typeof a];
    const vb = b[col as keyof typeof b];
    if (col === 'source') {
      const res = String(a.source).localeCompare(String(b.source), 'ru');
      return asc ? res : -res;
    }
    if (typeof va === 'number' && typeof vb === 'number') {
      return asc ? va - vb : vb - va;
    }
    return 0;
  });
  return rows;
});

/** Отчёт «Поток кандидатов» (GET /candidates/funnel-metrics) */
const funnelSort = ref<FunnelMetricsSort>('period');
const funnelAsc = ref<0 | 1>(1);
const funnelMetrics = ref<Awaited<ReturnType<typeof getCandidateFunnelMetrics>> | null>(null);
const funnelLoading = ref(false);
const funnelError = ref<string | null>(null);
/** Смена ключа перезапускает CSS-анимацию столбиков после загрузки данных. */
const funnelBarAnimKey = ref(0);
let funnelMetricsAbort: AbortController | null = null;

function ymdToUtcDate(ymd: string): Date | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

function formatYmdDot(ymd: string): string {
  return convertDateFromApi(ymd) ?? ymd;
}

function formatYmdDdMmSlash(ymd: string): string {
  const d = ymdToUtcDate(ymd);
  if (!d) return ymd;
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}`;
}

type FunnelAggRow = {
  period_label: string;
  period_from: string;
  period_to: string;
  responses: number;
  funnel_movements: number;
};

function buildTenBuckets(fromYmd: string, toYmd: string): { fromYmd: string; toYmd: string; label: string }[] {
  const from = ymdToUtcDate(fromYmd);
  const to = ymdToUtcDate(toYmd);
  if (!from || !to) return [];
  const min = Math.min(from.getTime(), to.getTime());
  const max = Math.max(from.getTime(), to.getTime());
  const spanMs = Math.max(1, max - min);

  const raw: { fromYmd: string; toYmd: string; label: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const segStart = min + (spanMs * i) / 10;
    const segEnd = i === 9 ? max : min + (spanMs * (i + 1)) / 10;
    const dFrom = new Date(segStart);
    const dTo = new Date(segEnd);
    const df = new Date(Date.UTC(dFrom.getUTCFullYear(), dFrom.getUTCMonth(), dFrom.getUTCDate()));
    const dt = new Date(Date.UTC(dTo.getUTCFullYear(), dTo.getUTCMonth(), dTo.getUTCDate()));
    const fromIso = df.toISOString().slice(0, 10);
    const toIso = dt.toISOString().slice(0, 10);
    raw.push({
      fromYmd: fromIso,
      toYmd: toIso,
      label: `${formatYmdDdMmSlash(fromIso)} - ${formatYmdDdMmSlash(toIso)}`,
    });
  }

  // Если период короткий, часть сегментов будет одинаковой — убираем повторы.
  const uniq: typeof raw = [];
  for (const b of raw) {
    const prev = uniq[uniq.length - 1];
    if (prev && prev.fromYmd === b.fromYmd && prev.toYmd === b.toYmd) continue;
    uniq.push(b);
  }
  return uniq;
}

const funnelAggRows = computed<FunnelAggRow[]>(() => {
  const fromYmd = datePickerToYmd(dateRange.value?.from);
  const toYmd = datePickerToYmd(dateRange.value?.to);
  const raw = funnelMetrics.value?.rows ?? [];
  if (!fromYmd || !toYmd) return [];
  if (!raw.length) return [];

  // Забираем дневные точки (bucket=day) и складываем по дню.
  const byDay = new Map<string, { responses: number; funnel_movements: number }>();
  for (const r of raw) {
    const day = r.period_from;
    if (!day) continue;
    const prev = byDay.get(day) ?? { responses: 0, funnel_movements: 0 };
    byDay.set(day, {
      responses: prev.responses + (r.responses ?? 0),
      funnel_movements: prev.funnel_movements + (r.funnel_movements ?? 0),
    });
  }

  const buckets = buildTenBuckets(fromYmd, toYmd);
  if (!buckets.length) return [];

  const out: FunnelAggRow[] = [];
  for (const b of buckets) {
    const start = ymdToUtcDate(b.fromYmd)!.getTime();
    const end = ymdToUtcDate(b.toYmd)!.getTime();
    let sumResp = 0;
    let sumMove = 0;
    for (const [day, v] of byDay) {
      const dt = ymdToUtcDate(day);
      if (!dt) continue;
      const t = dt.getTime();
      if (t >= start && t <= end) {
        sumResp += v.responses;
        sumMove += v.funnel_movements;
      }
    }
    out.push({
      period_label: b.label,
      period_from: b.fromYmd,
      period_to: b.toYmd,
      responses: sumResp,
      funnel_movements: sumMove,
    });
  }
  return out;
});

const funnelRows = computed(() => {
  const rows = funnelAggRows.value;
  const col = funnelSort.value;
  const asc = funnelAsc.value === 1;
  const out = [...rows];
  out.sort((a, b) => {
    if (col === 'period') {
      const res = a.period_from.localeCompare(b.period_from);
      return asc ? res : -res;
    }
    const va = a[col] ?? 0;
    const vb = b[col] ?? 0;
    return asc ? va - vb : vb - va;
  });
  return out;
});
const maxFunnelChartValue = computed(() => {
  let m = 1;
  for (const r of funnelRows.value) {
    m = Math.max(m, r.responses, r.funnel_movements);
  }
  return m;
});

function scaleDesignTicks(max: number): number[] {
  // В макете: 10 / 100 / 300 / 500 / 900 (не линейная шкала).
  // Масштабируем относительно текущего max, сохраняя форму шкалы.
  const base = [10, 100, 300, 500, 900];
  const safeMax = Math.max(1, max);
  const factor = safeMax / 900;
  const scaled = base.map((x) => Math.max(0, Math.round(x * factor)));
  // Убираем повторы и гарантируем, что последний тик == max (чтобы столбики не упирались в “потолок”).
  const uniq: number[] = [];
  for (const t of scaled) {
    const prev = uniq[uniq.length - 1];
    if (prev === t) continue;
    uniq.push(t);
  }
  if (uniq.length) uniq[uniq.length - 1] = Math.max(uniq[uniq.length - 1] ?? 0, safeMax);
  return uniq;
}

/** Подписи оси Y (как в макете). */
const funnelChartYTicks = computed(() => {
  return scaleDesignTicks(maxFunnelChartValue.value);
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
        bucket: 'day',
        // Сортировка на API фиксирована; интерактивная сортировка делается на фронте без рефетча.
        sort: 'period',
        asc: 1,
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

function loadReportData() {
  void fetchFunnelMetrics();
  void fetchStageAverageDuration();
  void fetchRejectionByStageReport();
  void fetchRecruitersReport();
}

const debouncedLoadReportData = debounce(loadReportData, 300);

function applyReportsFilters() {
  debouncedLoadReportData.cancel();
  loadReportData();
}

watch(
  [metric, selectedVacancy, selectedRecruiterVacancies, dateRange, selectedParticipants, filterCity, filterDepartment],
  () => {
    debouncedLoadReportData();
  },
  { deep: true },
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
function getStageSegments(stageId: number): { name: string; color: string; share: number; count: number }[] {
  const bySource = stageSourceBreakdown.value[stageId] ?? {};
  const total = Object.values(bySource).reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  const sources = stagesLegendSources.value;
  return sources
    .filter(s => (bySource[s.name] ?? 0) > 0)
    .map(s => ({
      name: s.name,
      color: s.color,
      share: (bySource[s.name] ?? 0) / total,
      count: bySource[s.name] ?? 0,
    }));
}

type FunnelStageSegmentTooltip = {
  visible: boolean;
  label: string;
  x: number;
  y: number;
};

const funnelStageSegmentTooltip = ref<FunnelStageSegmentTooltip>({
  visible: false,
  label: '',
  x: 0,
  y: 0,
});

function showFunnelStageSegmentTooltip(event: MouseEvent, seg: { name: string; count: number }) {
  funnelStageSegmentTooltip.value = {
    visible: true,
    label: `${seg.name}: ${seg.count}`,
    x: event.clientX,
    y: event.clientY,
  };
}

function moveFunnelStageSegmentTooltip(event: MouseEvent) {
  if (!funnelStageSegmentTooltip.value.visible) return;
  funnelStageSegmentTooltip.value.x = event.clientX;
  funnelStageSegmentTooltip.value.y = event.clientY;
}

function hideFunnelStageSegmentTooltip() {
  funnelStageSegmentTooltip.value.visible = false;
}

type RejectionReasonSegment = {
  color: string;
  share: number;
  label: string;
  count: number;
};

type RejectionReasonSegmentTooltip = {
  visible: boolean;
  label: string;
  x: number;
  y: number;
};

const rejectionReasonSegmentTooltip = ref<RejectionReasonSegmentTooltip>({
  visible: false,
  label: '',
  x: 0,
  y: 0,
});

function showRejectionReasonSegmentTooltip(event: MouseEvent, seg: RejectionReasonSegment) {
  rejectionReasonSegmentTooltip.value = {
    visible: true,
    label: `${seg.label}: ${seg.count}`,
    x: event.clientX,
    y: event.clientY,
  };
}

function moveRejectionReasonSegmentTooltip(event: MouseEvent) {
  if (!rejectionReasonSegmentTooltip.value.visible) return;
  rejectionReasonSegmentTooltip.value.x = event.clientX;
  rejectionReasonSegmentTooltip.value.y = event.clientY;
}

function hideRejectionReasonSegmentTooltip() {
  rejectionReasonSegmentTooltip.value.visible = false;
}

const REJECTION_REASON_PALETTE = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
  '#84cc16', // lime
  '#14b8a6', // teal
];

function rejectionReasonColor(label: string): string {
  const src = label.trim().toLowerCase() || 'без причины';
  let hash = 0;
  for (let i = 0; i < src.length; i++) {
    hash = ((hash << 5) - hash + src.charCodeAt(i)) | 0;
  }
  const idx = Math.abs(hash) % REJECTION_REASON_PALETTE.length;
  return REJECTION_REASON_PALETTE[idx]!;
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

function rejectionReportRowSegments(row: RejectionByStageRow): RejectionReasonSegment[] {
  const rc = row.rejections_count;
  if (rc <= 0) return [];
  if (row.reasons?.length) {
    return row.reasons
      .filter((x) => x.count > 0)
      .map((r) => ({
        label: r.label,
        count: r.count,
        color: rejectionReasonColor(r.label),
        share: r.count / rc,
      }));
  }
  return [{ label: 'Без детализации', count: rc, color: '#5898ff', share: 1 }];
}

const rejectionReasonsLegendItems = computed(() => {
  const byReason = new Map<string, { label: string; count: number; color: string }>();
  for (const row of rejectionReportDisplayRows.value) {
    for (const seg of rejectionReportRowSegments(row)) {
      const key = seg.label.trim().toLowerCase();
      const prev = byReason.get(key);
      if (prev) {
        prev.count += seg.count;
      } else {
        byReason.set(key, { label: seg.label, count: seg.count, color: seg.color });
      }
    }
  }
  return [...byReason.values()]
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
});

const rejectionReasonsLegendTotal = computed(() =>
  rejectionReasonsLegendItems.value.reduce((sum, item) => sum + item.count, 0)
);

function rejectionReasonsLegendPct(count: number): number {
  const total = rejectionReasonsLegendTotal.value;
  if (total <= 0) return 0;
  return Math.round((count / total) * 100);
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

function peopleCountWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d1 = abs % 10;
  if (abs > 10 && abs < 20) return 'человек';
  if (d1 === 1) return 'человека';
  if (d1 >= 2 && d1 <= 4) return 'человека';
  return 'человек';
}

function formatAvgDaysDays(d: number | null): string {
  if (d == null || !Number.isFinite(d)) return '—';
  const rounded = Math.round(d);
  return `${rounded} дн.`;
}

function daysWord(n: number): string {
  const abs = Math.abs(n) % 100;
  const d1 = abs % 10;
  if (abs > 10 && abs < 20) return 'дней';
  if (d1 === 1) return 'день';
  if (d1 >= 2 && d1 <= 4) return 'дня';
  return 'дней';
}

function formatOpenedAtDate(s: string | null): string {
  if (!s) return '—';
  const raw = String(s).trim();
  if (!raw) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return convertDateFromApi(raw) ?? raw;
  }
  if (/^\d{4}-\d{2}-\d{2}T/.test(raw)) {
    return convertDateFromApi(raw.slice(0, 10)) ?? raw.slice(0, 10);
  }
  return raw;
}

function formatDaysInWork(n: number | null): string {
  if (n == null || !Number.isFinite(n)) return '—';
  const rounded = Math.max(0, Math.round(n));
  return `${rounded} ${daysWord(rounded)}`;
}

function parseOpenedAtToUtcDate(s: string | null): Date | null {
  if (!s) return null;
  const raw = String(s).trim();
  if (!raw) return null;
  const ymd = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const y = Number(ymd[1]);
    const m = Number(ymd[2]);
    const d = Number(ymd[3]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  const dmy = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (dmy) {
    const d = Number(dmy[1]);
    const m = Number(dmy[2]);
    const y = Number(dmy[3]);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(Date.UTC(y, m - 1, d));
    }
  }
  return null;
}

function recruiterVacancyOpenedAt(v: RecruitersReportVacancyRow): string | null {
  if (v.opened_at) return v.opened_at;
  return vacancyMetaById.value[v.vacancy_id]?.opened_at ?? null;
}

function recruiterVacancyDaysInWork(v: RecruitersReportVacancyRow): number | null {
  if (v.days_in_work != null && Number.isFinite(v.days_in_work)) return v.days_in_work;
  const fromVacancyMeta = vacancyMetaById.value[v.vacancy_id]?.days_in_work;
  if (fromVacancyMeta != null && Number.isFinite(fromVacancyMeta)) {
    return fromVacancyMeta;
  }
  const openedAt = recruiterVacancyOpenedAt(v);
  const openedDate = parseOpenedAtToUtcDate(openedAt);
  if (!openedDate) return null;
  const now = new Date();
  const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const diffMs = todayUtc.getTime() - openedDate.getTime();
  return Math.max(0, Math.floor(diffMs / 86400000));
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
    const selectedVacancyIds = selectedRecruiterVacancyIds();
    if (selectedVacancyIds.length === 1) {
      params.vacancy_id = selectedVacancyIds[0];
    }
    if (selectedVacancyIds.length > 1) {
      params.vacancy_ids = selectedVacancyIds;
    }
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
    if (m === 'Отчет по рекрутерам') {
      ensureRecruiterVacanciesSelectedByDefault();
    }
    if (m === 'Воронка статусов по вакансии') {
      triggerFunnelBarAnimation();
    }
    if (m === 'Отчет по отказам') {
      triggerRejectionReportAnimation();
    }
  }
);

watch(
  () => vacancyOptions.value,
  () => {
    ensureRecruiterVacanciesSelectedByDefault();
  },
  { deep: true }
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

/** --- Экспорт CSV (данные как на экране) --- */

function csvEscapeCell(value: string | number | null | undefined): string {
  if (value == null) return '';
  const s = String(value);
  if (/[\r\n",]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsvContent(rows: (string | number | null | undefined)[][]): string {
  return rows.map((line) => line.map(csvEscapeCell).join(',')).join('\r\n');
}

function downloadUtf8Csv(filename: string, content: string) {
  if (!import.meta.client) return;
  const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function safeFilenamePart(raw: string): string {
  return raw
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, '_')
    .slice(0, 72);
}

function exportCsvFilename(): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `otchet_${safeFilenamePart(metric.value)}_${stamp}.csv`;
}

function selectedVacancyTitleForExport(): string {
  const id = selectedVacancy.value;
  if (id == null) return '';
  const o = vacancyOptions.value.find((v) => v.value === id);
  return (o?.name ?? '').trim() || `Вакансия #${id}`;
}

function selectedRecruiterVacancyTitlesForExport(): string {
  const ids = selectedRecruiterVacancyIds();
  if (!ids.length) return '';
  return ids
    .map((id) => {
      const o = vacancyOptions.value.find((v) => v.value === id);
      return (o?.name ?? '').trim() || `Вакансия #${id}`;
    })
    .join('; ');
}

function periodLabelForExport(): string {
  const from = dateRange.value?.from;
  const to = dateRange.value?.to;
  if (!from && !to) return '';
  return `${from ?? ''} — ${to ?? ''}`;
}

function pushExportMetaRows(out: (string | number | null | undefined)[][]) {
  out.push(['Отчёт', metric.value]);
  const recruiterVacancies = selectedRecruiterVacancyTitlesForExport();
  if (metric.value === 'Отчет по рекрутерам' && recruiterVacancies) {
    out.push(['Вакансии', recruiterVacancies]);
  } else {
    const vn = selectedVacancyTitleForExport();
    if (vn) out.push(['Вакансия', vn]);
  }
  const p = periodLabelForExport();
  if (p) out.push(['Период (фильтр)', p]);
  if (selectedParticipants.value.length) {
    const names = selectedParticipants.value
      .map((id) => participantOptions.value.find((o) => o.value === id)?.name ?? String(id))
      .join('; ');
    out.push([metric.value === 'Отчет по рекрутерам' ? 'Рекрутеры' : 'Участники', names]);
  }
  if (filterDepartment.value.length) {
    const names = filterDepartment.value
      .map((id) => departmentsFilterOptions.value.find((o) => o.value === id)?.name ?? String(id))
      .join('; ');
    out.push(['Отделы', names]);
  }
  if (filterCity.value.length) {
    out.push(['Города', filterCity.value.join('; ')]);
  }
  out.push([]);
}

function stageSourcesSummaryForExport(stageId: number): string {
  const bySource = stageSourceBreakdown.value[stageId] ?? {};
  const parts: string[] = [];
  for (const src of stagesLegendSources.value) {
    const n = bySource[src.name] ?? 0;
    if (n > 0) parts.push(`${src.name}: ${n}`);
  }
  return parts.join('; ');
}

function rejectionReasonsForExport(row: RejectionByStageRow): string {
  if (!row.reasons?.length) return '';
  return row.reasons
    .filter((r) => r.count > 0)
    .map((r) => `${r.label}: ${r.count}`)
    .join('; ');
}

function buildCsvFunnelStatus(): string {
  if (!selectedVacancy.value || vacancyStages.value.length === 0) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push(['Этап', 'Кандидатов (как на экране)', '% от всех кандидатов', 'Разбивка по источникам (кол-во)']);
  vacancyStages.value.forEach((stage, rowIndex) => {
    rows.push([
      stage.name,
      stageDisplayCounts.value[rowIndex] ?? 0,
      `${stagePercentOfTotal.value[rowIndex] ?? 0}%`,
      stageSourcesSummaryForExport(stage.id),
    ]);
  });
  rows.push([]);
  rows.push(['Источник (легенда)', 'Количество']);
  for (const s of stagesLegendSources.value) {
    rows.push([s.name, s.count]);
  }
  return rowsToCsvContent(rows);
}

function buildCsvRejections(): string {
  if (!selectedVacancy.value) return '';
  if (rejectionReportLoading.value || rejectionReportError.value) return '';
  const list = rejectionReportDisplayRows.value;
  if (!list.length) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push(['Этап', 'Кандидатов', 'Отказы', 'Процент отказов', 'Доли по причинам']);
  for (const row of list) {
    rows.push([
      row.stage_name,
      row.candidates_count,
      row.rejections_count,
      `${rejectionReportRowPct(row)}%`,
      rejectionReasonsForExport(row),
    ]);
  }
  return rowsToCsvContent(rows);
}

function buildCsvFunnelFlow(): string {
  if (!selectedVacancy.value || !dateRange.value?.from || !dateRange.value?.to) return '';
  if (funnelLoading.value || funnelError.value) return '';
  const list = funnelRows.value;
  if (!list.length) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push(['Интервалы графика', '1/10 выбранного периода (агрегация на фронте)']);
  rows.push([]);
  rows.push(['Период', 'Отклики', 'Движение по воронке']);
  for (const row of list) {
    rows.push([row.period_label, row.responses, row.funnel_movements]);
  }
  return rowsToCsvContent(rows);
}

function buildCsvStageAverage(): string {
  if (!selectedVacancy.value || !dateRange.value?.from || !dateRange.value?.to) return '';
  if (stageAvgLoading.value) return '';
  const rep = stageAvgEffective.value;
  if (!rep) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push(['Показатель', 'Значение']);
  rows.push(['Средний срок закрытия (дни)', rep.avg_close_days]);
  rows.push(['Средний срок просрочки (дни)', rep.avg_overdue_days]);
  rows.push(['Нанято кандидатов', `${rep.hired_count} из ${rep.hired_total}`]);
  rows.push(['Из закрытых позиций закрыты в срок, %', rep.closure_on_time_percent]);
  rows.push(['Позиций закрыто в срок', rep.closure_on_time]);
  rows.push(['Позиций просрочено', rep.closure_overdue]);
  rows.push([]);
  rows.push(['Этап', 'Среднее время (дни)']);
  for (const s of rep.stages) {
    rows.push([s.stage_name, s.avg_days]);
  }
  return rowsToCsvContent(rows);
}

function buildCsvRecruiters(): string {
  if (recruitersReportLoading.value || recruitersReportError.value) return '';
  const recs = recruitersReportData.value?.recruiters ?? [];
  if (!recs.length) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push([
    'Тип строки',
    'Рекрутер',
    'Должность',
    'Сводка (вакансии / чел.)',
    'Вакансия',
    'На паузе',
    'Добавленные кандидаты',
    'Нанято',
    'Цель найма',
    'Прогресс найма',
    'Отказы',
    '% отказов от добавленных',
    'Срок найма',
    'Планируемый срок закрытия',
    'Дата открытия',
    'Дней в работе',
  ]);
  for (const rec of recs) {
    const summary = `${rec.vacancies_count} ${vacanciesCountWord(rec.vacancies_count)}: нужно нанять ${rec.target_headcount} ${peopleCountWord(rec.target_headcount)}`;
    rows.push(['Рекрутер', rec.name, rec.position_title ?? '', summary, '', '', '', '', '', '', '', '', '', '']);
    for (const vac of rec.vacancies) {
      rows.push([
        'Вакансия',
        rec.name,
        rec.position_title ?? '',
        summary,
        vac.title,
        vacancyIsOnPause(vac.status) ? 'Да' : '',
        vac.candidates_added_count,
        vac.hired_count,
        vac.hired_target,
        hiredProgressPercent(vac) ?? '—',
        vac.rejections_count,
        rejectionsRatePercent(vac) ?? '—',
        formatAvgDaysDays(vac.avg_days_to_hire),
        formatAvgDaysDays(vac.planned_close_days ?? vac.avg_days_to_close),
        formatOpenedAtDate(recruiterVacancyOpenedAt(vac)),
        formatDaysInWork(recruiterVacancyDaysInWork(vac)),
      ]);
    }
  }
  return rowsToCsvContent(rows);
}

function buildCsvPossibleSources(): string {
  if (!selectedVacancy.value) return '';
  if (candidatesLoading.value) return '';
  const list = sortedPossibleSourcesRows.value;
  if (!list.length) return '';
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  rows.push(['Источник', 'Просмотры', 'Отклики', 'Движение по воронке', 'Отказы']);
  for (const r of list) {
    rows.push([r.source, r.views, r.responses, r.funnel, r.rejections]);
  }
  return rowsToCsvContent(rows);
}

function buildCsvFallback(): string {
  const rows: (string | number | null | undefined)[][] = [];
  pushExportMetaRows(rows);
  for (const item of fallbackChartData) {
    rows.push([item.label, item.value]);
  }
  rows.push([]);
  rows.push(tableColumns.map((c) => c.label));
  for (const r of fallbackTableData) {
    rows.push([r.source, r.views, r.responses, r.funnel, r.rejections]);
  }
  return rowsToCsvContent(rows);
}

function buildCurrentReportCsv(): string {
  switch (metric.value) {
    case 'Воронка статусов по вакансии':
      return buildCsvFunnelStatus();
    case 'Отчет по отказам':
      return buildCsvRejections();
    case 'Поток кандидатов':
      return buildCsvFunnelFlow();
    case 'Среднее время на этапе':
      return buildCsvStageAverage();
    case 'Отчет по рекрутерам':
      return buildCsvRecruiters();
    case 'Источники':
      return buildCsvPossibleSources();
    default:
      return buildCsvFallback();
  }
}

function exportReportsCsv() {
  const body = buildCurrentReportCsv();
  if (!body.trim()) {
    window.alert('Нет данных для экспорта по текущему отчёту и фильтрам.');
    return;
  }
  downloadUtf8Csv(exportCsvFilename(), body);
}


import { provide, reactive } from 'vue';
import { REPORTS_CONTEXT_KEY } from '@/composables/reports/reportsContext';

provide(
  REPORTS_CONTEXT_KEY,
  reactive({
  CLOSED_STAGE_NAMES,
  METRICS_NEEDING_ALL_CANDIDATES,
  PLATFORM_SOURCE_LABEL,
  REJECTION_REASON_PALETTE,
  REJECTION_STAGE_NAME,
  STAGE_AVG_DEMO,
  VACANCY_OPTIONS_PAGE_SIZE,
  activeSortColumn,
  allRecruiterVacancyIds,
  applyReportsFilters,
  applyVacancyListItems,
  applyVacancyStagesFromRaw,
  barStyle,
  buildCandidateFilters,
  buildCsvFallback,
  buildCsvFunnelFlow,
  buildCsvFunnelStatus,
  buildCsvPossibleSources,
  buildCsvRecruiters,
  buildCsvRejections,
  buildCsvStageAverage,
  buildCurrentReportCsv,
  buildStageAvgFallback,
  buildTenBuckets,
  buildVacancyMetaById,
  candidateStageId,
  candidatesLoading,
  citiesFilterOptions,
  colorForSourceLabel,
  conicGradientFromPlatformSegments,
  csvEscapeCell,
  datePickerToYmd,
  dateRange,
  daysWord,
  debouncedLoadReportData,
  departmentsFilterOptions,
  downloadUtf8Csv,
  enrichRejectionReportStageIds,
  ensureRecruiterVacanciesSelectedByDefault,
  ensureSelectedVacancyInOptions,
  exportCsvFilename,
  exportReportsCsv,
  fallbackChartData,
  fallbackTableData,
  fetchFunnelMetrics,
  fetchRecruitersReport,
  fetchRejectionByStageReport,
  fetchStageAverageDuration,
  filterCity,
  filterDepartment,
  filtersPanelRef,
  firstNumber,
  firstString,
  firstVacancyStageId,
  formatAvgDaysDays,
  formatDaysInWork,
  formatOpenedAtDate,
  formatYmdDdMmSlash,
  formatYmdDot,
  funnelAggRows,
  funnelAsc,
  funnelBarAnimKey,
  funnelBarHeightPct,
  funnelBarTotals,
  funnelBarsAnimActive,
  funnelButtonRef,
  funnelChartYTicks,
  funnelError,
  funnelLoading,
  funnelMetrics,
  funnelRows,
  funnelSort,
  funnelStageSegmentTooltip,
  funnelToggleActive,
  getStageSegments,
  handleFiltersClickOutside,
  hashSourceToHslColor,
  hideFunnelStageSegmentTooltip,
  hideRejectionReasonSegmentTooltip,
  hiredProgressPercent,
  hydrateVacancyPlatformViews,
  isActiveFunnel,
  isHoveredFunnel,
  loadReportData,
  loadVacancyBaseContext,
  loadVacancyCandidatesIfNeeded,
  loadVacancyFilterOptions,
  mapVacancyListToOptions,
  maxFunnelChartValue,
  maxFunnelTotal,
  maxPassedThrough,
  metric,
  metricNeedsAllCandidates,
  metricOptions,
  moveFunnelStageSegmentTooltip,
  moveRejectionReasonSegmentTooltip,
  normalizeDotDateForApi,
  normalizeSourceColorKey,
  parseOpenedAtToUtcDate,
  participantOptions,
  participantsFilterLabel,
  peopleCountWord,
  periodLabelForExport,
  pickDefaultVacancyId,
  possibleSourcesRadialAnimKey,
  possibleSourcesRadialCharts,
  possibleSourcesTableRows,
  pushExportMetaRows,
  recruiterVacancyDaysInWork,
  recruiterVacancyOpenedAt,
  recruitersReportData,
  recruitersReportError,
  recruitersReportHasRows,
  recruitersReportLoading,
  rejectionReasonColor,
  rejectionReasonSegmentTooltip,
  rejectionReasonsForExport,
  rejectionReasonsLegendItems,
  rejectionReasonsLegendPct,
  rejectionReasonsLegendTotal,
  rejectionReportAnimActive,
  rejectionReportBarTrackStyle,
  rejectionReportData,
  rejectionReportDisplayRows,
  rejectionReportError,
  rejectionReportLoading,
  rejectionReportMaxRejections,
  rejectionReportRowPct,
  rejectionReportRowSegments,
  rejectionReportTrackWidthPct,
  rejectionStageId,
  rejectionsRatePercent,
  resetVacancyContext,
  rowsToCsvContent,
  safeFilenamePart,
  scaleDesignTicks,
  segment,
  segmentOptions,
  selectedParticipants,
  selectedRecruiterVacancies,
  selectedRecruiterVacancyIds,
  selectedRecruiterVacancyTitlesForExport,
  selectedVacancy,
  selectedVacancyRaw,
  selectedVacancyTitleForExport,
  showFunnelStageSegmentTooltip,
  showRejectionReasonSegmentTooltip,
  sortRejectionReportRows,
  sortedFallbackRows,
  sortedPossibleSourcesRows,
  stageAvgBarAnimKey,
  stageAvgBarMax,
  stageAvgBarWidthPct,
  stageAvgEffective,
  stageAvgLoading,
  stageAvgReport,
  stageDisplayCounts,
  stageNameById,
  stagePassedThroughCounts,
  stagePercentOfTotal,
  stageSourceBreakdown,
  stageSourcesSummaryForExport,
  stagesLegendSources,
  stagesLegendTotal,
  tableColumns,
  tableSortAsc,
  toggleFunnelSort,
  toggleTableSort,
  triggerFunnelBarAnimation,
  triggerRejectionReportAnimation,
  vacanciesCountWord,
  vacancyCandidates,
  vacancyIsOnPause,
  vacancyListItemCandidatesCount,
  vacancyMetaById,
  vacancyOptions,
  vacancyOptionsFullyLoaded,
  vacancyPlatformViewsBySourceKey,
  vacancyStages,
  viewsForSourceFromVacancy,
  ymdToUtcDate,
  }),
);
</script>

<template>
  <div class="container pb-28px pt-35px">
    <!-- Карточка фильтров: макет Figma — белая карточка 15px, отступы 25px -->
    <div class="relative z-10 mb-15px rounded-fifteen bg-white p-25px shadow-sm">
      <div class="mb-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
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
        <div class="w-fit max-w-full shrink-0">
          <label class="mb-2 block text-sm font-medium text-space">Отчет</label>
          <MyDropdown
            v-model="metric"
            :options="metricOptions"
            placeholder="Выберите отчет"
            trigger-variant="semiaction"
            fit-content
          />
        </div>
        <div class="flex shrink-0 sm:ml-4">
          <UiButton
            variant="semiaction"
            size="semiaction"
            class="w-full bg-space text-white hover:bg-space/90 sm:w-auto"
            type="button"
            @click="exportReportsCsv"
          >
            Экспорт CSV
          </UiButton>
        </div>
      </div>

      <div class="my-5 border-b border-athens" role="separator" aria-hidden="true" />

      <!-- Поля и кнопки: Вакансия, период, Участники, кнопка фильтров, Применить -->
      <div class="flex flex-wrap items-end gap-4">
        <div class="min-w-0 flex-1 basis-40">
          <label class="mb-2 block text-sm font-medium text-space">Вакансия</label>
          <template v-if="metric === 'Отчет по рекрутерам'">
            <MultiSelect
              v-model="selectedRecruiterVacancies"
              :options="vacancyOptions"
              default-value="Выберите вакансии"
              searchable
              search-placeholder="Поиск вакансий"
              show-select-all
              select-all-label="Выбрать все вакансии"
              class="w-full"
            />
          </template>
          <MyDropdown
            v-else
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
          <label class="mb-2 block text-sm font-medium text-space">
            {{ metric === 'Воронка статусов по вакансии' ? 'Период' : 'Кандидаты за период' }}
          </label>
          <DropdownPeriodPicker
            v-model="dateRange"
            class="w-full"
          />
        </div>
        <div class="min-w-0 flex-1 basis-40">
          <label class="mb-2 block text-sm font-medium text-space">{{ participantsFilterLabel }}</label>
          <MultiSelect
            v-model="selectedParticipants"
            :options="participantOptions"
            :default-value="participantsFilterLabel"
            searchable
            :search-placeholder="metric === 'Отчет по рекрутерам' ? 'Поиск рекрутеров' : 'Поиск участников'"
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

    <ReportsMetricRouter />

    <div
      v-if="funnelStageSegmentTooltip.visible"
      class="pointer-events-none fixed z-[220] rounded-ten border border-space/15 bg-space px-2.5 py-1 text-xs font-medium leading-none text-white shadow-xl"
      :style="{
        left: `${funnelStageSegmentTooltip.x}px`,
        top: `${funnelStageSegmentTooltip.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }"
    >
      {{ funnelStageSegmentTooltip.label }}
    </div>
    <div
      v-if="rejectionReasonSegmentTooltip.visible"
      class="pointer-events-none fixed z-[220] rounded-ten border border-space/15 bg-space px-2.5 py-1 text-xs font-medium leading-none text-white shadow-xl"
      :style="{
        left: `${rejectionReasonSegmentTooltip.x}px`,
        top: `${rejectionReasonSegmentTooltip.y - 10}px`,
        transform: 'translate(-50%, -100%)',
      }"
    >
      {{ rejectionReasonSegmentTooltip.label }}
    </div>
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
  transition: height 220ms cubic-bezier(0.33, 1, 0.68, 1);
}

@media (prefers-reduced-motion: reduce) {
  .funnel-bar-fill {
    animation: none;
    transform: none;
    transition: none;
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

/* Плавная перестановка элементов при сортировке (FLIP). */
.reorder-move {
  transition: transform 260ms cubic-bezier(0.33, 1, 0.68, 1);
}

.reorder-enter-active,
.reorder-leave-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.reorder-enter-from,
.reorder-leave-to {
  opacity: 0;
  transform: translateY(4px);
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
