/**
 * Маппинг данных формы вакансии в формат API SuperJob для обновления вакансии (PUT).
 * API SuperJob требует: firm_name (обязательно), town (id — число), typeOfWork (id — число),
 * experience (id — число). Эти поля берутся из текущей вакансии SuperJob при обновлении.
 */

import { SUPERJOB_READY_TO_CONSIDER } from '@/src/constants';

/** Текущая вакансия с SuperJob (ответ GET /vacancies/:id) для подстановки обязательных id */
export interface SuperjobExistingVacancy {
  firm_name?: string;
  client?: { title?: string; name?: string };
  town?: { id?: number };
  type_of_work?: { id?: number };
  experience?: { id?: number };
  education?: { id?: number };
  place_of_work?: { id?: number };
  schedule?: { id?: number };
  catalogues?: Array<{ id?: number; title?: string }>;
  /** Готовы рассмотреть (требования к кандидату) */
  candidat?: string;
  [key: string]: any;
}

export interface SuperjobPayloadFormData {
  name?: string;
  description?: string;
  code?: string;
  professional_roles?: Array<{ id?: string | number; name?: string } | null>;
  industry?: { id?: string | number; name?: string } | null;
  employment_form?: { id?: string; name?: string } | null;
  work_schedule_by_days?: { id?: string; name?: string } | Array<{ id?: string | number; name?: string } | null> | null;
  experience?: { id?: string; name?: string } | null;
  education_level?: { id?: string; name?: string } | null;
  salary_range?: {
    from?: number | null;
    to?: number | null;
    currency?: { id?: string; name?: string; code?: string } | string;
  };
  area?: { id?: string | number; name?: string; title?: string } | null;
  address?: { id?: string | number; name?: string } | string | null;
  location?: string | null;
  workSpace?: string | number;
  work_address?: string | null;
  dateEnd?: string | null;
  phrases?: string | string[] | null;
  key_skills?: Array<{ name?: string } | string> | null;
  firm_name?: string;
  /** Готовы рассмотреть (SuperJob: candidat — текст). Маппинг с поля «Кто и как может откликаться». */
  candidat?: string | null;
  /** Выбранные чекбоксы «Готовы рассмотреть» (id из SUPERJOB_READY_TO_CONSIDER). Отправляются как флаги accept_short_resume, accept_age_14 и т.д. */
  superjob_ready_to_consider?: string[] | null;
  [key: string]: any;
}

function toStr(obj: { name?: string; title?: string } | string | null | undefined, maxLen = 255): string | undefined {
  if (obj == null) return undefined;
  const s = typeof obj === 'string' ? obj : (obj?.name ?? obj?.title ?? '');
  if (!s) return undefined;
  return maxLen ? s.substring(0, maxLen) : s;
}

function toNum(value: string | number | null | undefined): number | undefined {
  if (value === null || value === undefined) return undefined;
  const n = Number(value);
  return isNaN(n) ? undefined : n;
}

/** Преобразование даты d.m.Y в unix timestamp */
function dateToUnix(dateStr: string | null | undefined): number | undefined {
  if (!dateStr || typeof dateStr !== 'string') return undefined;
  const parts = dateStr.trim().split(/[.\-/]/);
  if (parts.length < 3) return undefined;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return undefined;
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return undefined;
  return Math.floor(d.getTime() / 1000);
}

/** Валюта формы -> код для SuperJob (rub, usd, eur) */
function mapCurrencyToSuperjob(currency: { id?: string; name?: string; code?: string } | string | null | undefined): string | undefined {
  if (currency == null) return undefined;
  const raw = typeof currency === 'string' ? currency : (currency?.code ?? currency?.id ?? currency?.name ?? '');
  if (!raw) return undefined;
  const upper = String(raw).toUpperCase();
  if (upper.startsWith('RUB') || upper === 'RUR') return 'rub';
  if (upper.startsWith('USD')) return 'usd';
  if (upper.startsWith('EUR')) return 'eur';
  return raw.toLowerCase().substring(0, 3);
}

