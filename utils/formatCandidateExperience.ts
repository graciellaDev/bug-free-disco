function ruPlural(n: number, one: string, few: string, many: string): string {
  const nAbs = Math.abs(Math.trunc(n)) % 100;
  const n1 = nAbs % 10;
  if (nAbs > 10 && nAbs < 20) return many;
  if (n1 > 1 && n1 < 5) return few;
  if (n1 === 1) return one;
  return many;
}

/** Полный стаж в месяцах → «2 года 11 месяцев» */
export function formatExperienceFromTotalMonths(totalMonths: number): string {
  if (!Number.isFinite(totalMonths) || totalMonths <= 0) return '';
  const years = Math.floor(totalMonths / 12);
  const m = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) {
    parts.push(`${years} ${ruPlural(years, 'год', 'года', 'лет')}`);
  }
  if (m > 0) {
    parts.push(`${m} ${ruPlural(m, 'месяц', 'месяца', 'месяцев')}`);
  }
  return parts.join(' ');
}

/**
 * Для UI: если в БД строка вида «35 мес.» (импорт HH) — показываем годы/месяцы.
 * Иначе возвращаем исходную строку (ручной ввод).
 */
export function formatCandidateExperienceForDisplay(
  raw: string | null | undefined
): string {
  if (raw == null) return '';
  const s = String(raw).trim();
  if (s === '') return '';
  const m =
    /^(\d+)\s*мес\.?$/i.exec(s) ?? /^(\d+)мес\.?$/i.exec(s);
  if (m) {
    const months = parseInt(m[1], 10);
    if (!Number.isNaN(months)) {
      const formatted = formatExperienceFromTotalMonths(months);
      return formatted !== '' ? formatted : s;
    }
  }
  return s;
}
