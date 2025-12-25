import type { DraftDataHh } from '@/types/platform';
import { 
  HH_EMPLOYMENT_TYPES, 
  HH_EDUCATION_LAVEL, 
  HH_WORK_SCHEDULE_BY_DAYS 
} from '@/src/constants';
import schedule from '~/src/data/work-schedule.json';
import experience from '~/src/data/experience.json';
import education from '~/src/data/education.json';

/**
 * Интерфейс данных вакансии из InfoTab
 */
export interface VacancyFormData {
  name?: string;
  code?: string;
  description?: string;
  industry?: string;
  specializations?: string;
  employment?: string;
  schedule?: string;
  experience?: string;
  education?: string;
  salary_from?: number | null;
  salary_to?: number | null;
  currency?: string;
  place?: string | number;
  location?: string;
  executor_phone?: string;
  executor_email?: string;
  executor_name?: string;
  phrases?: string | number[];
  conditions?: any[];
  drivers?: any[];
}

/**
 * Маппинг типа занятости из формы в формат hh.ru
 */
function mapEmployment(employment: string | undefined): { id: string; name: string } | null {
  if (!employment) return null;
  
  const mapped = HH_EMPLOYMENT_TYPES.find(item => item.siteName === employment);
  return mapped ? { id: mapped.id, name: mapped.name } : null;
}

/**
 * Маппинг графика работы из формы в формат hh.ru
 */
function mapSchedule(scheduleValue: string | undefined): { id: string; name: string } | null {
  if (!scheduleValue) return null;
  
  // Получаем название графика из JSON
  const scheduleItem = schedule.find((item: any) => item.name === scheduleValue);
  if (!scheduleItem) {
    // Если не найдено в JSON, пытаемся найти по названию напрямую
    const scheduleMap: Record<string, string> = {
      'Полный': 'FULL_DAY',
      'Сменный': 'SHIFT',
      'Свободный': 'FLEXIBLE',
      'Удаленная работа': 'REMOTE',
      'Вахтовый метод': 'FLY_IN_FLY_OUT',
    };
    const hhScheduleId = scheduleMap[scheduleValue] || 'FLEXIBLE';
    return { id: hhScheduleId, name: scheduleValue };
  }
  
  // Маппинг названий графиков на формат hh.ru
  const scheduleMap: Record<string, string> = {
    'Полный': 'FULL_DAY',
    'Сменный': 'SHIFT',
    'Свободный': 'FLEXIBLE',
    'Удаленная работа': 'REMOTE',
    'Вахтовый метод': 'FLY_IN_FLY_OUT',
  };
  
  const hhScheduleId = scheduleMap[scheduleItem.name] || 'FLEXIBLE';
  return { id: hhScheduleId, name: scheduleItem.name };
}

/**
 * Маппинг опыта работы из формы в формат hh.ru
 */
function mapExperience(experienceValue: string | undefined): { id: string; name: string } | null {
  if (!experienceValue) return null;
  
  const expItem = experience.find((item: any) => item.name === experienceValue);
  if (!expItem) {
    // Если не найдено в JSON, пытаемся найти по названию напрямую
    const experienceMap: Record<string, string> = {
      'Нет опыта': 'noExperience',
      'От 1 до 3 лет': 'between1And3',
      'От 3 до 6 лет': 'between3And6',
      'От 6 лет': 'moreThan6',
    };
    const hhExpId = experienceMap[experienceValue];
    if (!hhExpId) return null;
    return { id: hhExpId, name: experienceValue };
  }
  
  // Маппинг опыта на формат hh.ru
  const experienceMap: Record<string, string> = {
    'Нет опыта': 'noExperience',
    'От 1 до 3 лет': 'between1And3',
    'От 3 до 6 лет': 'between3And6',
    'От 6 лет': 'moreThan6',
  };
  
  const hhExpId = experienceMap[expItem.name] || expItem.id;
  return { id: hhExpId, name: expItem.name };
}

/**
 * Маппинг образования из формы в формат hh.ru
 */
