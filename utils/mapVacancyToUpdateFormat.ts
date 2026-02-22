/**
 * Маппинг данных вакансии из формы AddPublication в формат для обновления через API
 * Соответствует валидации на бэкенде
 */

export interface VacancyFormData {
  name?: string;
  description?: string;
  code?: string;
  professional_roles?: Array<{ id?: string | number; name?: string } | null>;
  industry?: { id?: string | number; name?: string; key?: string } | null;
  employment_form?: { id?: string; name?: string } | null;
  work_schedule_by_days?: { id?: string; name?: string } | Array<{ id?: string | number; name?: string } | null> | null;
  working_hours?: { id?: string; name?: string } | Array<{ id?: string | number; name?: string } | null> | null;
  experience?: { id?: string; name?: string } | null;
  education_level?: { id?: string; name?: string } | null;
  salary_range?: {
    from?: number | null;
    to?: number | null;
    currency?: { id?: string; name?: string } | string;
  };
  salary_type?: { id?: string; name?: string } | null;
  area?: { id?: string | number; name?: string } | null;
  address?: { id?: string | number; name?: string } | null;
  location?: string | null;
  workSpace?: string;
  executor_id?: number | null;
  executor_name?: string | null;
  executor_phone?: string | null;
  executor_email?: string | null;
  show_executor?: boolean | null;
  dateEnd?: string | null;
  [key: string]: any;
}

export interface UpdateVacancyData {
  name?: string;
  description?: string;
  dateEnd?: string | null;
  code?: string | null;
  specializations?: string | null;
  industry?: string | null;
  employment?: string | null;
  schedule?: string | null;
  experience?: string | null;
  education?: string | null;
  salary_type?: string | null;
  salary_from?: string | null;
  salary_to?: string | null;
  currency?: string | null;
  place?: number | null;
  location?: string | null;
  work_hours_per_day?: string | null;
  executor_id?: number | null;
  executor_name?: string | null;
  executor_phone?: string | null;
  executor_email?: string | null;
  show_executor?: boolean | null;
  platform_id?: number | null;
  base_id?: number | null;
  vacancy_platform_id?: number | null;
  status?: string | null;
}

/**
 * Преобразование объекта с id и name в строку (название)
 */
function mapObjectToString(obj: { id?: string | number; name?: string } | null | undefined, maxLength?: number): string | null {
  if (!obj) return null;
  
  const name = obj.name || String(obj.id || '');
  if (maxLength && name.length > maxLength) {
    return name.substring(0, maxLength);
  }
  return name || null;
}

/**
 * Преобразование массива объектов в строку через запятую
 */
function mapArrayToString(arr: Array<{ id?: string | number; name?: string } | null> | null | undefined, maxLength?: number): string | null {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
  
  const names = arr
    .filter(item => item !== null && item !== undefined)
    .map(item => item.name || String(item.id || ''))
    .filter(name => name);
  
  if (names.length === 0) return null;
  
  const result = names.join(', ');
  if (maxLength && result.length > maxLength) {
    return result.substring(0, maxLength);
  }
  return result;
}

/**
 * Преобразование workSpace в число (place)
 * '1' = офис, '2' = гибрид, '3' = удаленно
 */
function mapWorkSpaceToPlace(workSpace: string | undefined): number | null {
  if (!workSpace) return null;
  
  const place = Number(workSpace);
  return isNaN(place) ? null : place;
}

/**
 * Преобразование даты в формат d.m.Y
 */
function mapDateToFormat(date: string | null | undefined): string | null {
  if (!date) return null;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return null;
    
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch {
    return null;
  }
}

/**
 * Преобразование валюты в строку
 */
function mapCurrencyToString(currency: { id?: string; name?: string } | string | undefined): string | null {
  if (!currency) return null;
  
  if (typeof currency === 'string') {
    return currency.length > 255 ? currency.substring(0, 255) : currency;
  }
  
  const currencyStr = currency.name || currency.id || '';
  return currencyStr.length > 255 ? currencyStr.substring(0, 255) : currencyStr || null;
}

/**
 * Основная функция маппинга данных вакансии из формы в формат для обновления
 */
