import type { CandidateChatPlatform } from '@/types/candidates';

/**
 * Определяет площадку для чата по полю «Источник» кандидата (hh.ru / SuperJob).
 */
export function getCandidateChatPlatformFromSource(
  source: string | null | undefined
): CandidateChatPlatform | null {
  const s = (source ?? '').toLowerCase().trim();
  if (!s) return null;
  if (s.includes('hh.ru') || s === 'hh' || s.includes('headhunter')) return 'hh';
  if (s.includes('superjob')) return 'superjob';
  return null;
}
