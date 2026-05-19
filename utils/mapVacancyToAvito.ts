import type { DraftDataHh } from '@/types/platform';
import {
  collectAvitoContractKeysFromForm,
  mapAvitoContractKeysToRegistrationApi,
  normalizeAvitoContractKeyToApi,
  resolveBillingTypeFromContractKeys,
} from '@/utils/avitoContractMapping';
import {
  mapJoblySalaryGrossToAvitoTaxes,
  resolveJoblySalaryGrossFromVacancy,
  resolveJoblySalaryRangeFromVacancy,
} from '@/utils/avitoSalaryFromJobly';
import { normalizeAvitoPayoutFrequencyIdForPopup } from '@/utils/avitoPayoutFrequencyMapping';
import { findAvitoSalaryModeOption } from '@/utils/avitoSalaryPeriodMapping';
import {
  resolveBusinessAreaIdForAvitoApi,
  type AvitoBusinessAreaCatalogRow,
} from '@/utils/avitoBusinessAreaMapping';
import {
  mapAvitoPhoneToApiPayload,
  type AvitoContactEmployeeOption,
} from '@/utils/avitoContactEmployees';
import { formatDescriptionForAvitoApi } from '@/utils/avitoDescriptionFormat';

/**
 * Интерфейс данных вакансии из AddPublication формы
 */
export interface VacancyFormDataAvito {
  name?: string;
  code?: string;
  description?: string;
  industry?: any;
  professional_roles?: Array<{ id: string | number; name?: string } | null>;
  experience?: { id: string; name?: string };
  employment_form?: { id: string; name?: string };
  work_schedule_by_days?: { id: string; name?: string };
  education_level?: { id: string; name?: string };
  salary_range?: {
    from?: number | null;
    to?: number | null;
    currency?: { id: string; name?: string } | string;
    frequency?: { id: string };
  };
  area?: { id: string | number; name?: string };
  address?: { id: string | number; name?: string };
  workSpace?: string;
  work_format?: Array<{ id: string }>;
  key_skills?: Array<{ name: string }>;
  [key: string]: any;
}

const AVITO_APPLY_TYPES = new Set(['only_with_resume', 'with_assistant']);

/** Отклики: API Avito не принимает apply_type optional. */
export function resolveAvitoApplyProcessing(
  vacancyData: Record<string, unknown>,
): { apply_type: string } | null {
  const ap = vacancyData.apply_processing as { apply_type?: unknown } | undefined;
  const rawType = ap?.apply_type != null ? String(ap.apply_type).trim() : '';
  if (AVITO_APPLY_TYPES.has(rawType)) {
    return { apply_type: rawType };
  }
  const contactMethod = String(vacancyData.avito_contact_method ?? '').trim();
  if (contactMethod === 'with_assistant') return { apply_type: 'with_assistant' };
  if (contactMethod === 'only_with_resume') return { apply_type: 'only_with_resume' };
  return null;
}

function normalizeAvitoPhone(
  phone: unknown
): { city?: string; country?: string; number?: string } | null {
  if (phone == null) return null;
  if (typeof phone === 'string') {
    return mapAvitoPhoneToApiPayload(phone);
  }
  if (typeof phone === 'object') {
    const p = phone as Record<string, unknown>;
    const fromNumber = mapAvitoPhoneToApiPayload(p.number);
    if (fromNumber) return fromNumber;
    const city = typeof p.city === 'string' ? p.city.trim() : '';
    const country = typeof p.country === 'string' ? p.country.trim() : '';
    if (!city && !country) return null;
    return {
      ...(city ? { city } : {}),
      ...(country ? { country } : {}),
    };
  }
  return null;
}

