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
 */
export function mapAvitoPublicationToVacancy(
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

  // Определяем зарплату (avito может использовать salary или salary_range)
  const salary = publication.salary || publication.salary_range;
  
  // Преобразуем зарплату в строки (требование валидации)
  const salaryFrom = salary?.from !== undefined && salary?.from !== null ? String(salary.from) : undefined;
  const salaryTo = salary?.to !== undefined && salary?.to !== null ? String(salary.to) : undefined;
  
  // Обрезаем строки до максимальной длины (требование валидации)
  const name = (publication.title || publication.name || '').substring(0, 255);
  
  // Если описание слишком короткое, добавляем заглушку
  let finalDescription = description;
  if (!finalDescription || finalDescription.length < 3) {
    finalDescription = `${finalDescription || ''} Импортировано с ${publication.title || publication.name || 'платформы'}`.trim();
  }
  // Обрезаем до максимума, но не меньше 3 символов
  if (finalDescription.length > 255) {
    finalDescription = finalDescription.substring(0, 255);
  }
  
  // Преобразуем phrases в правильный формат
  const phrasesData = mapPhrasesFromAvito(publication.key_skills, publication.skills, publication.phrases);
  const phrasesFormatted: string | undefined = typeof phrasesData === 'string' 
    ? phrasesData 
    : Array.isArray(phrasesData) 
      ? phrasesData.join(', ') 
      : undefined;
  
  // Маппинг локации (avito может использовать address, location, area)
  const location = mapLocationFromAvito(publication.address, publication.location, publication.area, publication.areas);
  
  // Маппинг места работы (avito может использовать work_format, work_space)
  const place = mapWorkSpaceFromAvito(publication.work_format, publication.work_space);
  
  const vacancyData: any = {
    name: name || 'Импортированная вакансия',
    description: finalDescription,
    salary_from: salaryFrom,
    salary_to: salaryTo,
    currency: mapCurrencyFromAvito(salary?.currency)?.substring(0, 255),
    employment: mapEmploymentFromAvito(publication.employment, publication.employment_type)?.substring(0, 255),
    schedule: mapScheduleFromAvito(publication.work_schedule, publication.work_schedule_by_days)?.substring(0, 255),
    experience: mapExperienceFromAvito(publication.experience, publication.experience_level)?.substring(0, 255),
    education: mapEducationFromAvito(publication.education, publication.education_level)?.substring(0, 255),
    place: place,
    location: location?.substring(0, 255),
    specializations: mapSpecializationsFromAvito(publication.category, publication.professional_roles)?.substring(0, 255),
    phrases: phrasesFormatted,
    status: 'draft', // По умолчанию черновик для импортированных вакансий
  };

  return vacancyData;
}

/**
 * Маппинг типа занятости из формата avito.ru
 */
function mapEmploymentFromAvito(employment?: any, employmentType?: any): string | undefined {
  if (employment?.id || employment?.name) {
    return mapEmploymentFromHh(employment);
  }
  if (employmentType?.id || employmentType?.name) {
    return mapEmploymentFromHh(employmentType);
  }
  return undefined;
}

/**
 * Маппинг графика работы из формата avito.ru
 */
function mapScheduleFromAvito(schedule?: any, scheduleByDays?: any): string | undefined {
  if (scheduleByDays?.id || scheduleByDays?.name) {
    return mapScheduleFromHh(scheduleByDays);
  }
  if (schedule?.id || schedule?.name) {
    return mapScheduleFromHh(schedule);
  }
  return undefined;
}

/**
 * Маппинг опыта работы из формата avito.ru
 */
function mapExperienceFromAvito(experience?: any, experienceLevel?: any): string | undefined {
  if (experience?.id || experience?.name) {
    return mapExperienceFromHh(experience);
  }
  if (experienceLevel?.id || experienceLevel?.name) {
    return mapExperienceFromHh(experienceLevel);
  }
  return undefined;
}

/**
 * Маппинг образования из формата avito.ru
 */
function mapEducationFromAvito(education?: any, educationLevel?: any): string | undefined {
  if (education?.id || education?.name) {
    return mapEducationFromHh(education);
  }
  if (educationLevel?.id || educationLevel?.name) {
    return mapEducationFromHh(educationLevel);
  }
  return undefined;
}

