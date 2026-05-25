/** Нормализация статуса вакансии Avito (Job API / Core items). */
export function normalizeAvitoPublicationStatusFromApi(raw: unknown): string | null {
  if (raw == null) return null
  const u = String(raw).trim().toLowerCase()
  if (!u) return null
  if (['archived', 'archive', 'closed', 'stopped', 'inactive', 'removed'].includes(u)) {
    return 'archived'
  }
  if (['draft', 'moderation', 'pending', 'new'].includes(u)) {
    return 'draft'
  }
  if (['published', 'active', 'opened', 'public'].includes(u)) {
    return 'published'
  }
  return u
}

export function normalizeAvitoPublicationStatusFromCrmVacancy(status: unknown): string | null {
  if (status == null) return null
  const u = String(status).trim().toLowerCase()
  if (u === 'active') return 'published'
  if (u === 'archive' || u === 'archived' || u === 'closed') return 'archived'
  if (u === 'draft') return 'draft'
  return null
}

export function avitoPublicationStatusLabelFromApi(status: string | null | undefined): string {
  if (status === 'published' || status === 'active') return 'Активна'
  if (status === 'archived') return 'Архивная'
  if (status === 'draft') return 'Черновик'
  if (!status) return '—'
  return String(status)
}
