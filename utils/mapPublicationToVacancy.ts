import type { Vacancy } from '@/types/vacancy';
import { 
  HH_EMPLOYMENT_TYPES, 
  HH_EDUCATION_LAVEL, 
  HH_WORK_SCHEDULE_BY_DAYS 
} from '@/src/constants';
import schedule from '~/src/data/work-schedule.json';
import experience from '~/src/data/experience.json';
import education from '~/src/data/education.json';

/**
 * Интерфейс публикации из hh.ru API
 */
interface HhPublication {
  id?: string | number;
  name?: string;
  description?: string;
  requirement?: string;
  responsibility?: string;
  employment?: { id: string; name: string } | null;
  work_schedule?: { id: string; name: string } | null;
  work_schedule_by_days?: { id: string; name: string } | null;
  experience?: { id: string; name: string } | null;
  education?: { id: string; name: string } | null;
  salary?: { from?: number; to?: number; currency?: string } | null;
  salary_range?: { from?: number; to?: number; currency?: string } | null;
  area?: { id?: string | number; name?: string } | null;
  areas?: Array<{ id?: string | number; name?: string }>;
  professional_roles?: Array<{ id: string | number; name?: string }>;
  key_skills?: Array<{ id?: number; name?: string }>;
  phrases?: number[];
  work_space?: string;
  driver_license_types?: any[];
  [key: string]: any;
}

/**
 * Обратный маппинг типа занятости из формата hh.ru в строку формы
 */
function mapEmploymentFromHh(employment: { id: string; name: string } | null | undefined): string | undefined {
  if (!employment || !employment.id) return undefined;
  
  const mapped = HH_EMPLOYMENT_TYPES.find(item => item.id === employment.id);
  return mapped ? mapped.siteName : employment.name;
}

/**
 * Обратный маппинг графика работы из формата hh.ru в строку формы
 */
function mapScheduleFromHh(scheduleHh: { id: string; name: string } | null | undefined): string | undefined {
  if (!scheduleHh || !scheduleHh.id) return undefined;
  
  // Маппинг ID hh.ru на названия графиков
  const scheduleMap: Record<string, string> = {
    'FULL_DAY': 'Полный',
    'SHIFT': 'Сменный',
    'FLEXIBLE': 'Свободный',
    'REMOTE': 'Удаленная работа',
    'FLY_IN_FLY_OUT': 'Вахтовый метод',
  };
  
  const scheduleName = scheduleMap[scheduleHh.id];
  if (scheduleName) {
    // Проверяем, есть ли такое название в JSON
    const scheduleItem = schedule.find((item: any) => item.name === scheduleName);
    return scheduleItem ? scheduleName : scheduleHh.name;
  }
  
  return scheduleHh.name;
}

/**
 * Обратный маппинг опыта работы из формата hh.ru в строку формы
 */
function mapExperienceFromHh(experienceHh: { id: string; name: string } | null | undefined): string | undefined {
  if (!experienceHh || !experienceHh.id) return undefined;
  
  // Маппинг ID hh.ru на названия опыта
  const experienceMap: Record<string, string> = {
    'noExperience': 'Нет опыта',
    'between1And3': 'От 1 до 3 лет',
    'between3And6': 'От 3 до 6 лет',
    'moreThan6': 'От 6 лет',
  };
  
  const experienceName = experienceMap[experienceHh.id];
  if (experienceName) {
    // Проверяем, есть ли такое название в JSON
    const expItem = experience.find((item: any) => item.name === experienceName);
    return expItem ? experienceName : experienceHh.name;
  }
  
  return experienceHh.name;
}

/**
 * Обратный маппинг образования из формата hh.ru в строку формы
 */
function mapEducationFromHh(educationHh: { id: string; name: string } | null | undefined): string | undefined {
  if (!educationHh || !educationHh.id) return undefined;
  
  const eduItem = HH_EDUCATION_LAVEL.find(item => item.id === educationHh.id);
  if (eduItem) {
    // Маппинг ID hh.ru на названия образования
    const educationMap: Record<string, string> = {
      'higher': 'Высшее',
      'unfinished_higher': 'Не полное высшее',
      'special_secondary': 'Среднее специальное',
      'secondary': 'Среднее',
    };
    
    const educationName = educationMap[educationHh.id];
    if (educationName) {
      const eduJsonItem = education.find((item: any) => item.name === educationName);
      return eduJsonItem ? educationName : eduItem.name;
    }
  }
  
  return educationHh.name;
}

