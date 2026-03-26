import { apiGet } from './client';

export type ExecutorApiRow = {
  id: number;
  name: string;
  email?: string;
  role_id?: number;
  role?: { id: number; name: string };
};

export type TeamApiRow = {
  id: number;
  name: string;
  email?: string;
  role?: { id?: number; name?: string };
};

/** GET /api/executors — рекрутеры и менеджеры (те же роли, что в настройках команды). */
export async function getExecutors(
  opts?: { signal?: AbortSignal }
): Promise<ExecutorApiRow[]> {
  const response = await apiGet<ExecutorApiRow[]>('/executors', undefined, {
    skipLoader: true,
    signal: opts?.signal,
  });
  return Array.isArray(response.data) ? response.data : [];
}

/** GET /api/team/{vacancy_id} — команда конкретной вакансии (в т.ч. владелец/исполнитель). */
export async function getVacancyTeamMembers(
  vacancyId: number,
  opts?: { signal?: AbortSignal }
): Promise<TeamApiRow[]> {
  if (!Number.isFinite(vacancyId) || vacancyId <= 0) return [];
  const response = await apiGet<TeamApiRow[]>(`/team/${vacancyId}`, undefined, {
    skipLoader: true,
    signal: opts?.signal,
  });
  return Array.isArray(response.data) ? response.data : [];
}
