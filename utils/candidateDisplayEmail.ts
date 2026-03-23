/**
 * Плейсхолдер при импорте с HH, если в резюме нет почты (jobly-back AdminJobSitesController).
 */
export function isHhImportPlaceholderEmail(email: string | null | undefined): boolean {
  const t = (email ?? '').trim();
  return /^hh-import-\d+-\d+@local\.import$/i.test(t);
}

export function hasDisplayableCandidateEmail(email: string | null | undefined): boolean {
  const t = (email ?? '').trim();
  if (!t) return false;
  return !isHhImportPlaceholderEmail(t);
}

/** Для полей ввода и отправки: не подставляем технический адрес. */
export function displayCandidateEmailOrEmpty(email: string | null | undefined): string {
  if (!hasDisplayableCandidateEmail(email)) return '';
  return (email ?? '').trim();
}