/**
 * Маппинг места работы из формата avito.ru
 */
function mapWorkSpaceFromAvito(workFormat?: any, workSpace?: string | number): number | undefined {
  if (workSpace) {
    return mapWorkSpaceFromHh(workSpace);
  }
  // avito может использовать work_format как массив или объект
  if (Array.isArray(workFormat) && workFormat.length > 0) {
    // Если есть удаленная работа, возвращаем 3
    const hasRemote = workFormat.some((f: any) => f?.id === 'remote' || f?.name?.toLowerCase().includes('удален'));
    if (hasRemote) return 3;
    // Если есть гибрид, возвращаем 2
    const hasHybrid = workFormat.some((f: any) => f?.id === 'hybrid' || f?.name?.toLowerCase().includes('гибрид'));
    if (hasHybrid) return 2;
    // По умолчанию офис
    return 1;
  }
  if (workFormat?.id === 'remote' || workFormat?.name?.toLowerCase().includes('удален')) {
    return 3;
  }
  if (workFormat?.id === 'hybrid' || workFormat?.name?.toLowerCase().includes('гибрид')) {
    return 2;
  }
  return 1; // По умолчанию офис
}

/**
 * Маппинг валюты из формата avito.ru
 */
function mapCurrencyFromAvito(currency?: string): string | undefined {
  if (!currency) return undefined;
  return mapCurrencyFromHh(currency);
}

/**
 * Маппинг локации из формата avito.ru
 */
function mapLocationFromAvito(
  address?: any,
  location?: any,
  area?: { name?: string } | null | undefined,
  areas?: Array<{ name?: string }>
): string | undefined {
  // Приоритет: address > location > area > areas
  if (address) {
    if (typeof address === 'string') {
      return address;
    }
    if (address.name) {
      return address.name;
    }
    if (address.city) {
      return address.city;
    }
  }
  
  if (location) {
    if (typeof location === 'string') {
      return location;
    }
    if (location.name) {
      return location.name;
    }
  }
  
  return mapLocationFromHh(area, areas);
}

/**
 * Маппинг фраз/навыков из формата avito.ru
 */
function mapPhrasesFromAvito(
  keySkills?: Array<{ id?: number; name?: string }>,
  skills?: string[] | Array<{ id?: number; name?: string }>,
  phrases?: number[]
): string | number[] | undefined {
  // Сначала пробуем key_skills
  if (keySkills && keySkills.length > 0) {
    const names = keySkills.map(skill => skill.name).filter(Boolean);
    if (names.length > 0) {
      return names.join(', ');
    }
    const ids = keySkills.map(skill => skill.id).filter((id): id is number => typeof id === 'number');
    if (ids.length > 0) {
      return ids;
    }
  }
  
  // Затем пробуем skills (может быть массив строк или объектов)
  if (skills && skills.length > 0) {
    if (typeof skills[0] === 'string') {
      return (skills as string[]).join(', ');
    }
    // Если это объекты
    const skillNames = (skills as Array<{ name?: string }>).map(skill => skill.name).filter(Boolean);
    if (skillNames.length > 0) {
      return skillNames.join(', ');
    }
  }
  
  // В конце пробуем phrases
  if (phrases && phrases.length > 0) {
    return phrases;
  }
  
  return undefined;
}

/**
 * Маппинг специализаций из формата avito.ru
 */
function mapSpecializationsFromAvito(
  category?: any,
  professionalRoles?: Array<{ id: string | number; name?: string }>
): string | undefined {
  // Сначала пробуем professional_roles (если есть)
  if (professionalRoles && professionalRoles.length > 0) {
    return mapSpecializationsFromHh(professionalRoles);
  }
  
  // Затем пробуем category
  if (category) {
    if (typeof category === 'string') {
      return category;
    }
    if (category.name) {
      return category.name;
    }
    if (Array.isArray(category) && category.length > 0) {
      const names = category.map((cat: any) => cat.name || cat).filter(Boolean);
      if (names.length > 0) {
        return names.join(', ');
      }
    }
  }
  
  return undefined;
}

/**
 * Маппинг данных публикации из rabota.ru в формат вакансии для БД
 */
