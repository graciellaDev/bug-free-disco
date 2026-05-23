/**
 * Формат «Фамилия И.О.» из полного ФИО или имени в CRM.
 */
export function formatPersonNameInitials(
  fullName: string | null | undefined
): string {
  const raw = String(fullName ?? '').trim();
  if (!raw) return '';

  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0];

  if (parts.length === 2) {
    if (looksLikeRussianSurname(parts[1])) {
      const initial = `${parts[0].charAt(0).toUpperCase()}.`;
      return `${parts[1]} ${initial}`.trim();
    }
    if (looksLikeRussianSurname(parts[0])) {
      const initial = `${parts[1].charAt(0).toUpperCase()}.`;
      return `${parts[0]} ${initial}`.trim();
    }
    const initial = `${parts[1].charAt(0).toUpperCase()}.`;
    return `${parts[0]} ${initial}`.trim();
  }

  const surname = parts[0];
  const initials = parts
    .slice(1)
    .map(part => `${part.charAt(0).toUpperCase()}.`)
    .join('');
  return `${surname} ${initials}`.trim();
}

function looksLikeRussianSurname(word: string): boolean {
  return /(?:ов|ев|ин|ын|ий|ая|ко|енко|ук|юк|ский|цкий)$/i.test(word.trim());
}
