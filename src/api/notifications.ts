import { apiGet } from './client'

export type NotificationAction = {
  key: string
  label: string
  href?: string | null
  variant?: 'primary' | 'success' | 'danger' | 'link'
}

export type NotificationCandidate = {
  id?: number
  firstname?: string | null
  surname?: string | null
  patronymic?: string | null
  quickInfo?: string | null
  imagePath?: string | null
}

export type NotificationVacancy = {
  id?: number
  name?: string | null
}

export type NotificationPayload = {
  content?: string | null
  title?: string | null
  [key: string]: unknown
}

/** Элемент списка из GET /notifications (как в ответе бэкенда). */
export type NotificationApiItem = {
  id: number | string
  candidate_id?: number | null
  vacancy_id?: number | null
  type?: string | null
  occurred_at?: string | null
  author_name?: string | null
  direction?: string | null
  channel?: string | null
  payload?: NotificationPayload | null
  vacancy?: NotificationVacancy | null
  candidate?: NotificationCandidate | null
  is_important?: boolean | null
  actions?: NotificationAction[] | null
  primary_action?: NotificationAction | null
}

export type NotificationsMeta = {
  current_page?: number
  last_page?: number
  per_page?: number
  total?: number
}

export type NotificationsListPayload = {
  items: NotificationApiItem[]
  meta?: NotificationsMeta
}

export type NotificationsResponseData = NotificationsListPayload | NotificationApiItem[]

export async function getNotifications(
  query?: Record<string, any>,
  opts?: { signal?: AbortSignal }
) {
  return await apiGet<NotificationsResponseData>('/notifications', query, {
    skipLoader: true,
    signal: opts?.signal,
  })
}