export function mapRabotaPublicationToVacancy(
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

  // Определяем зарплату (rabota использует salary)
  const salary = publication.salary || publication.salary_range;
  
  // Преобразуем зарплату в строки (требование валидации)
  const salaryFrom = salary?.from !== undefined && salary?.from !== null ? String(salary.from) : undefined;
  const salaryTo = salary?.to !== undefined && salary?.to !== null ? String(salary.to) : undefined;
  
  // Обрезаем строки до максимальной длины (требование валидации)
  const name = (publication.title || publication.name || '').substring(0, 255);
  
  // Если описание слишком короткое, добавляем заглушку
  let finalDescription = description;
  if (!finalDescription || finalDescription.trim().length < 3) {
    finalDescription = `${finalDescription || ''} Импортировано с платформы rabota.ru`.trim();
  }
  // Не обрезаем описание до 255 символов, так как валидация требует минимум 3 символа
  // и описание может быть длинным (валидация не ограничивает максимальную длину для description)
  
  // Преобразуем skills в правильный формат (rabota использует skills как массив строк)
  const phrasesData = mapPhrasesFromRabota(publication.skills, publication.key_skills, publication.phrases);
  const phrasesFormatted: string | undefined = typeof phrasesData === 'string' 
    ? phrasesData 
    : Array.isArray(phrasesData) 
      ? phrasesData.join(', ') 
      : undefined;
  
  // Маппинг локации (rabota использует region или address)
  const location = mapLocationFromRabota(publication.region, publication.address, publication.area, publication.areas);
  
  // Маппинг места работы (rabota использует work_format_ids)
  const place = mapWorkSpaceFromRabota(publication.work_format_ids, publication.work_format, publication.work_space);
  
  // Маппинг типа занятости (rabota использует employment_type_id)
  const employment = mapEmploymentFromRabota(publication.employment_type, publication.employment_type_id, publication.employment);
  
  // Маппинг графика работы (rabota использует work_schedule_id)
  const schedule = mapScheduleFromRabota(publication.work_schedule, publication.work_schedule_id, publication.work_schedule_by_days);
  
  // Маппинг опыта работы (rabota использует experience_id)
  const experience = mapExperienceFromRabota(publication.experience, publication.experience_id, publication.experience_level);
  
  // Маппинг образования (rabota использует education_id)
  const education = mapEducationFromRabota(publication.education, publication.education_id, publication.education_level);
  
  // Маппинг специализаций (rabota использует profession_id)
  const specializations = mapSpecializationsFromRabota(publication.profession, publication.profession_id, publication.professional_roles);
  
  const vacancyData: any = {
    name: name || 'Импортированная вакансия',
    description: finalDescription,
    salary_from: salaryFrom,
    salary_to: salaryTo,
    currency: mapCurrencyFromRabota(salary?.currency)?.substring(0, 255),
    employment: employment?.substring(0, 255),
    schedule: schedule?.substring(0, 255),
    experience: experience?.substring(0, 255),
    education: education?.substring(0, 255),
    place: place,
    location: location?.substring(0, 255),
    specializations: specializations?.substring(0, 255),
    phrases: phrasesFormatted,
    status: 'draft', // По умолчанию черновик для импортированных вакансий
  };

  return vacancyData;
}

/**
 * Маппинг данных публикации из SuperJob в формат вакансии для БД
 * SuperJob API: id, profession { title }, town { title }, payment_from, payment_to, currency { code },
 * type_of_work { title }, place { title }, education { title }, experience { title }, candidat, work, vacancyRichText
 */
