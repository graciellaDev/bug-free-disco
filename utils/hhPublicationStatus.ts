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

/** Бейдж статуса в таблице импорта — те же нейтральные стили, что у полей формы (athens / athens-gray). */
export function hhPublicationStatusBadgeClass(status: string | null | undefined): string {
  const base =
    'inline-flex items-center border px-2 py-1 rounded-ten text-xs font-medium bg-athens-gray border-athens';
  if (status === 'published' || status === 'active') {
    return `${base} text-space`;
  }
  if (status === 'archived') {
    return `${base} text-slate-custom`;
  }
  return `${base} text-slate-custom`;
}
