import type { Candidate, CandidateCreateRequest } from '~/types/candidates';

/** Поля для POST /candidates: массивы, из JSON-строк HH или уже массивы */
export function normalizeArrayForCreate(value: unknown): unknown[] | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value.length > 0 ? [...value] : undefined;
  if (typeof value === 'string') {
    const t = value.trim();
    if (!t) return undefined;
    if (t.startsWith('[') || t.startsWith('{')) {
      try {
        const p = JSON.parse(t) as unknown;
        if (Array.isArray(p)) return p.length > 0 ? p : undefined;
        if (p && typeof p === 'object') return [p];
      } catch {
        return [t];
      }
    }
    return [t];
  }
  if (typeof value === 'object') return [value];
  return undefined;
}

export function attachmentLinksForCopy(c: Candidate): string[] | undefined {
  const raw = c.attachments;
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const links = raw
    .map(a =>
      typeof a === 'object' && a !== null && 'link' in a
        ? String((a as { link: string }).link).trim()
        : ''
    )
    .filter(Boolean);
  return links.length > 0 ? links : undefined;
}

/** Данные вкладки «Резюме» и прочие поля карточки для дубликата кандидата */
export function buildCandidateCopyPayload(
  c: Candidate,
  vacancyId: number
): CandidateCreateRequest {
  const cExt = c as Candidate & {
    hh_resume_id?: string | null;
    hh_area_id?: string | null;
    resume_created_at?: string | null;
  };
  const tags =
    Array.isArray(c.tags) && c.tags.length > 0
      ? c.tags
          .map(t =>
            typeof t === 'number'
              ? t
              : typeof t === 'object' && t !== null && 'id' in t
                ? (t as { id: number }).id
                : null
          )
          .filter((id): id is number => id != null && !Number.isNaN(id))
      : [];
  const skills =
    Array.isArray(c.skills) && c.skills.length > 0
      ? c.skills.map(s => s.id).filter(id => id != null && !Number.isNaN(id))
      : [];

  return {
    firstname: c.firstname || '',
    surname: c.surname,
    patronymic: c.patronymic ? c.patronymic : undefined,
    ...(c.email?.trim() ? { email: c.email.trim() } : {}),
    phone: c.phone ? c.phone : undefined,
    vacancy_id: vacancyId,
    age: c.age ?? undefined,
    location: c.location,
    gender: c.gender ?? undefined,
    gender_id: c.gender_id ?? undefined,
    salaryFrom: c.salaryFrom ?? undefined,
    salaryTo: c.salaryTo ?? undefined,
    currency: c.currency ?? undefined,
    metro_name: c.metro_name ?? undefined,
    quickInfo: c.quickInfo?.trim() || undefined,
    specializations: c.specializations?.trim() || undefined,
    employment: c.employment?.trim() || undefined,
    work_format: (c.work_format ?? c.workFormat)?.trim() || undefined,
    relocation_readiness: c.relocation_readiness?.trim() || undefined,
    relocation_type_id: c.relocation_type_id?.trim() || undefined,
    business_trip_readiness:
      (c.business_trip_readiness ?? c.businessTrips)?.trim() || undefined,
    business_trip_readiness_id: c.business_trip_readiness_id?.trim() || undefined,
    commute_time: (c.commute_time ?? c.commuteTime)?.trim() || undefined,
    has_vehicle: (c.has_vehicle ?? c.hasCar)?.trim() || undefined,
    driver_license_types:
      Array.isArray(c.driver_license_types) && c.driver_license_types.length > 0
        ? [...c.driver_license_types]
        : undefined,
    work_ticket: (c.work_ticket ?? c.workPermit)?.trim() || undefined,
    education_level_id:
      (c.education_level_id ?? c.educationLevel)?.trim() || undefined,
    education: c.education?.trim() || undefined,
    education_primary:
      Array.isArray(c.education_primary) && c.education_primary.length > 0
        ? c.education_primary
        : undefined,
    education_additional:
      Array.isArray(c.education_additional) && c.education_additional.length > 0
        ? c.education_additional
        : undefined,
    courseName: c.courseName?.trim() || undefined,
    courseOrganization: c.courseOrganization?.trim() || undefined,
    courseSpecialization: c.courseSpecialization?.trim() || undefined,
    courseYear: c.courseYear?.trim() || undefined,
    nativeLanguage: c.nativeLanguage?.trim() || undefined,
    otherLanguages: c.otherLanguages?.trim() || undefined,
    aboutMe: c.aboutMe?.trim() || undefined,
    skill_set: normalizeArrayForCreate(c.skill_set) as
      | string[]
      | unknown[]
      | undefined,
    recommendation: normalizeArrayForCreate(c.recommendation),
    certificate: normalizeArrayForCreate(c.certificate),
    citizenship: c.citizenship?.trim() || undefined,
    link: c.link?.trim() || undefined,
    experience: c.experience?.trim() || undefined,
    experiences:
      Array.isArray(c.experiences) && c.experiences.length > 0
        ? c.experiences
        : undefined,
    telegram: c.telegram ?? undefined,
    messengerMax: c.messengerMax ?? undefined,
    skype: c.skype ?? undefined,
    icon: c.icon ?? undefined,
    imagePath: c.imagePath ?? undefined,
    isPng: c.isPng ?? undefined,
    resume: c.resume ?? undefined,
    resumePath: c.resumePath ?? undefined,
    coverPath: c.coverPath ?? undefined,
    coverLetter: c.coverLetter?.trim() || undefined,
    hh_resume_id: cExt.hh_resume_id ?? undefined,
    hh_area_id: cExt.hh_area_id ?? undefined,
    resume_created_at: cExt.resume_created_at ?? undefined,
    resume_updated_at: c.resume_updated_at ?? undefined,
    source: c.source || null,
    isReserve: c.isReserve ?? undefined,
    skills: skills.length > 0 ? skills : undefined,
    tags: tags.length > 0 ? tags : undefined,
    attachments: attachmentLinksForCopy(c),
  };
}
