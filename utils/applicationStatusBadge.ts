/** Ключи трёх статусов заявки (по тексту из API). */
export type ApplicationStatusKey = 'review' | 'created' | 'rejected';

export function normalizeApplicationStatusKey(
  statusName: string | null | undefined
): ApplicationStatusKey | null {
  const n = String(statusName ?? '')
    .trim()
    .toLowerCase();
  if (!n) return null;
  if (n.includes('рассмотрен')) return 'review';
  if (n.includes('вакансия создан') || n.includes('создан')) return 'created';
  if (n.includes('отклон')) return 'rejected';
  return null;
}

/** Pill-бейдж статуса заявки в таблице (как в макете). */
export function applicationStatusBadgeClass(
  statusName: string | null | undefined
): string {
  const base =
    'inline-flex max-w-full items-center justify-center rounded-full px-3 py-1 text-xs font-medium leading-normal';
  const key = normalizeApplicationStatusKey(statusName);
  switch (key) {
    case 'review':
      return `${base} bg-green/15 text-green`;
    case 'created':
      return `${base} bg-picton/20 text-picton`;
    case 'rejected':
      return `${base} bg-semired text-red-custom`;
    default:
      return `${base} bg-athens-gray/80 text-slate-custom`;
  }
}
