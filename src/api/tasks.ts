import { apiGet, apiPost } from './client';
import type { Task, TasksResponse, TaskFilter, TaskSort, TaskSearchFilters } from '~/types/tasks';

export async function getTasks(
  page = 1,
  filter?: TaskFilter,
  sort?: TaskSort,
  search?: TaskSearchFilters
): Promise<{
  tasks: Task[];
  pagination: { total: number; current_page: number; last_page: number; per_page: number };
  counts: Partial<Record<TaskFilter, number>>;
}> {
  try {
    const query: Record<string, any> = { page };
    if (filter && filter !== 'all') query.filter = filter;

    if (sort) {
      switch (sort) {
        case 'oldest':
          query.sort_by = 'occurred_at';
          query.sort_dir = 'asc';
          break;
        case 'has_comments':
          query['filters[has_comments]'] = '1';
          break;
        case 'newest':
        default:
          query.sort_by = 'occurred_at';
          query.sort_dir = 'desc';
          break;
      }
    }

    const assignee = search?.assignee?.trim();
    if (assignee) query['filters[assignee]'] = assignee;
    if (search?.candidate_id != null && Number.isFinite(search.candidate_id) && search.candidate_id > 0) {
      query['filters[candidate_id]'] = search.candidate_id;
    }
    if (search?.vacancy_id != null && Number.isFinite(search.vacancy_id) && search.vacancy_id > 0) {
      query['filters[vacancy_id]'] = search.vacancy_id;
    }

    const response = await apiGet<TasksResponse>('/tasks', query);
    const data = response.data;

    return {
      tasks: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? (data as unknown as Task[]) : [],
      pagination: {
        total: data?.total ?? 0,
        current_page: data?.current_page ?? 1,
        last_page: data?.last_page ?? 1,
        per_page: data?.per_page ?? 20,
      },
      counts: data?.counts ?? {},
    };
  } catch (error) {
    console.error('Ошибка при получении задач:', error);
    return {
      tasks: [],
      pagination: { total: 0, current_page: 1, last_page: 1, per_page: 20 },
      counts: {},
    };
  }
}

export async function completeTask(
  candidateId: number,
  taskId: number
): Promise<void> {
  await apiPost<{ message: string; event_id: number }>(
    `/candidates/${candidateId}/tasks/${taskId}/complete`,
    {}
  );
}
