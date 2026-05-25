/**
 * Оставляет только название города из строки вида «Республика …, Майкоп» или «Москва».
 */
export function formatCityLabel(value: string | null | undefined): string {
  const text = String(value ?? '').trim();
  if (!text) return '';

  const parts = text.split(',').map(p => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return parts[0] ?? text;
}