/** place (1=офис, 2=гибрид, 3=удалёнка) -> объект place_of_work для SuperJob (по title) */
function mapPlaceOfWork(place: string | number | undefined): { id?: number; title?: string } | undefined {
  const p = place === undefined || place === null ? undefined : Number(place);
  if (p === 1) return { title: 'В офисе' };
  if (p === 2) return { title: 'Гибрид' };
  if (p === 3) return { title: 'Удаленная работа' };
  return undefined;
}

/**
 * Маппинг опыта работы из формы (HH/наш справочник) в id опыта SuperJob.
 * SuperJob: 1 — без опыта, 2 — от 1 года, 3 — от 3 лет, 4 — от 6 лет.
 * Наш experience.json: id (noExperience, between1And3, between3And6, moreThan6), value (0,1,2,3).
 */
function mapExperienceToSuperjobId(
  experience: { id?: string | number; name?: string; value?: number } | string | null | undefined
): number | undefined {
  if (experience == null) return undefined;
  const obj = typeof experience === 'object' ? experience : null;
  const id = obj ? (obj.id ?? obj.value) : experience;
  if (id == null) return undefined;
  const s = String(id);
  const byId: Record<string, number> = {
    noExperience: 1,
    between1And3: 2,
    between3And6: 3,
    moreThan6: 4,
    '1': 1,
    '2': 2,
    '3': 3,
    '4': 4,
  };
  // value в experience.json: 0,1,2,3 → SuperJob 1,2,3,4
  const byValue: Record<string, number> = { '0': 1, '1': 2, '2': 3, '3': 4 };
  const num = byId[s] ?? byValue[s] ?? (Number(id) || undefined);
  return num >= 1 && num <= 4 ? num : undefined;
}

/**
 * Преобразует данные формы вакансии в тело запроса для PUT /superjob/vacancies/:id.
 * При обновлении обязательно передать existingVacancy — из него берутся firm_name, town, typeOfWork, experience (id из справочников SuperJob).
 */
/** Извлекает объект вакансии из ответа API (обёртки data/object/vacancy или objects[0]) */
function unwrapExistingVacancy(raw: any): SuperjobExistingVacancy | null {
  if (raw == null || typeof raw !== 'object') return null;
  let current: any = raw;
  for (let i = 0; i < 3; i++) {
    const next = current?.data ?? current?.object ?? current?.vacancy ?? (Array.isArray(current?.objects) ? current.objects[0] : undefined);
    if (next && typeof next === 'object') current = next;
    else break;
  }
  return current;
}