export function mapVacancyToUpdateFormat(formData: VacancyFormData): UpdateVacancyData {
  const updateData: UpdateVacancyData = {};
  
  // Обязательные поля
  if (formData.name) {
    updateData.name = formData.name.length > 255 ? formData.name.substring(0, 255) : formData.name;
  }
  
  if (formData.description) {
    updateData.description = formData.description;
  }
  
  // Опциональные поля
  if (formData.code !== undefined && formData.code !== null) {
    const codeStr = String(formData.code);
    updateData.code = codeStr.length > 255 ? codeStr.substring(0, 255) : codeStr;
  }
  
  // Специализации (из professional_roles)
  if (formData.professional_roles) {
    updateData.specializations = mapArrayToString(formData.professional_roles, 255);
  }
  
  // Отрасль (industry)
  if (formData.industry) {
    updateData.industry = mapObjectToString(formData.industry, 255);
  }
  
  // Тип занятости (employment)
  if (formData.employment_form) {
    updateData.employment = mapObjectToString(formData.employment_form, 255);
  }
  
  // График работы (schedule) — может быть объект или массив (MultiSelect)
  if (formData.work_schedule_by_days) {
    if (Array.isArray(formData.work_schedule_by_days)) {
      updateData.schedule = mapArrayToString(formData.work_schedule_by_days, 255);
    } else {
      updateData.schedule = mapObjectToString(formData.work_schedule_by_days, 255);
    }
  }

  // Рабочие часы в день (work_hours_per_day)
  if (formData.working_hours) {
    if (Array.isArray(formData.working_hours)) {
      updateData.work_hours_per_day = mapArrayToString(formData.working_hours, 255);
    } else {
      updateData.work_hours_per_day = mapObjectToString(formData.working_hours, 255);
    }
  }
  
  // Опыт работы (experience)
  if (formData.experience) {
    updateData.experience = mapObjectToString(formData.experience, 255);
  }
  
  // Образование (education)
  if (formData.education_level) {
    updateData.education = mapObjectToString(formData.education_level, 255);
  }
  
  // Тип зарплаты (salary_type)
  if (formData.salary_type) {
    const salaryTypeStr = mapObjectToString(formData.salary_type, 100);
    updateData.salary_type = salaryTypeStr;
  }
  
  // Зарплата (salary_from, salary_to)
  if (formData.salary_range) {
    if (formData.salary_range.from !== undefined && formData.salary_range.from !== null) {
      const salaryFrom = formData.salary_range.from;
      updateData.salary_from = String(salaryFrom);
    }
    if (formData.salary_range.to !== undefined && formData.salary_range.to !== null) {
      const salaryTo = formData.salary_range.to;
      updateData.salary_to = String(salaryTo);
    }
    
    // Валюта (currency)
    if (formData.salary_range.currency) {
      updateData.currency = mapCurrencyToString(formData.salary_range.currency);
    }
  }
  
  // Место работы (place) - из workSpace
  if (formData.workSpace) {
    updateData.place = mapWorkSpaceToPlace(formData.workSpace);
  }
  
  // Локация / город размещения (location) — из area, address или строки location
  const locationStr =
    formData.area?.name ||
    formData.address?.name ||
    (typeof formData.location === 'string' ? formData.location : null);
  if (locationStr) {
    updateData.location = locationStr.length > 255 ? locationStr.substring(0, 255) : locationStr;
  }
  
  // Контакты исполнителя
  if (formData.executor_id !== undefined && formData.executor_id !== null) {
    updateData.executor_id = Number(formData.executor_id);
  }
  
  if (formData.executor_name !== undefined && formData.executor_name !== null) {
    updateData.executor_name = formData.executor_name;
  }
  
  if (formData.executor_phone !== undefined && formData.executor_phone !== null) {
    // Проверка формата телефона +7XXXXXXXXXX
    const phoneStr = String(formData.executor_phone);
    if (/^\+7\d{10}$/.test(phoneStr)) {
      updateData.executor_phone = phoneStr;
    } else {
      // Попытка нормализовать телефон
      const normalized = phoneStr.replace(/\D/g, '');
      if (normalized.length === 11 && normalized.startsWith('7')) {
        updateData.executor_phone = `+${normalized}`;
      } else if (normalized.length === 10) {
        updateData.executor_phone = `+7${normalized}`;
      }
      // Если не удалось нормализовать, оставляем как есть (валидация на бэкенде)
    }
  }
  
  if (formData.executor_email !== undefined && formData.executor_email !== null) {
    updateData.executor_email = formData.executor_email;
  }
  
  if (formData.show_executor !== undefined && formData.show_executor !== null) {
    updateData.show_executor = Boolean(formData.show_executor);
  }
  
  // Дата окончания (dateEnd)
  if (formData.dateEnd) {
    updateData.dateEnd = mapDateToFormat(formData.dateEnd);
  }
  
  // Платформа и связанные ID (если есть в форме)
  if (formData.platform_id !== undefined && formData.platform_id !== null) {
    updateData.platform_id = Number(formData.platform_id);
  }
  
  if (formData.base_id !== undefined && formData.base_id !== null) {
    updateData.base_id = Number(formData.base_id);
  }
  
  if (formData.vacancy_platform_id !== undefined && formData.vacancy_platform_id !== null) {
    updateData.vacancy_platform_id = Number(formData.vacancy_platform_id);
  }
  
  // Статус (если есть)
  if (formData.status !== undefined && formData.status !== null) {
    updateData.status = String(formData.status);
  }
  
  return updateData;
}
