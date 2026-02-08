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

/**
 * Маппинг графика работы из формы в формат Avito API
 * Avito использует объект с id: fullDay, shift, flexible, remote, flyInFlyOut
 */
function mapScheduleToAvito(schedule: { id?: string; name?: string } | null | undefined): { id: string } | null {
  if (!schedule || !schedule.id) return null;
  
  // Маппинг формата hh.ru на формат Avito
  const scheduleMap: Record<string, string> = {
    'FULL_DAY': 'fullDay',
    'SHIFT': 'shift',
    'FLEXIBLE': 'flexible',
    'REMOTE': 'remote',
    'FLY_IN_FLY_OUT': 'flyInFlyOut',
  };
  
  const avitoId = scheduleMap[schedule.id];
  return avitoId ? { id: avitoId } : null;
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
  
  // График работы (объект с id)
  if (vacancyData.work_schedule_by_days) {
    const schedule = mapScheduleToAvito(vacancyData.work_schedule_by_days);
    if (schedule) {
      avitoData.schedule = schedule;
    }
  }
  
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
  
  // Зарплата (если указана)
  if (vacancyData.salary_range && (vacancyData.salary_range.from || vacancyData.salary_range.to)) {
    avitoData.salary = {
      from: vacancyData.salary_range.from || null,
      to: vacancyData.salary_range.to || null,
      currency: mapCurrencyToAvito(vacancyData.salary_range.currency),
    };
  }
  
  // Частота выплаты зарплаты (если указана)
  if (vacancyData.salary_range?.frequency?.id) {
    avitoData.payout_frequency = {
      id: vacancyData.salary_range.frequency.id
    };
  }
  
  // Дополнительные поля из vacancyData (если есть)
  // billing_type
  if (vacancyData.billing_type) {
    avitoData.billing_type = vacancyData.billing_type;
  }
  
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
