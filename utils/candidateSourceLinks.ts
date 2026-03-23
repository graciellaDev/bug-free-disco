import type { Candidate } from '@/types/candidates';

/** alternate_url с HH → поле link (camelCase в API Laravel) */
export function getCandidateProfileExternalUrl(candidate: Candidate): string {
  const c = candidate as Candidate & { alternate_url?: string | null };
  const raw = c.link ?? c.alternate_url;
  return typeof raw === 'string' ? raw.trim() : '';
}

/** actions.download.pdf.url → resumePath */
export function getCandidateResumePdfUrl(candidate: Candidate): string {
  const c = candidate as Candidate & { resume_path?: string | null };
  const raw = c.resumePath ?? c.resume_path;
  return typeof raw === 'string' ? raw.trim() : '';
}
