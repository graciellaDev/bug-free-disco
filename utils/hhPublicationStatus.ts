/**
 * Нормализация статуса из объекта вакансии HH (список импорта или GET /vacancies/:id).
 */
export function normalizeHhPublicationStatusFromApi(raw: unknown): string | null {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const status = o.status;
  if (typeof status === 'string' && status.length > 0) {
    if (status === 'closed') return 'archived';
    return status;
  }
  if (status && typeof status === 'object' && !Array.isArray(status) && 'id' in status) {
    const sid = String((status as { id?: unknown }).id ?? '').toLowerCase();
    if (sid === 'closed' || sid === 'archived') return 'archived';
    if (sid === 'active' || sid === 'published' || sid === 'open') return 'published';
  }
  const arch = o.archived;
  if (arch === true || arch === 'true' || arch === 1 || arch === '1') return 'archived';

  return 'published';
}

/** Fallback: статус дочерней вакансии в нашей БД, когда GET hh.ru недоступен или вернул ошибку. */
export function normalizeHhPublicationStatusFromCrmVacancy(status: unknown): string | null {
  if (status == null) return null;
  const u = String(status).trim().toLowerCase();
  if (u === 'active') return 'published';
  if (u === 'archive' || u === 'archived' || u === 'closed') return 'archived';
  if (u === 'draft') return 'draft';
  return null;
}

/**
 * Подпись статуса публикации hh.ru — та же логика, что в попапе «Импорт публикаций».
 */
export function hhPublicationStatusLabelFromApi(status: string | null | undefined): string {
  if (status === 'published' || status === 'active') return 'Активна';
  if (status === 'archived') return 'Архивная';
  if (status === 'draft') return 'Черновик';
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
  if (status === 'draft') {
    return `${base} text-slate-custom`;
  }
  return `${base} text-slate-custom`;
}