export function mapVacancyToSuperjobPayload(
  formData: SuperjobPayloadFormData,
  existingVacancy?: SuperjobExistingVacancy | null
): Record<string, any> {
  const payload: Record<string, any> = {};
  const existing = unwrapExistingVacancy(existingVacancy ?? null);

  // firm_name — обязательно для API SuperJob; всегда непустая строка (бэкенд валидирует "Поле обязательно для заполнения")
  const firmNameRaw =
    formData.firm_name ??
    (formData as any).firm_name ??
    existing?.firm_name ??
    (existing as any)?.firmName ??
    existing?.client?.title ??
    existing?.client?.name ??
    '';
  const firmNameStr = typeof firmNameRaw === 'string' ? firmNameRaw.trim() : String(firmNameRaw ?? '').trim();
  payload.firm_name = (firmNameStr || 'Компания').substring(0, 255);

  // Название вакансии: обязательно для бэкенда и для API SuperJob (profession).
  // Бэкенд может валидировать «Название вакансии» по ключу name; SuperJob принимает profession.
  const formName = toStr(formData.name) ?? toStr((formData as any).title) ?? toStr(formData.professional_roles?.[0]);
  const professionFromExisting =
    existing?.profession != null
      ? (typeof existing.profession === 'string' ? existing.profession : toStr(existing.profession))
      : '';
  const profession = (formName || professionFromExisting || 'Вакансия').trim().substring(0, 255);
  payload.profession = profession;
  payload.name = profession;

  // Описание вакансии — всегда передаём (во всех вариантах имён полей API SuperJob), иначе на платформе не обновится
  const descriptionFromForm = formData.description != null && formData.description !== '' ? String(formData.description) : '';
  const descriptionToSend =
    descriptionFromForm.trim() ||
    (existing
      ? String((existing as any).vacancyRichText ?? (existing as any).vacancy_rich_text ?? (existing as any).description ?? '').trim()
      : '');
  payload.vacancyRichText = descriptionToSend;
  payload.vacancy_rich_text = descriptionToSend;
  payload.description = descriptionToSend;

  // Готовы рассмотреть: текст candidat (обязательное поле в API) + флаги чекбоксов (accept_short_resume, accept_students и т.д.)
  const candidatText = (formData as any).candidat ?? existing?.candidat ?? '';
  payload.candidat = typeof candidatText === 'string' && candidatText.trim() ? candidatText.trim().substring(0, 2000) : (existing?.candidat ?? 'Требования не указаны');
  const selectedIds = Array.isArray((formData as any).superjob_ready_to_consider) ? (formData as any).superjob_ready_to_consider : [];
  for (const opt of SUPERJOB_READY_TO_CONSIDER) {
    payload[opt.superjobKey] = selectedIds.includes(opt.id);
  }
  // Если с текущей вакансии SuperJob пришли флаги, а в форме ничего не выбрано — сохраняем существующие
  if (selectedIds.length === 0 && existing) {
    for (const opt of SUPERJOB_READY_TO_CONSIDER) {
      if ((existing as any)[opt.superjobKey] === true) payload[opt.superjobKey] = true;
    }
  }

  // payment_from, payment_to — зарплата
  const fromVal = formData.salary_range?.from ?? (formData as any).salary_from;
  const toVal = formData.salary_range?.to ?? (formData as any).salary_to;
  const paymentFrom = toNum(fromVal);
  const paymentTo = toNum(toVal);
  if (paymentFrom !== undefined && paymentFrom !== null) {
    payload.payment_from = paymentFrom;
  }
  if (paymentTo !== undefined && paymentTo !== null) {
    payload.payment_to = paymentTo;
  }

  // currency — код валюты (rub, usd, eur)
  const currency = formData.salary_range?.currency ?? (formData as any).currency;
  const currencyCode = mapCurrencyToSuperjob(currency);
  if (currencyCode) {
    payload.currency = currencyCode;
  }

  // typeOfWork — тип занятости: API требует id (число) из справочника SuperJob
  const typeOfWorkId = existing?.type_of_work?.id;
  if (typeOfWorkId !== undefined && typeOfWorkId !== null && !isNaN(Number(typeOfWorkId))) {
    payload.typeOfWork = Number(typeOfWorkId);
  }

  // experience — опыт: приоритет у значения из формы (маппим наш id в id SuperJob), иначе из текущей вакансии SuperJob
  const formExperienceId = mapExperienceToSuperjobId(formData.experience);
  if (formExperienceId !== undefined) {
    payload.experience = formExperienceId;
  } else {
    const experienceId = existing?.experience?.id;
    if (experienceId !== undefined && experienceId !== null && !isNaN(Number(experienceId))) {
      payload.experience = Number(experienceId);
    }
  }

  // education — образование: по аналогии передаём id из текущей вакансии, если API ожидает число
  const educationId = existing?.education?.id;
  if (educationId !== undefined && educationId !== null && !isNaN(Number(educationId))) {
    payload.education = Number(educationId);
  }

  // schedule — график: id из текущей вакансии
  const scheduleId = existing?.schedule?.id;
  if (scheduleId !== undefined && scheduleId !== null && !isNaN(Number(scheduleId))) {
    payload.schedule = Number(scheduleId);
  }

  // place_of_work — место работы: id из текущей вакансии (офис/удалёнка/гибрид)
  const placeOfWorkId = existing?.place_of_work?.id;
  if (placeOfWorkId !== undefined && placeOfWorkId !== null && !isNaN(Number(placeOfWorkId))) {
    payload.place_of_work = Number(placeOfWorkId);
  } else {
    const place = formData.workSpace ?? (formData as any).place;
    const placeOfWork = mapPlaceOfWork(place);
    if (placeOfWork) {
      payload.place_of_work = placeOfWork;
    }
  }

  // town — город: API требует строго число (id из справочника SuperJob); обязательно при обновлении
  const townObj = existing?.town;
  const townRaw =
    townObj != null && typeof townObj === 'object'
      ? (townObj.id ?? (townObj as { key?: number }).key)
      : typeof townObj === 'number'
        ? townObj
        : undefined;
  let townId = townRaw !== undefined && townRaw !== null ? Number(townRaw) : NaN;
  if (isNaN(townId) && existing != null) {
    const alt = (existing as any).town_id ?? (existing as any).id_town ?? (existing as any).town;
    const altNum = typeof alt === 'number' ? alt : (alt != null && typeof alt === 'object' && 'id' in alt ? Number((alt as any).id) : NaN);
    if (!isNaN(altNum) && altNum > 0) townId = altNum;
  }
  if (!isNaN(townId) && townId > 0) {
    payload.town = Number(Math.floor(townId));
  }

  // address — адрес работы (строка)
  const workAddress = formData.work_address ?? (typeof formData.address === 'string' ? formData.address : formData.address?.name);
  if (workAddress) {
    payload.address = String(workAddress).substring(0, 500);
  }

  // date_pub_to — дата окончания публикации (unix timestamp)
  const dateEnd = formData.dateEnd ?? (formData as any).dateEnd;
  const datePubTo = dateToUnix(dateEnd);
  if (datePubTo !== undefined) {
    payload.date_pub_to = datePubTo;
  }

  // code — код вакансии
  if (formData.code !== undefined && formData.code !== null && formData.code !== '') {
    payload.code = String(formData.code).substring(0, 255);
  }

  // resumesubscription_keys — ключевые слова (массив строк)
  let keys: string[] = [];
  if (formData.key_skills && Array.isArray(formData.key_skills)) {
    keys = formData.key_skills.map((s: any) => typeof s === 'string' ? s : (s?.name ?? '')).filter(Boolean);
  }
  if (keys.length === 0 && formData.phrases) {
    const p = formData.phrases;
    keys = typeof p === 'string' ? p.split(',').map((s) => s.trim()).filter(Boolean) : (Array.isArray(p) ? p.map(String) : []);
  }
  if (keys.length > 0) {
    payload.resumesubscription_keys = keys;
  }

  // catalogues — профессиональная сфера SuperJob (обязательно передавать при обновлении, иначе не обновится).
  // Приоритет: id из формы (superjob_catalogue_id), если форма в режиме SuperJob и пользователь выбрал категорию каталога; иначе — из текущей вакансии SuperJob.
  const superjobCatalogueId = formData.superjob_catalogue_id;
  if (superjobCatalogueId !== undefined && superjobCatalogueId !== null && superjobCatalogueId !== '') {
    const numId = Number(superjobCatalogueId);
    if (!isNaN(numId)) {
      payload.catalogues = [{ id: numId }];
    }
  }
  if ((!payload.catalogues || payload.catalogues.length === 0) && existing?.catalogues && Array.isArray(existing.catalogues) && existing.catalogues.length > 0) {
    payload.catalogues = existing.catalogues.map((c: any) =>
      typeof c === 'object' && c !== null && c.id != null ? { id: Number(c.id) } : c
    );
  }

  // Водительские права на платформу SuperJob: массив с id = название категории (A, B, BE и т.д.). API SuperJob — driving_licence: ['A','B',...].
  const drivingCategoryNames = toSuperjobDrivingLicenceIds(formData.driver_license_types ?? (formData as any).drivers);
  if (drivingCategoryNames.length > 0) {
    payload.driving_licence = drivingCategoryNames;
  }

  return payload;
}

/** Извлекает названия категорий прав (для SuperJob driving_licence) из формы: id = название категории. */
function toSuperjobDrivingLicenceIds(value: unknown): string[] {
  if (value == null || !Array.isArray(value) || value.length === 0) return [];
  const valid = /^[A-E]E?$|^T[MB]$/i;
  return value
    .map((item) => {
      if (typeof item === 'string' && valid.test(item)) return item.toUpperCase();
      if (item && typeof item === 'object') {
        const obj = item as { id?: string | number; name?: string; value?: string };
        const name =
          typeof obj.id === 'string' ? obj.id : typeof obj.name === 'string' ? obj.name : typeof obj.value === 'string' ? obj.value : String(obj.id ?? obj.name ?? '').trim();
        return name && valid.test(name) ? name.toUpperCase() : null;
      }
      return null;
    })
    .filter((s): s is string => typeof s === 'string');
}
