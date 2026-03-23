import type { Candidate } from '@/types/candidates';

type SalaryFields = Pick<Candidate, 'salaryFrom' | 'salaryTo' | 'currency'>;

/** «80 000 - 100 000 ₽» или «80 000 ₽» — как в шапке карточки кандидата */
export function formatCandidateSalaryLine(c: SalaryFields | null | undefined): string {
  if (!c) return '';
  const from = c.salaryFrom;
  const to = c.salaryTo;
  const hasFrom = typeof from === 'number' && !Number.isNaN(from);
  const hasTo = typeof to === 'number' && !Number.isNaN(to);

  if (!hasFrom && !hasTo) return '';

  const format = (v: number) =>
    new Intl.NumberFormat('ru-RU', {
      maximumFractionDigits: 0,
    }).format(v);

  let main = '';
  if (hasFrom && hasTo && from !== to) {
    main = `${format(from as number)} - ${format(to as number)}`;
  } else if (hasFrom) {
    main = format(from as number);
  } else if (hasTo) {
    main = format(to as number);
  }

  if (!main) return '';

  const cur = (c.currency || 'RUR').toUpperCase();
  const suffix = cur === 'RUR' || cur === 'RUB' ? '₽' : cur;
  return `${main} ${suffix}`;
}