function resolveAvitoContactFromForm(vacancyData: VacancyFormDataAvito): {
  name: string
  email: string | null
  phone: { number: string } | null
  employeeId: number | null
} {
  const selected = vacancyData.avito_contact_employee as AvitoContactEmployeeOption | null | undefined;
  if (selected && typeof selected === 'object' && selected.phone) {
    const employeeId =
      selected.employee_id != null && Number.isFinite(Number(selected.employee_id))
        ? Math.floor(Number(selected.employee_id))
        : null;
    return {
      name: String(selected.name ?? vacancyData.executor_name ?? '').trim(),
      email: String(selected.email ?? vacancyData.executor_email ?? '').trim() || null,
      phone: mapAvitoPhoneToApiPayload(selected.phone),
      employeeId: employeeId && employeeId > 0 ? employeeId : null,
    };
  }

  const employeeIdRaw = vacancyData.avito_contact_employee_id ?? vacancyData.avito_employee_id;
  const employeeId =
    employeeIdRaw != null && Number.isFinite(Number(employeeIdRaw))
      ? Math.floor(Number(employeeIdRaw))
      : null;

  const phone =
    normalizeAvitoPhone(vacancyData.executor_phone) ??
    (vacancyData.contacts ? normalizeAvitoPhone((vacancyData.contacts as { phone?: unknown }).phone) : null);

  return {
    name: String(vacancyData.executor_name ?? '').trim(),
    email: String(vacancyData.executor_email ?? '').trim() || null,
    phone,
    employeeId: employeeId && employeeId > 0 ? employeeId : null,
  };
}

/**
 * Маппинг типа занятости из формы в формат Avito API
 * Avito использует: full, partial, project, volunteer, probation
 */
function mapEmploymentToAvito(employmentForm: { id?: string; name?: string } | null | undefined): string | null {
  if (!employmentForm || !employmentForm.id) return null;
  
  // Маппинг формата hh.ru на формат Avito (в нижнем регистре)
  const employmentMap: Record<string, string> = {
    'FULL': 'full',           // Полная занятость
    'PART': 'partial',        // Частичная занятость
    'PROJECT': 'project',     // Проектная работа
    'FLY_IN_FLY_OUT': 'full', // Вахта → полная + schedule flyInFlyOut
    'SIDE_JOB': 'partial',
    'VOLUNTEER': 'volunteer', // Волонтерство
    'PROBATION': 'probation', // Стажировка
  };
  
  return employmentMap[employmentForm.id] || null;
}

/** Допустимые значения schedule.id в API Avito */
const AVITO_SCHEDULE_ENUM = ['flyInFlyOut', 'flexible', 'shift', 'fixed', 'partTime', 'fullDay', 'remote', 'fiveDay', 'sixDay'] as const;
type AvitoScheduleId = typeof AVITO_SCHEDULE_ENUM[number];

const DEFAULT_AVITO_SCHEDULE: AvitoScheduleId = 'fullDay';

/**
 * Маппинг графика работы из формы в формат Avito API.
 * API Avito: enum [flyInFlyOut, flexible, shift, fixed, partTime, fullDay, remote, fiveDay, sixDay]
 */
function mapScheduleToAvito(schedule: { id?: string | number; name?: string } | string | null | undefined): { id: AvitoScheduleId } | null {
  if (schedule == null) return null;
  const raw = typeof schedule === 'string' ? schedule : (schedule.id != null ? String(schedule.id).trim() : '');
  if (raw === '') return null;
  if (AVITO_SCHEDULE_ENUM.includes(raw as AvitoScheduleId)) return { id: raw as AvitoScheduleId };
  // Маппинг формата hh.ru и др. на формат Avito
  const scheduleMap: Record<string, AvitoScheduleId> = {
    'FULL_DAY': 'fullDay',
    'SHIFT': 'shift',
    'FLEXIBLE': 'flexible',
    'REMOTE': 'remote',
    'FLY_IN_FLY_OUT': 'flyInFlyOut',
    'FIXED': 'fixed',
    'PART_TIME': 'partTime',
    'PARTTIME': 'partTime',
    'FIVE_DAY': 'fiveDay',
    'FIVEDAY': 'fiveDay',
    'SIX_DAY': 'sixDay',
    'SIXDAY': 'sixDay',
    'fullDay': 'fullDay',
    'shift': 'shift',
    'flexible': 'flexible',
    'remote': 'remote',
    'flyInFlyOut': 'flyInFlyOut',
    'fixed': 'fixed',
    'partTime': 'partTime',
    'fiveDay': 'fiveDay',
    'sixDay': 'sixDay',
  };
  const avitoId = scheduleMap[raw] ?? scheduleMap[raw.toUpperCase()];
  return avitoId ? { id: avitoId } : null;
}

