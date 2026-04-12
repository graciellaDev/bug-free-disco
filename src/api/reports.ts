import { apiGet } from './client';
import type {
  RecruitersReportData,
  RecruitersReportRecruiterRow,
  RecruitersReportVacancyRow,
} from '~/types/reports';

export type RecruitersReportParams = {
  date_from?: string | null;
  date_to?: string | null;
  vacancy_id?: number | null;
  participant_ids?: number[];
  department_ids?: number[];
  cities?: string[];
};

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function numOrNull(v: unknown): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

function unwrapDataPayload(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const inner = root.data;
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as Record<string, unknown>;
  }
  return root;
}

function parseVacancyRow(item: Record<string, unknown>): RecruitersReportVacancyRow | null {
  const vacancyId = num(
    item.vacancy_id ?? item.id ?? item.vacancyId,
    NaN
  );
  if (!Number.isFinite(vacancyId)) return null;
  const title =
    str(item.title) ||
    str(item.name) ||
    str(item.vacancy_title) ||
    str(item.position_title);
  if (!title) return null;
  const status =
    str(item.status) ||
    str(item.vacancy_status) ||
    'active';
  const candidatesAdded = num(
    item.candidates_added_count ??
      item.added_count ??
      item.added_candidates ??
      item.added,
    0
  );
  const hiredCount = num(item.hired_count ?? item.hired ?? item.hires, 0);
  const hiredTarget = num(
    item.hired_target ?? item.target_hires ?? item.headcount_target ?? item.hiring_goal,
    0
  );
  const rejectionsCount = num(
    item.rejections_count ?? item.rejections ?? item.refused_count ?? item.rejection_count,
    0
  );
  let hiredPct = numOrNull(item.hired_percentage ?? item.hired_pct ?? item.hire_progress_percent);
  if (hiredPct != null && hiredPct <= 1 && hiredPct >= 0) hiredPct = Math.round(hiredPct * 100);
  let rejPct = numOrNull(
    item.rejections_percentage ?? item.rejection_rate ?? item.rejections_rate_percent
  );
  if (rejPct != null && rejPct <= 1 && rejPct >= 0) rejPct = Math.round(rejPct * 100);

  return {
    vacancy_id: vacancyId,
    title,
    status,
    candidates_added_count: Math.max(0, candidatesAdded),
    hired_count: Math.max(0, hiredCount),
    hired_target: Math.max(0, hiredTarget),
    hired_percentage: hiredPct,
    rejections_count: Math.max(0, rejectionsCount),
    rejections_percentage: rejPct,
    avg_days_to_hire: numOrNull(item.avg_days_to_hire ?? item.avg_hire_days),
    avg_days_to_close: numOrNull(item.avg_days_to_close ?? item.avg_close_days),
  };
}

function parseRecruiterRow(item: Record<string, unknown>): RecruitersReportRecruiterRow | null {
  const recruiterId = num(item.recruiter_id ?? item.id ?? item.user_id, NaN);
  if (!Number.isFinite(recruiterId)) return null;
  const name =
    str(item.name) ||
    str(item.full_name) ||
    str(item.recruiter_name);
  if (!name) return null;
  const positionTitle =
    str(item.position_title) ||
    str(item.position) ||
    str(item.role_title) ||
    null;
  const vacanciesRaw = item.vacancies ?? item.items ?? item.rows;
  const vacancies: RecruitersReportVacancyRow[] = [];
  if (Array.isArray(vacanciesRaw)) {
    for (const v of vacanciesRaw) {
      if (!v || typeof v !== 'object') continue;
      const row = parseVacancyRow(v as Record<string, unknown>);
      if (row) vacancies.push(row);
    }
  }
  let vacanciesCount = num(item.vacancies_count ?? item.total_vacancies, NaN);
  if (!Number.isFinite(vacanciesCount) || vacanciesCount < 0) {
    vacanciesCount = vacancies.length;
  }
  let targetHeadcount = num(
    item.target_headcount ??
      item.target_people_count ??
      item.total_target_people ??
      item.heads_target_sum,
    NaN
  );
  if (!Number.isFinite(targetHeadcount) || targetHeadcount < 0) {
    targetHeadcount = vacancies.reduce((s, v) => s + v.hired_target, 0);
  }
  return {
    recruiter_id: recruiterId,
    name,
    position_title: positionTitle,
    vacancies_count: vacanciesCount,
    target_headcount: Math.max(0, targetHeadcount),
    vacancies,
  };
}

export function parseRecruitersReport(raw: unknown): RecruitersReportData | null {
  if (!raw || typeof raw !== 'object') return null;
  const root = raw as Record<string, unknown>;
  const topData = root.data;
  /** Laravel: `{ "data": [ { recruiter…}, … ] }` без вложенного объекта. */
  if (Array.isArray(topData)) {
    const recruiters = topData
      .map((r) =>
        r && typeof r === 'object' ? parseRecruiterRow(r as Record<string, unknown>) : null
      )
      .filter(Boolean) as RecruitersReportRecruiterRow[];
    return { recruiters };
  }
  const payload = unwrapDataPayload(raw);
  if (!payload) return null;
  const recruitersRaw =
    (Array.isArray(payload.recruiters) && payload.recruiters) ||
    (Array.isArray(payload.rows) && payload.rows) ||
    null;
  if (!recruitersRaw) return null;
  const recruiters: RecruitersReportRecruiterRow[] = [];
  for (const r of recruitersRaw) {
    if (!r || typeof r !== 'object') continue;
    const row = parseRecruiterRow(r as Record<string, unknown>);
    if (row) recruiters.push(row);
  }
  return {
    date_from: str(payload.date_from) || undefined,
    date_to: str(payload.date_to) || undefined,
    recruiters,
  };
}

function buildRecruitersQuery(params: RecruitersReportParams): Record<string, string | number> {
  const q: Record<string, string | number> = {};
  if (params.date_from) q.date_from = params.date_from;
  if (params.date_to) q.date_to = params.date_to;
  if (params.vacancy_id != null && Number.isFinite(params.vacancy_id)) {
    q.vacancy_id = params.vacancy_id;
  }
  if (params.participant_ids?.length) {
    q.participant_ids = params.participant_ids.join(',');
  }
  if (params.department_ids?.length) {
    q.department_ids = params.department_ids.join(',');
  }
  if (params.cities?.length) {
    q.cities = params.cities.join(',');
  }
  return q;
}

/**
 * Отчёт по рекрутерам и их вакансиям.
 * GET /reports/recruiters
 */
export async function getRecruitersReport(
  params: RecruitersReportParams,
  opts?: { signal?: AbortSignal }
): Promise<RecruitersReportData | null> {
  try {
    const query = buildRecruitersQuery(params);
    const response = await apiGet<unknown>('/reports/recruiters', query, {
      signal: opts?.signal,
      skipLoader: true,
    });
    return parseRecruitersReport(response.data);
  } catch {
    return null;
  }
}