/**
 * Обратный маппинг места работы из формата hh.ru в число формы
 */
function mapWorkSpaceFromHh(workSpace: string | number | undefined): number | undefined {
  if (!workSpace) return undefined;
  
  // 1 - Офис, 2 - Гибрид, 3 - Удаленно
  const workSpaceMap: Record<string, number> = {
    '1': 1, // Офис
    '2': 2, // Гибрид
    '3': 3, // Удаленно
  };
  
  return workSpaceMap[String(workSpace)] || 1;
}

/**
 * Обратный маппинг валюты из формата hh.ru в строку формы
 */
function mapCurrencyFromHh(currency: string | undefined): string | undefined {
  if (!currency) return undefined;
  
  const currencyMap: Record<string, string> = {
    'RUR': 'RUB (рубль)',
    'RUB': 'RUB (рубль)',
    'USD': 'USD (доллар)',
    'EUR': 'EUR (евро)',
  };
  
  return currencyMap[currency] || 'RUB (рубль)';
}

/**
 * Преобразование локации из формата hh.ru в строку
 */
function mapLocationFromHh(area: { name?: string } | null | undefined, areas?: Array<{ name?: string }>): string | undefined {
  if (area && area.name) {
    return area.name;
  }
  
  if (areas && areas.length > 0 && areas[0].name) {
    return areas[0].name;
  }
  
  return undefined;
}

/**
 * Преобразование фраз (ключевых слов) из формата hh.ru
 */
function mapPhrasesFromHh(keySkills?: Array<{ id?: number; name?: string }>, phrases?: number[]): string | number[] | undefined {
  if (keySkills && keySkills.length > 0) {
    // Если есть названия, возвращаем массив названий
    const names = keySkills.map(skill => skill.name).filter(Boolean);
    if (names.length > 0) {
      return names.join(', ');
    }
    // Иначе возвращаем массив ID
    const ids = keySkills.map(skill => skill.id).filter((id): id is number => typeof id === 'number');
    if (ids.length > 0) {
      return ids;
    }
  }
  
  if (phrases && phrases.length > 0) {
    return phrases;
  }
  
  return undefined;
}

/**
 * Преобразование professional_roles в specializations
 */
function mapSpecializationsFromHh(professionalRoles?: Array<{ id: string | number; name?: string }>): string | undefined {
  if (!professionalRoles || professionalRoles.length === 0) return undefined;
  
  const names = professionalRoles
    .map(role => role.name)
    .filter(Boolean) as string[];
  
  return names.length > 0 ? names.join(', ') : undefined;
}

/**
 * Основная функция маппинга данных публикации из hh.ru в формат вакансии для БД
 */
export function mapHhPublicationToVacancy(
  publication: any,
  currentVacancyId?: number
): Partial<Vacancy> {
  // Формируем описание из нескольких полей, если нужно
  let description = publication.description || '';
  if (publication.requirement || publication.responsibility) {
    const parts: string[] = [];
    if (publication.responsibility) parts.push(`Обязанности:\n${publication.responsibility}`);
    if (publication.requirement) parts.push(`Требования:\n${publication.requirement}`);
    if (parts.length > 0) {
      description = parts.join('\n\n');
    }
  }

  // Определяем зарплату
  const salary = publication.salary || publication.salary_range;
  
  // Преобразуем зарплату в строки (требование валидации)
  const salaryFrom = salary?.from !== undefined && salary?.from !== null ? String(salary.from) : undefined;
  const salaryTo = salary?.to !== undefined && salary?.to !== null ? String(salary.to) : undefined;
  
  // Обрезаем строки до максимальной длины (требование валидации)
  const name = (publication.name || '').substring(0, 255);
  
  // Если описание слишком короткое, добавляем заглушку
  let finalDescription = description;
  if (!finalDescription || finalDescription.length < 3) {
    finalDescription = `${finalDescription || ''} Импортировано с ${publication.name || 'платформы'}`.trim();
  }
  // Обрезаем до максимума, но не меньше 3 символов
  if (finalDescription.length > 255) {
    finalDescription = finalDescription.substring(0, 255);
  }
  
  // Преобразуем phrases в правильный формат
  const phrasesData = mapPhrasesFromHh(publication.key_skills, publication.phrases);
  const phrasesFormatted: string | undefined = typeof phrasesData === 'string' 
    ? phrasesData 
    : Array.isArray(phrasesData) 
      ? phrasesData.join(', ') 
      : undefined;
  
  const vacancyData: any = {
    name: name || 'Импортированная вакансия',
    description: finalDescription,
    salary_from: salaryFrom,
    salary_to: salaryTo,
    currency: mapCurrencyFromHh(salary?.currency)?.substring(0, 255),
    employment: mapEmploymentFromHh(publication.employment)?.substring(0, 255),
    schedule: mapScheduleFromHh(publication.work_schedule_by_days || publication.work_schedule)?.substring(0, 255),
    experience: mapExperienceFromHh(publication.experience)?.substring(0, 255),
    education: mapEducationFromHh(publication.education)?.substring(0, 255),
    place: mapWorkSpaceFromHh(publication.work_space),
    location: mapLocationFromHh(publication.area, publication.areas)?.substring(0, 255),
    specializations: mapSpecializationsFromHh(publication.professional_roles)?.substring(0, 255),
    phrases: phrasesFormatted,
    status: 'draft', // По умолчанию черновик для импортированных вакансий
  };

  return vacancyData;
}