/** Приводит значение к допустимому schedule.id; при невалидном возвращает default */
function normalizeScheduleId(value: unknown): AvitoScheduleId {
  if (value != null && typeof value === 'object' && 'id' in value) {
    const m = mapScheduleToAvito(value as { id?: string | number });
    return m?.id ?? DEFAULT_AVITO_SCHEDULE;
  }
  if (typeof value === 'string' && AVITO_SCHEDULE_ENUM.includes(value as AvitoScheduleId)) return value as AvitoScheduleId;
  const m = mapScheduleToAvito(typeof value === 'string' ? value : value != null ? { id: (value as any).id ?? value } : null);
  return m?.id ?? DEFAULT_AVITO_SCHEDULE;
}

/**
 * Маппинг опыта работы из формы в формат Avito API
 * Avito использует: "noMatter", "moreThan1", "moreThan3", "moreThan5", "moreThan10"
 * Возвращает объект { id: string }
 */
function mapExperienceToAvito(experience: { id?: string; name?: string } | null | undefined): { id: string } | null {
  if (!experience || !experience.id) return null;
  
  // Маппинг формата hh.ru на формат Avito
  const experienceMap: Record<string, string> = {
    'noExperience': 'noMatter',      // Без опыта -> Неважно
    'between1And3': 'moreThan1',      // От 1 до 3 лет -> Более 1 года
    'between3And6': 'moreThan3',     // От 3 до 6 лет -> Более 3 лет
    'moreThan6': 'moreThan5',        // Более 6 лет -> Более 5 лет
    // Дополнительные значения для Avito
    'noMatter': 'noMatter',
    'moreThan1': 'moreThan1',
    'moreThan3': 'moreThan3',
    'moreThan5': 'moreThan5',
    'moreThan10': 'moreThan10',
  };
  
  const avitoId = experienceMap[experience.id];
  return avitoId ? { id: avitoId } : null;
}

/**
 * Маппинг образования из формы в формат Avito API
 * Avito использует: SECONDARY, SECONDARY_SPECIAL, UNFINISHED_HIGHER, HIGHER
 */
function mapEducationToAvito(education: { id?: string; name?: string } | null | undefined): string | null {
  if (!education || !education.id) return null;
  
  // Маппинг формата hh.ru на формат Avito
  const educationMap: Record<string, string> = {
    'secondary': 'SECONDARY',
    'special_secondary': 'SECONDARY_SPECIAL',
    'unfinished_higher': 'UNFINISHED_HIGHER',
    'higher': 'HIGHER',
  };
  
  return educationMap[education.id] || null;
}

/**
 * Маппинг места работы (офис/удаленно) из формы в формат Avito API
 * Avito использует булево поле is_remote
 */
function mapWorkSpaceToAvito(workSpace: string | undefined): boolean | null {
  if (!workSpace) return null;
  
  // '3' = удаленно, остальное = офис/гибрид
  return workSpace === '3';
}

/**
 * Маппинг валюты из формы в формат Avito API
 * Avito использует: RUR, USD, EUR
 */
/** Формат зарплаты для POST /job/v1/vacancies: salary — int64, диапазон — salary_base_range. */
function buildAvitoSalaryApiFields(input: {
  from?: number | null
  to?: number | null
}): { salary?: number; salary_base_range?: { from?: number; to?: number } } {
  const from =
    input.from != null && Number.isFinite(Number(input.from)) ? Math.floor(Number(input.from)) : undefined
  const to =
    input.to != null && Number.isFinite(Number(input.to)) ? Math.floor(Number(input.to)) : undefined
  const hasFrom = from != null && from > 0
  const hasTo = to != null && to > 0

  if (hasFrom && hasTo) {
    return { salary_base_range: { from, to } }
  }
  if (hasFrom) {
    return { salary: from }
  }
  if (hasTo) {
    return { salary_base_range: { to } }
  }
  return {}
}

function resolveAvitoPaidPeriodLabel(
  vacancyData: VacancyFormDataAvito,
): string | null {
  const modeRaw = vacancyData.salary_range?.mode
  if (modeRaw != null) {
    if (typeof modeRaw === 'object') {
      const name = String((modeRaw as { name?: unknown }).name ?? '').trim()
      if (name) return name
      const id = String((modeRaw as { id?: unknown }).id ?? '').trim()
      const hit = findAvitoSalaryModeOption(id)
      if (hit?.name) return hit.name
    } else {
      const hit = findAvitoSalaryModeOption(String(modeRaw))
      if (hit?.name) return hit.name
    }
  }
  const freq = String(vacancyData.salary_frequency ?? '').trim()
  if (freq) {
    const hit = findAvitoSalaryModeOption(freq)
    if (hit?.name) return hit.name
  }
  return null
}

