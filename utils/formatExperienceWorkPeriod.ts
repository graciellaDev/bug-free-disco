import type { ExperienceEntryCandidate } from '@/types/candidates';

const MONTH_SHORT = [
  'Янв',
  'Фев',
  'Мар',
  'Апр',
  'Май',
  'Июн',
  'Июл',
  'Авг',
  'Сен',
  'Окт',
  'Ноя',
  'Дек',
] as const;

function ruYearWord(y: number): string {
  const n = Math.abs(Math.trunc(y)) % 100;
  const n1 = n % 10;
  if (n > 10 && n < 20) return 'лет';
  if (n1 > 1 && n1 < 5) return 'года';
  if (n1 === 1) return 'год';
  return 'лет';
}

/** Парсинг даты HH: YYYY-MM-DD или начало ISO-строки */
export function parseExperienceIsoDate(
  s: string | null | undefined
): Date | null {
  if (s == null || typeof s !== 'string') return null;
  const t = s.trim();
  if (!t) return null;
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(t);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = m[3] ? Number(m[3]) : 1;
    if (!Number.isFinite(y) || !Number.isFinite(mo)) return null;
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(t);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** Число полных календарных месяцев между началом месяцев включительно (янв–окт = 10 мес одного года + …). */
function inclusiveMonthSpan(start: Date, end: Date): number {
  const a = new Date(start.getFullYear(), start.getMonth(), 1);
  const b = new Date(end.getFullYear(), end.getMonth(), 1);
  if (b < a) return 0;
  return (
    (b.getFullYear() - a.getFullYear()) * 12 +
    (b.getMonth() - a.getMonth()) +
    1
  );
}

function formatDurationShort(totalMonths: number): string {
  if (totalMonths <= 0) return '—';
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(`${years} ${ruYearWord(years)}`);
  if (months > 0) parts.push(`${months} мес`);
  return parts.length ? parts.join(' ') : '—';
}

/**
 * Три строки колонки «период», как в макете:
 * «Янв 2024 -» / «Окт 2025» / «1 год 10 мес»
 */
export function formatExperienceWorkPeriod(
  exp: Pick<ExperienceEntryCandidate, 'start_date' | 'end_date' | 'dates'>
): { line1: string; line2: string; line3: string } | null {
  const start = parseExperienceIsoDate(exp.start_date);
  if (!start) return null;

  const line1 = `${MONTH_SHORT[start.getMonth()]} ${start.getFullYear()} -`;

  const endParsed = exp.end_date
    ? parseExperienceIsoDate(exp.end_date)
    : null;
  const endEffective = endParsed ?? new Date();

  let line2: string;
  if (endParsed) {
    line2 = `${MONTH_SHORT[endParsed.getMonth()]} ${endParsed.getFullYear()}`;
  } else {
    line2 = 'сейчас';
  }

  const totalMonths = inclusiveMonthSpan(start, endEffective);
  const line3 = formatDurationShort(totalMonths);

  return { line1, line2, line3 };
}