function mapEducation(educationValue: string | undefined): { id: string; name: string } | null {
  if (!educationValue) return null;
  
  const eduItem = education.find((item: any) => item.name === educationValue);
  
  // Маппинг образования на формат hh.ru
  const educationMap: Record<string, string | null> = {
    'Не имеет значения': null,
    'Высшее': 'higher',
    'Не полное высшее': 'unfinished_higher',
    'Среднее специальное': 'special_secondary',
    'Среднее': 'secondary',
  };
  
  const educationName = eduItem ? eduItem.name : educationValue;
  const hhEduId = educationMap[educationName];
  if (!hhEduId) return null;
  
  const hhEduItem = HH_EDUCATION_LAVEL.find(item => item.id === hhEduId);
  return hhEduItem ? { id: hhEduItem.id, name: hhEduItem.name } : null;
}

/**
 * Маппинг места работы (офис/удаленно) из формы в формат hh.ru
 */
function mapWorkSpace(place: string | number | undefined): string {
  if (!place) return '1';
  
  // 1 - Офис, 2 - Гибрид, 3 - Удаленно
  const placeMap: Record<string, string> = {
    '1': '1', // Офис
    '2': '2', // Гибрид
    '3': '3', // Удаленно
  };
  
  return placeMap[String(place)] || '1';
}

/**
 * Маппинг валюты из формы в формат hh.ru
 */
function mapCurrency(currency: string | undefined): string {
  if (!currency) return 'RUR';
  
  const currencyMap: Record<string, string> = {
    'RUB (рубль)': 'RUR',
    'USD (доллар)': 'USD',
    'EUR (евро)': 'EUR',
  };
  
  return currencyMap[currency] || 'RUR';
}

/**
 * Преобразование локации в массив areas для hh.ru
 * hh.ru требует массив объектов с id региона
 */
function mapLocation(location: string | undefined): Array<{ id: string | number }> {
  if (!location) return [{ id: '1' }]; // По умолчанию Москва
  
  // Здесь должна быть логика преобразования названия города в id региона hh.ru
  // Пока возвращаем дефолтное значение
  // TODO: Реализовать поиск id региона по названию через API hh.ru
  return [{ id: '1' }];
}

/**
 * Преобразование фраз (ключевых слов) в массив id для hh.ru
 */
function mapPhrases(phrases: string | number[] | undefined): number[] {
  if (!phrases) return [];
  
  if (Array.isArray(phrases)) {
    return phrases.filter((id): id is number => typeof id === 'number');
  }
  
  // Если phrases - строка, нужно разбить и найти id
  // TODO: Реализовать поиск id фраз по названиям
  return [];
}

/**
 * Основная функция маппинга данных вакансии из формы в формат hh.ru API
 */
export function mapVacancyToHhFormat(
  vacancyData: VacancyFormData,
  industryData?: any,
  professionalRoleData?: any
): DraftDataHh {
  const hhData: DraftDataHh = {
    name: vacancyData.name || '',
    code: vacancyData.code || '',
    description: vacancyData.description || '',
    days: '30', // По умолчанию 30 дней публикации
    workSpace: mapWorkSpace(vacancyData.place),
    areas: mapLocation(vacancyData.location),
    professional_roles: professionalRoleData 
      ? [{ id: professionalRoleData.id, ...professionalRoleData }]
      : [null],
    employment_form: mapEmployment(vacancyData.employment),
    work_schedule_by_days: mapSchedule(vacancyData.schedule) as any,
    education_level: mapEducation(vacancyData.education),
    experience: mapExperience(vacancyData.experience),
    phrases: mapPhrases(vacancyData.phrases),
    salary_range: {},
    industry: industryData || null,
    platform: null,
    billing_types: null,
    driver_license_types: null,
  };

  // Настройка зарплаты
  if (vacancyData.salary_from || vacancyData.salary_to) {
    hhData.salary_range = {
      from: vacancyData.salary_from || null,
      to: vacancyData.salary_to || null,
      currency: mapCurrency(vacancyData.currency),
      gross: true, // По умолчанию "до вычета налогов"
    };
  }

  // Маппинг водительских прав
  if (vacancyData.drivers && vacancyData.drivers.length > 0) {
    // TODO: Реализовать маппинг водительских прав
    hhData.driver_license_types = null;
  }

  return hhData;
}