function mapCurrencyToAvito(currency: { id?: string; name?: string } | string | undefined): string {
  if (!currency) return 'RUR';
  
  if (typeof currency === 'string') {
    const currencyMap: Record<string, string> = {
      'RUB (рубль)': 'RUR',
      'USD (доллар)': 'USD',
      'EUR (евро)': 'EUR',
    };
    return currencyMap[currency] || 'RUR';
  }
  
  if (currency.id) {
    return currency.id === 'RUR' || currency.id === 'USD' || currency.id === 'EUR' 
      ? currency.id 
      : 'RUR';
  }
  
  return 'RUR';
}

/** Допустимые значения billing_type в API Avito */
const AVITO_BILLING_TYPE_ENUM = ['package', 'single', 'packageOrSingle'] as const;
type AvitoBillingType = typeof AVITO_BILLING_TYPE_ENUM[number];

/**
 * Маппинг типа тарифа в формат Avito API.
 * API Avito: enum [package, single, packageOrSingle]
 */
function mapBillingTypeToAvito(billingType: string | { id?: string; name?: string } | null | undefined): AvitoBillingType | null {
  if (billingType == null) return null;
  // Объект из формы: берём id или name (могут быть число/строка)
  const raw = typeof billingType === 'string'
    ? billingType
    : (billingType.id != null ? String(billingType.id) : billingType.name != null ? String(billingType.name) : '');
  const s = String(raw).trim().toLowerCase();
  if (!s) return null;
  if (AVITO_BILLING_TYPE_ENUM.includes(s as AvitoBillingType)) return s as AvitoBillingType;
  if (s === 'packageorsingle' || s === 'package_or_single') return 'packageOrSingle';
  if (s.includes('package') && s.includes('single')) return 'packageOrSingle';
  if (s.includes('package') || s === 'pack' || s === 'пакет') return 'package';
  if (s.includes('single') || s === 'one' || s === 'одна' || s === 'стандарт' || s === 'standard') return 'single';
  return null;
}

function mapRegistrationMethodFromForm(vacancyData: VacancyFormDataAvito): string[] {
  const fromKeys = mapAvitoContractKeysToRegistrationApi(collectAvitoContractKeysFromForm(vacancyData));
  if (fromKeys.length > 0) return fromKeys;

  const title = vacancyData?.billing_types?.name != null ? String(vacancyData.billing_types.name).trim().toLowerCase() : '';
  const fallback: string[] = [];
  if (title.includes('трудовой')) fallback.push('contract');
  if (title.includes('гпх') && title.includes('ип')) fallback.push('gph_ip');
  if (title.includes('самозанят')) fallback.push('gph_self_employed');
  if (title.includes('физ')) fallback.push('gph_individual');

  return fallback;
}

/** Возвращает true, если значение — одно из допустимых для Avito billing_type */
function isAvitoBillingType(v: unknown): v is AvitoBillingType {
  return typeof v === 'string' && AVITO_BILLING_TYPE_ENUM.includes(v as AvitoBillingType);
}

/** payout_frequency.id в UI Avito (4 варианта). */
const AVITO_PAYOUT_FREQUENCY_POPUP_IDS = ['weeklyPay', 'monthlyPay', 'biweeklyPay', 'thriceMonthlyPay'] as const;
type AvitoPayoutFrequency = typeof AVITO_PAYOUT_FREQUENCY_POPUP_IDS[number];

const AVITO_BONUSES_ALLOWED = [
  'Униформа',
  'Проживание',
  'Медицинская страховка',
  'Питание',
  'Оплата бензина',
  'Парковка',
  'Зоны отдыха',
  'Транспорт до работы',
  'Скидки в компании',
  'Подарки детям на праздники',
  'Оплата мобильной связи',
  'Обучение',
  'Компенсация проезда с работы',
  'КАСКО',
  'Смартфон',
  'Услуги шиномонтажа',
] as const;