export function mapSuperjobPublicationToVacancy(
  publication: any,
  currentVacancyId?: number
): Partial<Vacancy> {
  const name = (publication.profession?.title ?? publication.name ?? publication.title ?? '').substring(0, 255);

  let description = publication.vacancyRichText ?? publication.description ?? '';
  if (publication.candidat || publication.work) {
    const parts: string[] = [];
    if (publication.work) parts.push(`Обязанности:\n${publication.work}`);
    if (publication.candidat) parts.push(`Требования:\n${publication.candidat}`);
    if (parts.length > 0) {
      description = parts.join('\n\n');
    }
  }

  const salary = publication.salary ?? (publication.payment_from != null || publication.payment_to != null
    ? {
        from: publication.payment_from,
        to: publication.payment_to,
        currency: publication.currency?.code ?? publication.currency,
      }
    : null);

  const salaryFrom = salary?.from !== undefined && salary?.from !== null ? String(salary.from) : undefined;
  const salaryTo = salary?.to !== undefined && salary?.to !== null ? String(salary.to) : undefined;

  let finalDescription = description;
  if (!finalDescription || finalDescription.trim().length < 3) {
    finalDescription = `${finalDescription || ''} Импортировано с платформы superjob.ru`.trim();
  }

  const location = publication.town?.title ?? publication.town?.name ?? publication.area?.name ?? (typeof publication.town === 'string' ? publication.town : undefined);
  const place = mapWorkSpaceFromSuperjob(publication.place, publication.work_place);
  const employment = (publication.type_of_work?.title ?? publication.type_of_work?.name ?? publication.employment?.title)?.substring(0, 255);
  const schedule = (publication.schedule?.title ?? publication.schedule?.name)?.substring(0, 255);
  const experience = (publication.experience?.title ?? publication.experience?.name)?.substring(0, 255);
  const education = (publication.education?.title ?? publication.education?.name)?.substring(0, 255);
  const currency = mapCurrencyFromSuperjob(salary?.currency ?? publication.currency);
  const specializations = (publication.profession?.title ?? publication.catalogues?.[0]?.title)?.substring(0, 255);
  const phrasesData = publication.key_skills ?? publication.skills ?? publication.phrase;
  const phrasesFormatted = Array.isArray(phrasesData)
    ? phrasesData.map((s: any) => (typeof s === 'string' ? s : s?.title ?? s?.name)).filter(Boolean).join(', ')
    : (typeof phrasesData === 'string' ? phrasesData : undefined);

  const vacancyData: any = {
    name: name || 'Импортированная вакансия',
    description: finalDescription,
    salary_from: salaryFrom,
    salary_to: salaryTo,
    currency: currency?.substring(0, 255),
    employment: employment?.substring(0, 255),
    schedule: schedule?.substring(0, 255),
    experience: experience?.substring(0, 255),
    education: education?.substring(0, 255),
    place: place,
    location: location?.substring(0, 255),
    specializations: specializations?.substring(0, 255),
    phrases: phrasesFormatted,
    status: 'draft',
  };

  return vacancyData;
}

function mapWorkSpaceFromSuperjob(place?: any, workPlace?: string | number): number | undefined {
  if (workPlace) {
    return mapWorkSpaceFromHh(workPlace);
  }
  const title = place?.title ?? place?.name ?? (typeof place === 'string' ? place : '');
  if (!title) return 1;
  const lower = title.toLowerCase();
  if (lower.includes('удален') || lower.includes('remote') || lower.includes('дистанц')) return 3;
  if (lower.includes('гибрид') || lower.includes('hybrid')) return 2;
  return 1;
}

function mapCurrencyFromSuperjob(currency?: string | { code?: string }): string | undefined {
  if (!currency) return undefined;
  const code = typeof currency === 'object' ? currency?.code : currency;
  if (!code) return 'RUB (рубль)';
  const currencyMap: Record<string, string> = {
    'RUR': 'RUB (рубль)',
    'RUB': 'RUB (рубль)',
    'USD': 'USD (доллар)',
    'EUR': 'EUR (евро)',
  };
  return currencyMap[code] ?? 'RUB (рубль)';
}

/**
 * Маппинг типа занятости из формата rabota.ru
 */
function mapEmploymentFromRabota(employmentType?: any, employmentTypeId?: number, employment?: any): string | undefined {
  // Сначала пробуем объект employment_type
  if (employmentType?.id || employmentType?.name) {
    return mapEmploymentFromHh(employmentType);
  }
  // Затем пробуем employment (если есть)
  if (employment?.id || employment?.name) {
    return mapEmploymentFromHh(employment);
  }
  return undefined;
}

/**
 * Маппинг графика работы из формата rabota.ru
 */
