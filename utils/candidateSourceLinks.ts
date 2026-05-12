import type { Candidate } from '@/types/candidates';

type CandidateExternalLinkFields = Candidate & {
  alternate_url?: string | null;
  alternateUrl?: string | null;
};

/** alternate_url (HH) и др. → поле link; учитываем оба стиля ключей из API. */
export function getCandidateProfileExternalUrl(candidate: Candidate): string {
  const c = candidate as CandidateExternalLinkFields;
  const raw = c.link ?? c.alternateUrl ?? c.alternate_url;
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Подпись пункта «Смотреть на …» в меню кандидата (как «Смотреть на hh.ru»).
 */
export function getCandidateViewOnSourceMenuLabel(
  source: string | null | undefined
): string {
  const raw = (source ?? '').trim();
  if (!raw) {
    return 'сайте источника';
  }
  const s = raw.toLowerCase();
  if (s === 'avito' || s === 'avito.ru') {
    return 'Avito';
  }
  if (s === 'hh' || s === 'hh.ru' || s === 'headhunter') {
    return 'hh.ru';
  }
  if (s === 'rabota' || s === 'rabota.ru') {
    return 'rabota.ru';
  }
  if (s === 'superjob' || s === 'superjob.ru') {
    return 'superjob.ru';
  }
  return raw;
}

/** actions.download.pdf.url → resumePath */
export function getCandidateResumePdfUrl(candidate: Candidate): string {
  const c = candidate as Candidate & { resume_path?: string | null };
  const raw = c.resumePath ?? c.resume_path;
  return typeof raw === 'string' ? raw.trim() : '';
}