type AvitoBonusLabel = typeof AVITO_BONUSES_ALLOWED[number];

const AVITO_BONUS_ID_TO_LABEL: Record<string, AvitoBonusLabel> = {
  uniform: 'Униформа',
  housing: 'Проживание',
  medicalInsurance: 'Медицинская страховка',
  meals: 'Питание',
  fuelCompensation: 'Оплата бензина',
  parking: 'Парковка',
  restAreas: 'Зоны отдыха',
  transportToWork: 'Транспорт до работы',
  companyDiscounts: 'Скидки в компании',
  holidayGiftsForChildren: 'Подарки детям на праздники',
  mobileCompensation: 'Оплата мобильной связи',
  education: 'Обучение',
  travelFromWorkCompensation: 'Компенсация проезда с работы',
  kasko: 'КАСКО',
  smartphone: 'Смартфон',
  tireService: 'Услуги шиномонтажа',
};

function mapBonusesToAvito(rawBonuses: unknown): AvitoBonusLabel[] {
  if (rawBonuses == null) return [];

  const values: string[] = [];
  const pushValue = (v: unknown) => {
    if (v == null) return;
    if (Array.isArray(v)) {
      v.forEach(pushValue);
      return;
    }
    if (typeof v === 'object') {
      const obj = v as Record<string, unknown>;
      pushValue(obj.name);
      pushValue(obj.title);
      pushValue(obj.value);
      pushValue(obj.id);
      return;
    }
    const s = String(v).trim();
    if (!s) return;
    s.split(/[;|]+/).map((x) => x.trim()).filter(Boolean).forEach((x) => values.push(x));
  };

  pushValue(rawBonuses);

  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const aliases: Record<string, AvitoBonusLabel> = {
    'мед страховка': 'Медицинская страховка',
    'дмс': 'Медицинская страховка',
    'корпоративный транспорт': 'Транспорт до работы',
    'транспорт': 'Транспорт до работы',
  };

  const result: AvitoBonusLabel[] = [];
  values.forEach((item) => {
    const n = normalize(item);
    const fromId = AVITO_BONUS_ID_TO_LABEL[item.trim()];
    const fromAlias = aliases[n];
    const direct = AVITO_BONUSES_ALLOWED.find((label) => normalize(label) === n);
    const hit = fromId ?? fromAlias ?? direct;
    if (hit && !result.includes(hit)) result.push(hit);
  });

  return result;
}

/** Маппинг частоты выплаты в один из 4 id попапа Avito. */
function mapPayoutFrequencyToAvito(frequency: string | { id?: string | number; name?: string } | null | undefined): AvitoPayoutFrequency | null {
  if (frequency == null) return null;
  const direct = normalizeAvitoPayoutFrequencyIdForPopup(frequency)
  if (direct) return direct

  const raw = typeof frequency === 'string' ? frequency : (frequency.id != null ? String(frequency.id) : frequency.name != null ? String(frequency.name) : '');
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  let legacy: string | null = null;
  if (lower === 'monthlypay' || lower === 'monthly' || lower === 'month' || lower === 'за месяц' || lower === 'раз в месяц' || lower === 'monthly') legacy = 'monthlyPay';
  else if (lower === 'weeklypay' || lower === 'weekly' || lower === 'week' || lower === 'за неделю' || lower === 'раз в неделю') legacy = 'weeklyPay';
  else if (lower === 'biweeklypay' || lower === 'biweekly' || lower === 'twice_per_month' || lower === 'раз в две недели' || lower === 'два раза в месяц' || lower === 'дважды в месяц') legacy = 'biweeklyPay';
  else if (lower === 'thricemonthlypay' || lower === 'thricemonthly' || lower === 'thrice_per_month' || lower === 'три раза в месяц' || lower === 'трижды в месяц') legacy = 'thriceMonthlyPay';
  else if (lower === 'dailypay' || lower === 'daily' || lower === 'ежедневно' || lower === 'hourlypay' || lower === 'hourly' || lower === 'projectpay' || lower === 'per_project' || lower === 'за проект') legacy = 'monthlyPay';

  const n = Number(raw);
  if (!legacy && !isNaN(n)) {
    const byIndex = ['monthlyPay', 'weeklyPay', 'biweeklyPay', 'thriceMonthlyPay', 'monthlyPay', 'monthlyPay'];
    legacy = byIndex[n] ?? 'monthlyPay';
  }

  return normalizeAvitoPayoutFrequencyIdForPopup(legacy ?? s) || null;
}