function mapScheduleFromRabota(workSchedule?: any, workScheduleId?: number, scheduleByDays?: any): string | undefined {
  // Сначала пробуем объект work_schedule
  if (workSchedule?.id || workSchedule?.name) {
    return mapScheduleFromHh(workSchedule);
  }
  // Затем пробуем work_schedule_by_days
  if (scheduleByDays?.id || scheduleByDays?.name) {
    return mapScheduleFromHh(scheduleByDays);
  }
  return undefined;
}

/**
 * Маппинг опыта работы из формата rabota.ru
 */
function mapExperienceFromRabota(experience?: any, experienceId?: number, experienceLevel?: any): string | undefined {
  // Сначала пробуем объект experience
  if (experience?.id || experience?.name) {
    return mapExperienceFromHh(experience);
  }
  // Затем пробуем experience_level
  if (experienceLevel?.id || experienceLevel?.name) {
    return mapExperienceFromHh(experienceLevel);
  }
  return undefined;
}

/**
 * Маппинг образования из формата rabota.ru
 */
function mapEducationFromRabota(education?: any, educationId?: number, educationLevel?: any): string | undefined {
  // Сначала пробуем объект education
  if (education?.id || education?.name) {
    return mapEducationFromHh(education);
  }
  // Затем пробуем education_level
  if (educationLevel?.id || educationLevel?.name) {
    return mapEducationFromHh(educationLevel);
  }
  return undefined;
}

/**
 * Маппинг места работы из формата rabota.ru
 */
function mapWorkSpaceFromRabota(workFormatIds?: number[] | any[], workFormat?: any, workSpace?: string | number): number | undefined {
  // rabota использует work_format_ids как массив ID
  if (Array.isArray(workFormatIds) && workFormatIds.length > 0) {
    // Проверяем на удаленную работу
    const hasRemote = workFormatIds.some((id: any) => {
      const idValue = typeof id === 'object' ? id.id : id;
      return idValue === 3 || idValue === 'remote' || (typeof idValue === 'string' && idValue.toLowerCase().includes('remote'));
    });
    if (hasRemote) return 3;
    
    // Проверяем на гибрид
    const hasHybrid = workFormatIds.some((id: any) => {
      const idValue = typeof id === 'object' ? id.id : id;
      return idValue === 2 || idValue === 'hybrid' || (typeof idValue === 'string' && idValue.toLowerCase().includes('hybrid'));
    });
    if (hasHybrid) return 2;
    
    return 1; // По умолчанию офис
  }
  
  // Если есть объект work_format
  if (workFormat) {
    if (Array.isArray(workFormat)) {
      const hasRemote = workFormat.some((f: any) => f?.id === 3 || f?.id === 'remote' || f?.name?.toLowerCase().includes('удален'));
      if (hasRemote) return 3;
      const hasHybrid = workFormat.some((f: any) => f?.id === 2 || f?.id === 'hybrid' || f?.name?.toLowerCase().includes('гибрид'));
      if (hasHybrid) return 2;
      return 1;
    }
    if (workFormat.id === 3 || workFormat.id === 'remote' || workFormat.name?.toLowerCase().includes('удален')) {
      return 3;
    }
    if (workFormat.id === 2 || workFormat.id === 'hybrid' || workFormat.name?.toLowerCase().includes('гибрид')) {
      return 2;
    }
  }
  
  // Если есть work_space (как строка или число)
  if (workSpace) {
    return mapWorkSpaceFromHh(workSpace);
  }
  
  return 1; // По умолчанию офис
}

/**
 * Маппинг валюты из формата rabota.ru
 */
function mapCurrencyFromRabota(currency?: string): string | undefined {
  if (!currency) return undefined;
  return mapCurrencyFromHh(currency);
}

/**
 * Маппинг локации из формата rabota.ru
 */
function mapLocationFromRabota(
  region?: any,
  address?: any,
  area?: { name?: string } | null | undefined,
  areas?: Array<{ name?: string }>
): string | undefined {
  // Приоритет: region > address > area > areas
  if (region) {
    if (typeof region === 'string') {
      return region;
    }
    if (region.name) {
      return region.name;
    }
    if (region.title) {
      return region.title;
    }
  }
  
  if (address) {
    if (typeof address === 'string') {
      return address;
    }
    if (address.name) {
      return address.name;
    }
    if (address.city) {
      return address.city;
    }
  }
  
  return mapLocationFromHh(area, areas);
}

