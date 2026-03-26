import type { CandidateCreateRequest } from '~/types/candidates';

function pickString(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (v != null && typeof v === 'string' && v.trim()) return v.trim();
    if (typeof v === 'number' && !Number.isNaN(v)) return String(v);
  }
  return undefined;
}

/** Телефон в формате +7XXXXXXXXXX для API кандидатов */
function normalizeRuPhone(raw: unknown): string | undefined {
  if (raw == null) return undefined;
  const s = String(raw).replace(/\D/g, '');
  if (s.length === 11 && s.startsWith('7')) return `+${s}`;
  if (s.length === 11 && s.startsWith('8')) return `+7${s.slice(1)}`;
  if (s.length === 10) return `+7${s}`;
  return undefined;
}

function townTitle(raw: Record<string, unknown>): string | undefined {
  const town = raw.town;
  if (town && typeof town === 'object') {
    const t = town as { title?: string; name?: string };
    const x = t.title ?? t.name;
    if (x && String(x).trim()) return String(x).trim();
  }
  return pickString(raw, 'town', 'city', 'location');
}

function nestedTitle(obj: unknown): string | undefined {
  if (obj && typeof obj === 'object' && 'title' in obj) {
    const t = (obj as { title?: unknown }).title;
    if (typeof t === 'string' && t.trim()) return t.trim();
  }
  return undefined;
}

function pickPhoneFromSuperjobResume(raw: Record<string, unknown>): string | undefined {
  const p1 = pickString(raw, 'phone1');
  if (p1) return normalizeRuPhone(p1);
  const phones = raw.phones;
  if (Array.isArray(phones) && phones.length > 0) {
    const first = phones[0] as Record<string, unknown>;
    if (first?.phone != null) return normalizeRuPhone(first.phone);
  }
  return normalizeRuPhone(raw.phone ?? raw.cellphone ?? raw.phone_cell ?? raw.mobile);
}

function formatEducationFromResume(raw: Record<string, unknown>): string | undefined {
  const level = nestedTitle(raw.education);
  const be = raw.base_education_history;
  if (Array.isArray(be) && be.length > 0) {
    const first = be[0] as Record<string, unknown>;
    const inst = first.institute && typeof first.institute === 'object'
      ? nestedTitle(first.institute)
      : undefined;
    const prof = pickString(first, 'profession', 'faculty');
    const yearend = first.yearend;
    const parts = [level, inst, prof, yearend != null ? String(yearend) : ''].filter(Boolean);
    if (parts.length) return parts.join(' · ').substring(0, 100);
  }
  return level?.substring(0, 100);
}

function buildQuickInfo(raw: Record<string, unknown>): string | undefined {
  const additional = pickString(raw, 'additional_info');
  if (additional) return additional.substring(0, 255);
  const parts = [
    pickString(raw, 'profession'),
    pickString(raw, 'last_profession'),
    pickString(raw, 'experience_text'),
  ].filter(Boolean);
  if (parts.length) return parts.join(' · ').substring(0, 255);
  return undefined;
}

function buildResumeTitle(raw: Record<string, unknown>): string | undefined {
  const t =
    pickString(raw, 'last_profession', 'profession', 'position', 'title', 'resume_title') ??
    pickString(raw, 'name');
  return t ? t.substring(0, 50) : undefined;
}

function buildLink(raw: Record<string, unknown>, externalResumeId: string | number | null | undefined): string | null {
  const fromApi = pickString(raw, 'link', 'short_link');
  if (fromApi) return fromApi.substring(0, 100);
  if (externalResumeId != null && externalResumeId !== '') {
    return `https://www.superjob.ru/resume/cv-${externalResumeId}.html`.substring(0, 100);
  }
  return null;
}

/**
 * Маппинг одной записи (плоский объект resume из SuperJob) в тело POST /candidates.
 */
export function mapSuperjobReceivedResumeToCandidateCreate(
  raw: Record<string, unknown>,
  options: { vacancyId: number; externalResumeId?: string | number | null }
): CandidateCreateRequest {
  let firstname =
    pickString(raw, 'firstname', 'first_name', 'firstName') || 'Кандидат';
  firstname = firstname.substring(0, 50);
  if (firstname.length < 3) {
    firstname = 'Кандидат';
  }

  const surname = pickString(raw, 'lastname', 'last_name', 'lastName', 'surname')?.substring(0, 50);
  const patronymic = pickString(raw, 'middlename', 'middle_name', 'middleName', 'patronymic')?.substring(0, 50);

  let email = pickString(raw, 'email', 'e_mail', 'mail');
  if (!email) {
    const key = options.externalResumeId != null ? String(options.externalResumeId) : `${Date.now()}`;
    const local = `sj${key.replace(/\D/g, '').slice(-12) || key.slice(-12)}`;
    email = `${local}@sj.imp`.substring(0, 50);
  } else {
    email = email.substring(0, 50);
  }

  const phone = pickPhoneFromSuperjobResume(raw);
  const resumeTitle = buildResumeTitle(raw);
  const quickInfo = buildQuickInfo(raw);
  const education = formatEducationFromResume(raw);
  const experienceText = pickString(raw, 'experience_text', 'experience', 'total_experience');
  const experience = experienceText ? experienceText.substring(0, 50) : undefined;

  const ext = options.externalResumeId;
  const link = buildLink(raw, ext);

  const ageRaw = raw.age;
  const age =
    typeof ageRaw === 'number' && Number.isFinite(ageRaw)
      ? ageRaw
      : typeof ageRaw === 'string' && /^\d+$/.test(ageRaw)
        ? parseInt(ageRaw, 10)
        : undefined;

  const body: CandidateCreateRequest = {
    firstname,
    surname,
    patronymic,
    email,
    phone,
    vacancy_id: options.vacancyId,
    source: 'superjob.ru',
    location: townTitle(raw)?.substring(0, 100),
    resume: resumeTitle ?? undefined,
    quickInfo,
    education,
    link: link || null,
    experience,
  };

  if (age != null && age >= 0 && age < 150) {
    body.age = age;
  }

  if (options.externalResumeId != null && options.externalResumeId !== '') {
    const n = Number(options.externalResumeId);
    body.platform = 'superjob';
    body.platform_resume_id = Number.isFinite(n) ? n : String(options.externalResumeId);
  }

  return body;
}

export function extractSuperjobResumeExternalId(raw: Record<string, unknown>): string | number | undefined {
  const id =
    raw.id ??
    raw.resume_id ??
    raw.id_resume ??
    raw.resumeId ??
    (raw.resume as Record<string, unknown> | undefined)?.id;
  if (id == null) return undefined;
  if (typeof id === 'number' || typeof id === 'string') return id;
  return undefined;
}