/**
 * Преобразование адреса в формат Avito API
 * Avito использует строку с названием города/адреса
 */
function mapAddressToAvito(
  area: { id?: string | number; name?: string } | null | undefined,
  address?: { id?: string | number; name?: string; building?: string } | null | undefined,
): string | null {
  const building = address && typeof address === 'object' && address.building != null
    ? String(address.building).trim()
    : '';
  if (building) return building;

  const location = address || area;
  if (!location) return null;

  return location.name || String(location.id || '') || null;
}

/**
 * Преобразование профессии (профессиональной роли) в формат Avito API
 * Avito использует простое числовое поле profession (ID профессии)
 */
function mapProfessionToAvito(professionalRoles: Array<{ id?: string | number; name?: string } | null> | null | undefined): number | null {
  if (!professionalRoles || professionalRoles.length === 0 || !professionalRoles[0]) return null;
  
  const role = professionalRoles[0];
  if (!role || !role.id) return null;
  
  // Преобразуем в число
  const professionId = typeof role.id === 'number' ? role.id : Number(role.id);
  return isNaN(professionId) ? null : professionId;
}

/**
 * Преобразование ключевых навыков в формат Avito API
 * Avito принимает массив строк или объектов с name
 */
function mapKeySkillsToAvito(keySkills: Array<{ name: string }> | null | undefined): string[] {
  if (!keySkills || !Array.isArray(keySkills) || keySkills.length === 0) return [];
  
  return keySkills
    .filter(skill => skill && skill.name)
    .map(skill => skill.name);
}

/**
 * Основная функция маппинга данных вакансии из формы в формат Avito API
 * Согласно структуре данных Avito API для создания публикации
 */
