import { apiGet } from './client';

export interface ActivityEvent {
  id: number;
  type: string;
  occurred_at: string;
  author_name?: string | null;
  direction?: string | null;
  channel?: string | null;
  candidate_id?: number | null;
  candidate_name?: string | null;
  candidate_position?: string | null;
  vacancy_id?: number | null;
  vacancy_name?: string | null;
  payload?: {
    content?: string;
    subject?: string;
    body_preview?: string;
    from_email?: string;
    to_email?: string;
    status?: string;
    read_at?: string;
    error_message?: string;
    assignee_name?: string;
    scheduled_at?: string;
    completed_at?: string;
    [key: string]: unknown;
  };
}

export interface ActivityEventsResponse {
  data: ActivityEvent[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

export interface ActivityFilters {
  author_search?: string | null;
  candidate_search?: string | null;
  date_from?: string | null;
  date_to?: string | null;
  event_status?: string | null;
  stage_id?: number | null;
}

export async function getActivityEvents(
  page = 1,
  filters?: ActivityFilters
): Promise<{
  events: ActivityEvent[];
  pagination: { total: number; current_page: number; last_page: number; per_page: number };
}> {
  try {
    const query: Record<string, any> = { page };

    if (filters?.author_search) query['filters[author_search]'] = filters.author_search;
    if (filters?.candidate_search) query['filters[candidate_search]'] = filters.candidate_search;
    if (filters?.date_from) query['filters[date_from]'] = filters.date_from;
    if (filters?.date_to) query['filters[date_to]'] = filters.date_to;
    if (filters?.event_status) query['filters[event_status]'] = filters.event_status;
    if (filters?.stage_id) query['filters[stage_id]'] = filters.stage_id;

    const response = await apiGet<ActivityEventsResponse>('/events', query);
    const data = response.data;

    return {
      events: Array.isArray(data?.data) ? data.data : Array.isArray(data) ? (data as unknown as ActivityEvent[]) : [],
      pagination: {
        total: data?.total ?? 0,
        current_page: data?.current_page ?? 1,
        last_page: data?.last_page ?? 1,
        per_page: data?.per_page ?? 20,
      },
    };
  } catch (error) {
    console.error('Ошибка при получении ленты активности:', error);
    return {
      events: [],
      pagination: { total: 0, current_page: 1, last_page: 1, per_page: 20 },
    };
  }
}
