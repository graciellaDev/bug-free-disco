import { apiGet } from './client';

/**
 * Нормализует тело ответа GET /superjob/resumes/{vacancyId} в массив записей.
 * Ожидаемый формат SuperJob: `{ objects: [ { resume: {...}, status, events, ... } ], total, more }`
 * или массив / обёртка Laravel `{ data: { objects } }`.
 */
export function unwrapReceivedResumesPayload(payload: unknown): Record<string, unknown>[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (typeof payload !== 'object') return [];
  const p = payload as Record<string, unknown>;
  if (Array.isArray(p.objects)) return p.objects as Record<string, unknown>[];
  if (Array.isArray(p.data)) return p.data as Record<string, unknown>[];
  if (Array.isArray(p.items)) return p.items as Record<string, unknown>[];
  if (Array.isArray(p.resumes)) return p.resumes as Record<string, unknown>[];
  if (p.data && typeof p.data === 'object' && !Array.isArray(p.data)) {
    const inner = p.data as Record<string, unknown>;
    if (Array.isArray(inner.objects)) return inner.objects as Record<string, unknown>[];
    if (Array.isArray(inner.items)) return inner.items as Record<string, unknown>[];
    if (Array.isArray(inner.resumes)) return inner.resumes as Record<string, unknown>[];
  }
  return [];
}

/**
 * Каждый элемент `objects[]` содержит вложенный `resume` — разворачиваем в плоский объект для маппинга.
 */
export function flattenSuperjobResumeWrappers(
  items: Record<string, unknown>[]
): Record<string, unknown>[] {
  return items.map((item) => {
    const resume = item.resume;
    if (resume && typeof resume === 'object' && resume !== null) {
      const r = resume as Record<string, unknown>;
      return {
        ...r,
        _sj_inbox_status: item.status,
        _sj_is_new: item.is_new,
        _sj_cover_letter: item.cover_letter,
      };
    }
    return item;
  });
}

/**
 * Получить откликнувшихся по вакансии на SuperJob (бэкенд: id вакансии на стороне SuperJob).
 */
export async function getReceivedResumesForVacancy(superjobVacancyId: string | number) {
  const response = await apiGet<unknown>(`/superjob/resumes/${superjobVacancyId}`);
  const rows = unwrapReceivedResumesPayload(response.data);
  return flattenSuperjobResumeWrappers(rows);
}