export function mapVacancyToAvitoFormat(
  vacancyData: VacancyFormDataAvito
): any {
  const avitoData: any = {
    // Обязательные поля
    name: vacancyData.name || '',
    description: formatDescriptionForAvitoApi(vacancyData.description),
  };
  
  // Профессия (ID профессии из справочника Avito)
  const profession = mapProfessionToAvito(vacancyData.professional_roles);
  if (profession !== null) {
    avitoData.profession = profession;
  }
  
  // Адрес (строка с названием города)
  const address = mapAddressToAvito(vacancyData.area, vacancyData.address);
  if (address) {
    avitoData.address = address;
  }
  
  // Тип занятости
  if (vacancyData.employment_form) {
    const employment = mapEmploymentToAvito(vacancyData.employment_form);
    if (employment) {
      avitoData.employment = employment;
    }
  }
  
  // График работы: только enum [flyInFlyOut, flexible, shift, fixed, partTime, fullDay, remote, fiveDay, sixDay]
  const employmentId = vacancyData.employment_form?.id != null ? String(vacancyData.employment_form.id) : '';
  const scheduleMapped = employmentId === 'FLY_IN_FLY_OUT'
    ? { id: 'flyInFlyOut' as AvitoScheduleId }
    : mapScheduleToAvito(vacancyData.work_schedule_by_days);
  avitoData.schedule = { id: scheduleMapped?.id ?? DEFAULT_AVITO_SCHEDULE };
  
  // Опыт работы (объект с id)
  if (vacancyData.experience) {
    const experience = mapExperienceToAvito(vacancyData.experience);
    if (experience) {
      avitoData.experience = experience;
    }
  }
  
  // Удаленная работа (булево)
  if (vacancyData.workSpace !== undefined) {
    const isRemote = mapWorkSpaceToAvito(vacancyData.workSpace);
    if (isRemote !== null) {
      avitoData.is_remote = isRemote;
    }
  }
  
  // Зарплата: API Avito — salary (int64) или salary_base_range { from, to }, не объект в salary.
  const salaryRange =
    vacancyData.salary_range && (vacancyData.salary_range.from != null || vacancyData.salary_range.to != null)
      ? vacancyData.salary_range
      : resolveJoblySalaryRangeFromVacancy(vacancyData as Record<string, unknown>)
  if (salaryRange) {
    const salaryFields = buildAvitoSalaryApiFields({
      from: salaryRange.from,
      to: salaryRange.to,
    })
    if (salaryFields.salary != null) avitoData.salary = salaryFields.salary
    if (salaryFields.salary_base_range) avitoData.salary_base_range = salaryFields.salary_base_range
  }

  const paidPeriod = resolveAvitoPaidPeriodLabel(vacancyData)
  if (paidPeriod) avitoData.paid_period = paidPeriod
  
  // Частота выплаты: API Avito — enum [hourlyPay, dailyPay, biweeklyPay, weeklyPay, thriceMonthlyPay, monthlyPay]
  const payoutFreq = mapPayoutFrequencyToAvito(
    vacancyData.salary_range?.frequency?.id ?? vacancyData.salary_range?.frequency,
  );
  avitoData.payout_frequency = { id: payoutFreq ?? 'monthlyPay' };

  const grossFromForm = vacancyData.salary_range?.gross
  const grossResolved =
    typeof grossFromForm === 'boolean'
      ? grossFromForm
      : resolveJoblySalaryGrossFromVacancy(vacancyData as Record<string, unknown>)
  if (typeof grossResolved === 'boolean') {
    avitoData.taxes = mapJoblySalaryGrossToAvitoTaxes(grossResolved)
  }

  // Бонусы для сотрудников (Что получают сотрудники)
  const bonuses = mapBonusesToAvito(vacancyData.bonuses ?? vacancyData.avito_benefit);
  if (bonuses.length > 0) {
    avitoData.bonuses = bonuses;
  }
  
  // billing_type обязателен для Avito: enum [package, single, packageOrSingle], по умолчанию single
  const contractKeys = collectAvitoContractKeysFromForm(vacancyData);
  const billingFromContracts = resolveBillingTypeFromContractKeys(contractKeys);
  const billingType = billingFromContracts
    || mapBillingTypeToAvito(vacancyData.billing_type ?? vacancyData.billing_types);
  avitoData.billing_type = billingType ?? 'single';

  // registration_method — enum API: contract | gph_ip | gph_self_employed | gph_individual
  const registrationMethod = mapRegistrationMethodFromForm(vacancyData);
  if (registrationMethod.length > 0) {
    avitoData.registration_method = registrationMethod;
  }
  
  // business_area — int id из словаря Avito (без deprecated)
  const businessAreaCatalog = Array.isArray((vacancyData as { avito_business_area_catalog?: unknown }).avito_business_area_catalog)
    ? ((vacancyData as { avito_business_area_catalog: AvitoBusinessAreaCatalogRow[] }).avito_business_area_catalog)
    : undefined;
  const businessArea = resolveBusinessAreaIdForAvitoApi(vacancyData.industry?.id, businessAreaCatalog);
  if (businessArea != null) {
    avitoData.business_area = businessArea;
  }
  
  // Контакты — телефон должен быть из сотрудников/phones аккаунта Avito
  const contact = resolveAvitoContactFromForm(vacancyData);
  if (contact.employeeId) {
    avitoData.hierarchy = { employee_id: contact.employeeId };
  }
  if (contact.name || contact.phone || contact.email) {
    avitoData.contacts = {
      ...(contact.name ? { name: contact.name } : {}),
      ...(contact.email ? { email: contact.email } : {}),
      ...(contact.phone ? { phone: contact.phone } : {}),
    };
  } else if (vacancyData.contacts) {
    const c = vacancyData.contacts as Record<string, unknown>;
    const normalizedPhone = normalizeAvitoPhone(c.phone);
    avitoData.contacts = {
      ...(typeof c.name === 'string' && c.name.trim() !== '' ? { name: c.name.trim() } : {}),
      ...(typeof c.email === 'string' && c.email.trim() !== '' ? { email: c.email.trim() } : {}),
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
    };
  }
  
  // allow_messages
  if (vacancyData.allow_messages !== undefined) {
    avitoData.allow_messages = vacancyData.allow_messages;
  }
  
  // age (возрастные ограничения)
  if (vacancyData.age) {
    avitoData.age = vacancyData.age;
  }
  
  // age_preferences
  if (vacancyData.age_preferences && Array.isArray(vacancyData.age_preferences)) {
    avitoData.age_preferences = vacancyData.age_preferences;
  }
  
  // citizenship
  if (vacancyData.citizenship && Array.isArray(vacancyData.citizenship)) {
    avitoData.citizenship = vacancyData.citizenship;
  }
  
  // apply_processing — только only_with_resume | with_assistant (optional недопустим)
  const applyProcessing = resolveAvitoApplyProcessing(vacancyData);
  if (applyProcessing) {
    avitoData.apply_processing = applyProcessing;
  }

  if (avitoData.contacts && typeof avitoData.contacts === 'object' && Object.keys(avitoData.contacts).length === 0) {
    delete avitoData.contacts;
  }
  
  // Удаляем null и undefined значения
  Object.keys(avitoData).forEach(key => {
    if (avitoData[key] === null || avitoData[key] === undefined) {
      delete avitoData[key];
    }
  });
  
  return avitoData;
}