/**
 * Маппинг данных публикации из avito.ru в формат вакансии для БД
 * TODO: Реализовать после изучения структуры данных avito.ru API
 */
export function mapAvitoPublicationToVacancy(
  publication: any,
  currentVacancyId?: number
): Partial<Vacancy> {
  // TODO: Реализовать маппинг для avito.ru
  // Пока возвращаем базовую структуру
  const vacancyData: Partial<Vacancy> = {
    name: publication.title || publication.name || '',
    description: publication.description || '',
    status: 'draft',
  };

  return vacancyData;
}

/**
 * Маппинг названия платформы в platform_id
 * TODO: В будущем получать через API из таблицы platforms
 * 
 * Примечание: ID платформ должны соответствовать ID в таблице platforms на бэкенде
 * Если ID отличаются, нужно обновить маппинг или получать через API
 */
export function getPlatformId(platformName: string): number | undefined {
  const platformMap: Record<string, number> = {
    'hh.ru': 1,      // Предполагаемый ID для hh.ru
    'avito.ru': 2,   // Предполагаемый ID для avito.ru
    'rabota.ru': 3,  // Предполагаемый ID для rabota.ru
    'superjob': 4,   // Предполагаемый ID для superjob
    'superjob.ru': 4, // Альтернативное название
  };
  
  const platformId = platformMap[platformName];
  if (!platformId) {
    console.warn(`Неизвестная платформа: ${platformName}. Доступные: ${Object.keys(platformMap).join(', ')}`);
  }
  
  return platformId;
}

/**
 * Универсальная функция маппинга публикации в вакансию
 */
export function mapPublicationToVacancy(
  publication: any,
  platform: 'hh.ru' | 'avito.ru' | 'rabota.ru',
  currentVacancyId?: number,
  platformId?: number
): any {
  let vacancyData: any;
  
  if (platform === 'hh.ru') {
    vacancyData = mapHhPublicationToVacancy(publication, currentVacancyId);
  } else if (platform === 'avito.ru') {
    vacancyData = mapAvitoPublicationToVacancy(publication, currentVacancyId);
  } else if (platform === 'rabota.ru') {
    // rabota.ru имеет такую же структуру данных как hh.ru
    vacancyData = mapHhPublicationToVacancy(publication, currentVacancyId);
  } else {
    throw new Error(`Маппинг для платформы ${platform} не поддерживается`);
  }
  
  // Добавляем platform_id (приоритет у переданного параметра, иначе определяем по названию)
  const finalPlatformId = platformId !== undefined ? platformId : getPlatformId(platform);
  if (finalPlatformId !== undefined) {
    vacancyData.platform_id = finalPlatformId;
    console.log(`Добавлен platform_id: ${finalPlatformId} для платформы: ${platform}`);
  } else {
    console.warn(`Не удалось определить platform_id для платформы: ${platform}. Доступные платформы: hh.ru, avito.ru, rabota.ru`);
  }
  
  // Добавляем base_id (base_vacancy_id) если есть текущая вакансия
  if (currentVacancyId !== undefined) {
    vacancyData.base_id = currentVacancyId;
    console.log(`Добавлен base_id: ${currentVacancyId}`);
    
    // Добавляем vacancy_platform_id если есть импортируемая вакансия
    if (publication.id !== undefined) {
      vacancyData.vacancy_platform_id = publication.id;
    }
  }


  return vacancyData;
}
