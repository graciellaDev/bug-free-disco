import type { Candidate } from '~/types/candidates';

/** Публичные логотипы в /public/logos */
export const CANDIDATE_SOURCE_LOGO_MAP: Record<string, string> = {
  'hh.ru': '/logos/hh.svg',
  'superjob.ru': '/logos/superjob.svg',
  'rabota.ru': '/logos/rabota.svg',
  'avito.ru': '/logos/avito.svg',
  'zarplata.ru': '/logos/zarplata.svg',
};

/** Нормализация значения source из API к ключу карты логотипов */
const SOURCE_ALIASES: Record<string, string> = {
  hh: 'hh.ru',
  'hh.ru': 'hh.ru',
  headhunter: 'hh.ru',
  superjob: 'superjob.ru',
  'superjob.ru': 'superjob.ru',
  rabota: 'rabota.ru',
  'rabota.ru': 'rabota.ru',
  avito: 'avito.ru',
  'avito.ru': 'avito.ru',
  zarplata: 'zarplata.ru',
  'zarplata.ru': 'zarplata.ru',
};

export function normalizeCandidateSourceKey(source: string | null | undefined): string {
  const s = source?.trim().toLowerCase() || '';
  if (!s) return '';
  return SOURCE_ALIASES[s] ?? s;
}

/** Путь к SVG логотипу источника или null, если неизвестный источник */
export function getCandidateSourceLogoPath(candidate: Candidate): string | null {
  const key = normalizeCandidateSourceKey(candidate.source);
  if (key && CANDIDATE_SOURCE_LOGO_MAP[key]) return CANDIDATE_SOURCE_LOGO_MAP[key];
  return null;
}