/**
 * Нормализация payload для Avito API: поля, которые API ожидает как int64/number,
 * должны быть числами, не строками (иначе ошибка "cannot unmarshal string into Go struct field ... of type int64").
 */
export function ensureAvitoPayloadTypes(payload: any): any {
  const out = { ...payload };
  if (out.profession !== undefined && out.profession !== null) {
    out.profession = typeof out.profession === 'number' ? out.profession : Number(out.profession);
    if (isNaN(out.profession)) delete out.profession;
  }
  if (out.business_area !== undefined && out.business_area !== null) {
    const normalizedBa = resolveBusinessAreaIdForAvitoApi(out.business_area);
    if (normalizedBa != null) out.business_area = normalizedBa;
    else delete out.business_area;
  }
  // salary: только int64; legacy-объект { from, to } → salary_base_range
  if (out.salary != null && typeof out.salary === 'object') {
    const legacy = buildAvitoSalaryApiFields({
      from: (out.salary as { from?: number }).from,
      to: (out.salary as { to?: number }).to,
    })
    delete out.salary
    if (legacy.salary != null) out.salary = legacy.salary
    if (legacy.salary_base_range) {
      out.salary_base_range = {
        ...(out.salary_base_range && typeof out.salary_base_range === 'object' ? out.salary_base_range : {}),
        ...legacy.salary_base_range,
      }
    }
  } else if (out.salary != null && out.salary !== '') {
    const n = Math.floor(Number(out.salary))
    if (Number.isFinite(n) && n > 0) out.salary = n
    else delete out.salary
  }
  if (out.salary_base_range && typeof out.salary_base_range === 'object') {
    const sr = out.salary_base_range as { from?: number; to?: number; currency?: unknown }
    const normalized = buildAvitoSalaryApiFields({ from: sr.from, to: sr.to })
    if (normalized.salary_base_range) out.salary_base_range = normalized.salary_base_range
    else delete out.salary_base_range
  }
  // payout_frequency.id — только enum; при невалидном значении подставляем monthlyPay
  if (out.payout_frequency != null && typeof out.payout_frequency === 'object') {
    const mapped = mapPayoutFrequencyToAvito(out.payout_frequency.id ?? out.payout_frequency);
    out.payout_frequency = { id: mapped ?? 'monthlyPay' };
  }
  // billing_type — всегда одна из строк enum; по умолчанию 'single'
  const mappedBilling = isAvitoBillingType(out.billing_type) ? out.billing_type : mapBillingTypeToAvito(out.billing_type);
  out.billing_type = mappedBilling ?? 'single';
  // schedule.id — только enum; при невалидном подставляем fullDay
  const scheduleId = normalizeScheduleId(out.schedule);
  out.schedule = { id: scheduleId };
  const ap = out.apply_processing as { apply_type?: unknown } | undefined;
  if (ap != null) {
    const t = ap.apply_type != null ? String(ap.apply_type).trim() : '';
    if (!AVITO_APPLY_TYPES.has(t)) {
      delete out.apply_processing;
    }
  }
  if (Array.isArray(out.registration_method)) {
    const normalizedRm: string[] = [];
    for (const item of out.registration_method) {
      const api = normalizeAvitoContractKeyToApi(String(item ?? ''));
      if (api && !normalizedRm.includes(api)) normalizedRm.push(api);
    }
    if (normalizedRm.length > 0) out.registration_method = normalizedRm;
    else delete out.registration_method;
  }
  return out;
}
