/**
 * Нормализация статуса из объекта вакансии HH (список импорта или GET /vacancies/:id).
 */
export function normalizeHhPublicationStatusFromApi(raw: unknown): string | null {
  if (raw == null || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const status = o.status;
  if (typeof status === 'string' && status.length > 0) {
    if (status === 'closed') return 'archived';
    return status;
  }
  if (o.archived === true) return 'archived';
  return 'published';
}

/**
 * Подпись статуса публикации hh.ru — та же логика, что в попапе «Импорт публикаций».
 */
export function hhPublicationStatusLabelFromApi(status: string | null | undefined): string {
  if (status === 'published' || status === 'active') return 'Активна';
  if (status === 'archived') return 'Архивная';
  if (!status) return 'Неизвестно';
  return String(status);
}

/** Классы бейджа в таблице импорта (согласованы с PublishTab). */
export function hhPublicationStatusBadgeClass(status: string | null | undefined): Record<string, boolean> {
  return {
    'bg-green-100 text-green-600': status === 'published' || status === 'active',
    'bg-orange-100 text-orange-600': status === 'archived',
    'bg-gray-100 text-slate-custom':
      !status || (status !== 'published' && status !== 'active' && status !== 'archived'),
  };
}
