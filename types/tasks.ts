export type TaskFilter = 'all' | 'today' | 'tomorrow' | 'week' | 'overdue' | 'completed';

export interface Task {
  id: number;
  type: string;
  type_name: string;
  occurred_at: string;
  author_name?: string | null;
  candidate_id?: number | null;
  candidate_name?: string | null;
  vacancy_id?: number | null;
  vacancy_name?: string | null;
  payload?: {
    content?: string;
    assignee_name?: string;
    scheduled_at?: string;
    completed_at?: string;
    notes?: TaskNote[];
    [key: string]: unknown;
  };
}

export interface TaskNote {
  text: string;
  created_at?: string;
}

export interface TasksResponse {
  data: Task[];
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  counts?: Record<TaskFilter, number>;
}

export interface TaskFilterTab {
  key: TaskFilter;
  label: string;
}

export type TaskSort = 'newest' | 'oldest' | 'has_comments';

/** Доп. фильтры `GET /api/tasks` — см. docs/backend-task-get-tasks.md § «Дополнительные фильтры» */
export interface TaskSearchFilters {
  /** `filters[assignee]` — подстрока по `assignee_name` (LIKE) */
  assignee?: string;
  /** `filters[candidate_id]` */
  candidate_id?: number;
  /** `filters[vacancy_id]` */
  vacancy_id?: number;
}

export interface TaskSortOption {
  key: TaskSort;
  label: string;
}
