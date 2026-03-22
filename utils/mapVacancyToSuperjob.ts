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
  /** ID города из справочника SuperJob towns (при использовании городов SuperJob). Иначе используется area.name или location. */
  superjob_town_id?: number | null;
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

  // profession — название вакансии (обязательно для API SuperJob). Формат: "Python разработчик".
  const formName = toStr(formData.name) ?? toStr((formData as any).title) ?? toStr(formData.professional_roles?.[0]);
  const professionFromExisting =
    existing?.profession != null
      ? (typeof existing.profession === 'string' ? existing.profession : toStr(existing.profession))
      : '';
  const profession = (formName || professionFromExisting || 'Вакансия').trim().substring(0, 255);
  payload.profession = profession;
  payload.name = profession;

  // Описание и candidat при обновлении отправляем как есть (без добавления/удаления «Требования»).
  const descriptionFromForm = formData.description != null && formData.description !== '' ? String(formData.description) : '';
  const descriptionToSend =
    descriptionFromForm.trim() ||
    (existing
      ? String((existing as any).vacancyRichText ?? (existing as any).vacancy_rich_text ?? (existing as any).description ?? '').trim()
      : '');
  payload.vacancyRichText = descriptionToSend;
  payload.vacancy_rich_text = descriptionToSend;
  payload.description = descriptionToSend;

  // candidat — при редактировании отправляем строку как есть (то же значение, что и description)
  payload.candidat = descriptionToSend || (existing?.candidat ?? 'Требования не указаны');
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

  // typeOfWork — тип занятости: из формы (Условия занятости) или из текущей вакансии SuperJob
  const TYPE_OF_WORK_IDS = new Set(['6', '7', '9', '10', '12', '13', '14']);
  const conditions = (formData as any).superjob_employment_conditions as string[] | undefined;
  const firstTypeId = Array.isArray(conditions)
    ? conditions.map((id) => (id != null ? String(id) : '')).find((id) => TYPE_OF_WORK_IDS.has(id))
    : undefined;
  const typeOfWorkId = firstTypeId != null ? Number(firstTypeId) : (existing?.type_of_work?.id != null ? Number(existing.type_of_work.id) : undefined);
  if (typeOfWorkId !== undefined && typeOfWorkId !== null && !isNaN(typeOfWorkId)) {
    payload.typeOfWork = typeOfWorkId;
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

  // place_of_work — место работы: из формы (Условия занятости) или из текущей вакансии / workSpace
  const PLACE_OF_WORK_IDS = new Set(['1', '2', '3']);
  const firstPlaceId = Array.isArray(conditions)
    ? conditions.map((id) => (id != null ? String(id) : '')).find((id) => PLACE_OF_WORK_IDS.has(id))
    : undefined;
  let placeOfWorkId = firstPlaceId != null ? Number(firstPlaceId) : (existing?.place_of_work?.id != null ? Number(existing.place_of_work.id) : undefined);
  if (placeOfWorkId === undefined || placeOfWorkId === null || isNaN(placeOfWorkId)) {
    const place = formData.workSpace ?? (formData as any).place;
    const placeOfWork = mapPlaceOfWork(place);
    if (placeOfWork?.id != null) placeOfWorkId = Number(placeOfWork.id);
    else if (placeOfWork) placeOfWorkId = (placeOfWork as { id?: number }).id;
  }
  if (placeOfWorkId !== undefined && placeOfWorkId !== null && !isNaN(placeOfWorkId)) {
    payload.place_of_work = Number(placeOfWorkId);
  }

  // town — город: API SuperJob для создания/обновления вакансии требует строго число (id из справочника towns).
  // Ошибки: "Id Town must be a number", "Указан не существующий город". Передаём только numeric id.
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
  if (isNaN(townId) && formData.superjob_town_id != null) {
    const sid = Number(formData.superjob_town_id);
    if (!isNaN(sid) && sid > 0) townId = sid;
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

  // catalogues — профессиональная сфера SuperJob: отрасль (id, title, key) + специализация в positions[] (id, title, key).
  // У нас: отрасль = industry, специализация = professional_roles[0]. Собираем полную структуру как в API SuperJob.
  const industry = formData.industry;
  const positionRole = formData.professional_roles?.[0];
  const superjobCatalogueId = formData.superjob_catalogue_id;
  const industryId = industry && (industry.id != null || (industry as any).key != null)
    ? Number(industry.id ?? (industry as any).key)
    : NaN;
  const industryTitle = industry ? String(industry.name ?? (industry as any).title ?? '').trim() : '';
  const positionId = positionRole && (positionRole.id != null || (positionRole as any).key != null)
    ? Number(positionRole.id ?? (positionRole as any).key)
    : (superjobCatalogueId != null && superjobCatalogueId !== '' ? Number(superjobCatalogueId) : NaN);
  const positionTitle = positionRole ? String(positionRole.name ?? (positionRole as any).title ?? '').trim() : '';
  if (!isNaN(industryId) && !isNaN(positionId)) {
    payload.catalogues = [
      {
        id: industryId,
        title: industryTitle || undefined,
        key: industryId,
        positions: [{ id: positionId, title: positionTitle || undefined, key: positionId }],
      },
    ];
  } else if (superjobCatalogueId !== undefined && superjobCatalogueId !== null && superjobCatalogueId !== '') {
    const numId = Number(superjobCatalogueId);
    if (!isNaN(numId)) {
      payload.catalogues = [{ id: numId, key: numId, positions: [{ id: numId, key: numId }] }];
    }
  }
  if ((!payload.catalogues || payload.catalogues.length === 0) && existing?.catalogues && Array.isArray(existing.catalogues) && existing.catalogues.length > 0) {
    payload.catalogues = existing.catalogues.map((c: any) => {
      if (c == null || typeof c !== 'object') return c;
      const id = c.id != null ? Number(c.id) : (c.key != null ? Number(c.key) : null);
      if (id == null) return c;
      const positions = Array.isArray(c.positions) ? c.positions.map((p: any) => {
        if (p == null || typeof p !== 'object') return p;
        const pid = p.id != null ? Number(p.id) : (p.key != null ? Number(p.key) : null);
        return pid != null ? { id: pid, title: p.title ?? p.title_rus, key: pid } : p;
      }) : [];
      return { id, title: c.title ?? c.title_rus, key: id, positions: positions.length ? positions : [{ id, key: id }] };
    });
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