/**
 * Маппинг фраз/навыков из формата rabota.ru
 */
function mapPhrasesFromRabota(
  skills?: string[] | Array<{ id?: number; name?: string }>,
  keySkills?: Array<{ id?: number; name?: string }>,
  phrases?: number[]
): string | number[] | undefined {
  // rabota использует skills как массив строк
  if (skills && skills.length > 0) {
    if (typeof skills[0] === 'string') {
      return (skills as string[]).join(', ');
    }
    // Если это объекты
    const skillNames = (skills as Array<{ name?: string }>).map(skill => skill.name).filter(Boolean);
    if (skillNames.length > 0) {
      return skillNames.join(', ');
    }
  }
  
  // Затем пробуем key_skills
  if (keySkills && keySkills.length > 0) {
    const names = keySkills.map(skill => skill.name).filter(Boolean);
    if (names.length > 0) {
      return names.join(', ');
    }
    const ids = keySkills.map(skill => skill.id).filter((id): id is number => typeof id === 'number');
    if (ids.length > 0) {
      return ids;
    }
  }
  
  // В конце пробуем phrases
  if (phrases && phrases.length > 0) {
    return phrases;
  }
  
  return undefined;
}

/**
 * Маппинг специализаций из формата rabota.ru
 */
function mapSpecializationsFromRabota(
  profession?: any,
  professionId?: number,
  professionalRoles?: Array<{ id: string | number; name?: string }>
): string | undefined {
  // Сначала пробуем professional_roles (если есть)
  if (professionalRoles && professionalRoles.length > 0) {
    return mapSpecializationsFromHh(professionalRoles);
  }
  
  // Затем пробуем profession
  if (profession) {
    if (typeof profession === 'string') {
      return profession;
    }
    if (profession.name) {
      return profession.name;
    }
    if (profession.title) {
      return profession.title;
    }
  }
  
  return undefined;
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
  platform: 'hh.ru' | 'avito.ru' | 'rabota.ru' | 'superjob' | 'superjob.ru',
  currentVacancyId?: number,
  platformId?: number
): any {
  let vacancyData: any;

  const platformNorm = platform === 'superjob.ru' ? 'superjob' : platform;

  if (platform === 'hh.ru') {
    vacancyData = mapHhPublicationToVacancy(publication, currentVacancyId);
  } else if (platform === 'avito.ru') {
    vacancyData = mapAvitoPublicationToVacancy(publication, currentVacancyId);
  } else if (platform === 'rabota.ru') {
    vacancyData = mapRabotaPublicationToVacancy(publication, currentVacancyId);
  } else if (platformNorm === 'superjob') {
    vacancyData = mapSuperjobPublicationToVacancy(publication, currentVacancyId);
  } else {
    throw new Error(`Маппинг для платформы ${platform} не поддерживается`);
  }

  // Добавляем platform_id (приоритет у переданного параметра, иначе определяем по названию)
  const finalPlatformId = platformId !== undefined ? platformId : getPlatformId(platformNorm);
  if (finalPlatformId !== undefined) {
    vacancyData.platform_id = finalPlatformId;
    console.log(`Добавлен platform_id: ${finalPlatformId} для платформы: ${platform}`);
  } else {
    console.warn(`Не удалось определить platform_id для платформы: ${platform}. Доступные платформы: hh.ru, avito.ru, rabota.ru, superjob`);
  }
  
  // Добавляем base_id (base_vacancy_id) если есть текущая вакансия
  if (currentVacancyId !== undefined) {
    vacancyData.base_id = currentVacancyId;
    console.log(`Добавлен base_id: ${currentVacancyId}`);
  }
  
  // Добавляем vacancy_platform_id если есть импортируемая вакансия
  // Для rabota.ru ID может быть в разных форматах
  const publicationId = publication.id || publication.vacancy_id || publication.vacancyId;
  if (publicationId !== undefined && publicationId !== null) {
    vacancyData.vacancy_platform_id = String(publicationId);
    console.log(`Добавлен vacancy_platform_id: ${vacancyData.vacancy_platform_id} для платформы: ${platform}`);
  }


  return vacancyData;
}
