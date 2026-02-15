import type { DraftDataHh } from '@/types/platform';

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

/** Возвращает true, если значение — одно из допустимых для Avito billing_type */
function isAvitoBillingType(v: unknown): v is AvitoBillingType {
  return typeof v === 'string' && AVITO_BILLING_TYPE_ENUM.includes(v as AvitoBillingType);
}

/** Допустимые значения payout_frequency.id в API Avito */
const AVITO_PAYOUT_FREQUENCY_ENUM = ['hourlyPay', 'dailyPay', 'biweeklyPay', 'weeklyPay', 'thriceMonthlyPay', 'monthlyPay'] as const;
type AvitoPayoutFrequency = typeof AVITO_PAYOUT_FREQUENCY_ENUM[number];

/**
 * Маппинг частоты выплаты в формат Avito API.
 * API Avito: enum [hourlyPay, dailyPay, biweeklyPay, weeklyPay, thriceMonthlyPay, monthlyPay]
 */
function mapPayoutFrequencyToAvito(frequency: string | { id?: string | number; name?: string } | null | undefined): AvitoPayoutFrequency | null {
  if (frequency == null) return null;
  const raw = typeof frequency === 'string' ? frequency : (frequency.id != null ? String(frequency.id) : frequency.name != null ? String(frequency.name) : '');
  const s = String(raw).trim();
  if (!s) return null;
  const lower = s.toLowerCase();
  if (AVITO_PAYOUT_FREQUENCY_ENUM.includes(s as AvitoPayoutFrequency)) return s as AvitoPayoutFrequency;
  // Маппинг по id/названию (HH: monthly, weekly и т.д.; русские названия)
  if (lower === 'monthlypay' || lower === 'monthly' || lower === 'month' || lower === 'за месяц' || lower === 'раз в месяц') return 'monthlyPay';
  if (lower === 'weeklypay' || lower === 'weekly' || lower === 'week' || lower === 'за неделю') return 'weeklyPay';
  if (lower === 'dailypay' || lower === 'daily' || lower === 'day' || lower === 'за день') return 'dailyPay';
  if (lower === 'hourlypay' || lower === 'hourly' || lower === 'hour' || lower === 'за час') return 'hourlyPay';
  if (lower === 'biweeklypay' || lower === 'biweekly' || lower === 'раз в две недели') return 'biweeklyPay';
  if (lower === 'thricemonthlypay' || lower === 'thricemonthly' || lower === 'два раза в месяц') return 'thriceMonthlyPay';
  // Числовой id из формы (например HH_SALARY_FREQUENCY: 0–5)
  const n = Number(raw);
  if (!isNaN(n)) {
    const byIndex: AvitoPayoutFrequency[] = ['hourlyPay', 'dailyPay', 'weeklyPay', 'biweeklyPay', 'thriceMonthlyPay', 'monthlyPay'];
    return byIndex[n] ?? 'monthlyPay';
  }
  return null;
}

/**
 * Преобразование адреса в формат Avito API
 * Avito использует строку с названием города/адреса
 */
function mapAddressToAvito(area: { id?: string | number; name?: string } | null | undefined, address?: { id?: string | number; name?: string } | null | undefined): string | null {
  // Приоритет у address, затем area
  const location = address || area;
  if (!location) return null;
  
  // Возвращаем название города/адреса
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
    description: vacancyData.description || '',
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
  const scheduleMapped = mapScheduleToAvito(vacancyData.work_schedule_by_days);
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
  
  // Зарплата: по документации Avito — объект salary_range с полями from, to (integer, рубли в месяц)
  if (vacancyData.salary_range && (vacancyData.salary_range.from != null || vacancyData.salary_range.to != null)) {
    const from = vacancyData.salary_range.from != null ? Number(vacancyData.salary_range.from) : undefined;
    const to = vacancyData.salary_range.to != null ? Number(vacancyData.salary_range.to) : undefined;
    if (!isNaN(from as number) || !isNaN(to as number)) {
      avitoData.salary_range = {
        ...(from != null && !isNaN(from) ? { from: Math.floor(from) } : {}),
        ...(to != null && !isNaN(to) ? { to: Math.floor(to) } : {}),
      };
    }
  }
  
  // Частота выплаты: API Avito — enum [hourlyPay, dailyPay, biweeklyPay, weeklyPay, thriceMonthlyPay, monthlyPay]
  const payoutFreq = mapPayoutFrequencyToAvito(vacancyData.salary_range?.frequency?.id ?? vacancyData.salary_range?.frequency);
  avitoData.payout_frequency = { id: payoutFreq ?? 'monthlyPay' };
  
  // billing_type обязателен для Avito: enum [package, single, packageOrSingle], по умолчанию single
  const billingType = mapBillingTypeToAvito(vacancyData.billing_type ?? vacancyData.billing_types);
  avitoData.billing_type = billingType ?? 'single';
  
  // business_area (ID отрасли)
  if (vacancyData.industry?.id) {
    const businessArea = typeof vacancyData.industry.id === 'number' 
      ? vacancyData.industry.id 
      : Number(vacancyData.industry.id);
    if (!isNaN(businessArea)) {
      avitoData.business_area = businessArea;
    }
  }
  
  // Контакты
  if (vacancyData.contacts) {
    avitoData.contacts = vacancyData.contacts;
  } else if (vacancyData.executor_name || vacancyData.executor_phone || vacancyData.executor_email) {
    avitoData.contacts = {
      name: vacancyData.executor_name || '',
      phone: vacancyData.executor_phone || null,
      email: vacancyData.executor_email || null,
    };
  }
  
  // allow_messages
  if (vacancyData.allow_messages !== undefined) {
    avitoData.allow_messages = vacancyData.allow_messages;
  }
  
  // is_side_job
  if (vacancyData.is_side_job !== undefined) {
    avitoData.is_side_job = vacancyData.is_side_job;
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
  
  // apply_processing
  if (vacancyData.apply_processing) {
    avitoData.apply_processing = vacancyData.apply_processing;
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
    out.business_area = typeof out.business_area === 'number' ? out.business_area : Number(out.business_area);
    if (isNaN(out.business_area)) delete out.business_area;
  }
  // API Avito: salary_range — объект с from, to (integer)
  if (out.salary_range && typeof out.salary_range === 'object') {
    const sr = out.salary_range as { from?: number; to?: number };
    const from = sr.from != null ? Math.floor(Number(sr.from)) : undefined;
    const to = sr.to != null ? Math.floor(Number(sr.to)) : undefined;
    if (from != null && !isNaN(from)) (out.salary_range as any).from = from;
    if (to != null && !isNaN(to)) (out.salary_range as any).to = to;
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
  return out;
}
