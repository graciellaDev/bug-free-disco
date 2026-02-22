import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";

/**
 * Получение профиля пользователя Rabota.ru
 * @returns Профиль пользователя
 */
export const getProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    // Используем fetch напрямую для подавления ошибки 404 в консоли
    const response = await fetch(`${config.public.apiBase}/rabota/profile`, {
      method: 'GET',
      headers: createAuthHeaders(serverToken, userToken),
    });

    if (!response.ok) {
      if (response.status === 404) {
        // 404 - пользователь еще не авторизован, это нормально
        result.value.error = null;
        return result.value;
      } else if (response.status === 401) {
        handle401Error(true);
        result.value.error = 'Ошибка авторизации';
        return result.value;
      } else {
        const errorData = await response.json().catch(() => ({}));
        result.value.error = errorData?.message || 'Ошибка при получении профиля';
        return result.value;
      }
    }

    const data = await response.json();
    result.value.data = data;
  } catch (err: any) {
    // Обработка сетевых ошибок
    if (err.response?.status === 404) {
      result.value.error = null;
      return result.value;
    } else if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении профиля';
    }
  } finally {
    return result.value;
  }
};

/**
 * Авторизация на Rabota.ru
 * @returns Результат авторизации
 */
export const auth = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/auth', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при авторизации на Rabota.ru';
    }
  } finally {
    return result.value;
  }
};

/**
 * Отвязка профиля Rabota.ru
 * @returns Результат отвязки
 */
export const unlinkProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/auth', {
      method: 'DELETE',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при отвязке профиля';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение одной публикации Rabota.ru по id
 */
export const getPublication = async (id: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>(`/rabota/publications/${id}`, {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });
    const publication = response?.data ?? response;
    result.value.data = publication;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.error = err.response?._data?.message ?? 'Публикация не найдена';
    } else if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message ?? 'Ошибка при загрузке публикации';
    }
  } finally {
    return result.value;
  }
};

/**
 * Перевод публикации в архив на Rabota.ru (снятие с публикации).
 * @param publicationId - ID публикации на платформе (platform_id из platforms_data)
 */
export const archivePublication = async (publicationId: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  try {
    const response = await $fetch<any>(`/rabota/publications/${publicationId}/archive`, {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });
    result.value.data = response?.data ?? response;
  } catch (err: any) {
    if (err.response?.status === 401) handle401Error();
    result.value.error = err.response?._data?.message ?? 'Ошибка при переводе публикации в архив';
  } finally {
    return result.value;
  }
};

/**
 * Получение публикаций Rabota.ru
 * @param includeArchived - Включать ли архивные публикации
 * @returns Список публикаций
 */
export const getPublications = async (includeArchived: boolean = false) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const params: Record<string, any> = {};
    if (includeArchived) {
      params.archived = true;
    }

    const response = await $fetch<PlatformHhResponse>('/rabota/publications', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      params,
    });

    result.value.roles = response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorRoles = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение всех публикаций Rabota.ru (активных и архивных)
 * @returns Список всех публикаций
 */
export const getAllPublications = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    // Получаем активные публикации
    const activeResponse = await $fetch<PlatformHhResponse>('/rabota/publications', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    // Получаем вакансии из ответа (структура может быть разной)
    const activeItems = activeResponse.data?.response?.vacancies || 
                        activeResponse.data?.items || 
                        activeResponse.data?.vacancies || 
                        [];
    
    // Нормализуем структуру данных для единообразия с другими платформами
    const activeWithStatus = activeItems.map((item: any) => {
      // Функция для нормализации региона
      const normalizeRegion = (item: any) => {
        // Если уже есть area с правильной структурой
        if (item.area && typeof item.area === 'object' && item.area.name) {
          return item.area;
        }
        
        // Пробуем region (может быть объектом или строкой)
        if (item.region) {
          if (typeof item.region === 'string') {
            return { name: item.region };
          }
          if (typeof item.region === 'object') {
            return { 
              name: item.region.name || item.region.title || item.region.city || item.region.region || ''
            };
          }
        }
        
        // Пробуем address (может содержать город/регион)
        if (item.address) {
          if (typeof item.address === 'string') {
            return { name: item.address };
          }
          if (typeof item.address === 'object') {
            const city = item.address.city || item.address.name || item.address.title;
            if (city) {
              return { name: city };
            }
          }
        }
        
        // Пробуем location
        if (item.location) {
          if (typeof item.location === 'string') {
            return { name: item.location };
          }
          if (typeof item.location === 'object') {
            return { 
              name: item.location.name || item.location.city || item.location.title || ''
            };
          }
        }
        
        // Пробуем region_id - если есть ID, но нет названия, оставляем null
        // (название можно будет получить из справочника, но для таблицы это не критично)
        return null;
      };
      
      // Нормализуем поля для соответствия формату таблицы импорта
      const normalized: any = {
        ...item,
        // Название вакансии (rabota может использовать title)
        name: item.name || item.title || '',
        // ID вакансии
        id: item.id || item.vacancy_id || item.vacancyId,
        // Регион - нормализуем с помощью функции
        area: normalizeRegion(item),
        // Зарплата (rabota использует salary)
        salary: item.salary || item.salary_range || null,
        // Статус
        status: item.status || 'published',
      };
      
      return normalized;
    });

    let allItems = [...activeWithStatus];

    // Пытаемся получить архивные публикации
    try {
      const archivedResponse = await $fetch<PlatformHhResponse>('/rabota/publications', {
        baseURL: config.public.apiBase as string,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
        params: { archived: true },
      });

      // Получаем архивные вакансии из ответа
      const archivedItems = archivedResponse.data?.response?.vacancies || 
                            archivedResponse.data?.items || 
                            archivedResponse.data?.vacancies || 
                            [];
      
      // Нормализуем структуру данных для архивных публикаций
      const archivedWithStatus = archivedItems.map((item: any) => {
        // Функция для нормализации региона (та же, что и для активных)
        const normalizeRegion = (item: any) => {
          if (item.area && typeof item.area === 'object' && item.area.name) {
            return item.area;
          }
          if (item.region) {
            if (typeof item.region === 'string') {
              return { name: item.region };
            }
            if (typeof item.region === 'object') {
              return { 
                name: item.region.name || item.region.title || item.region.city || item.region.region || ''
              };
            }
          }
          if (item.address) {
            if (typeof item.address === 'string') {
              return { name: item.address };
            }
            if (typeof item.address === 'object') {
              const city = item.address.city || item.address.name || item.address.title;
              if (city) {
                return { name: city };
              }
            }
          }
          if (item.location) {
            if (typeof item.location === 'string') {
              return { name: item.location };
            }
            if (typeof item.location === 'object') {
              return { 
                name: item.location.name || item.location.city || item.location.title || ''
              };
            }
          }
          return null;
        };
        
        const normalized: any = {
          ...item,
          // Название вакансии
          name: item.name || item.title || '',
          // ID вакансии
          id: item.id || item.vacancy_id || item.vacancyId,
          // Регион - нормализуем с помощью функции
          area: normalizeRegion(item),
          // Зарплата
          salary: item.salary || item.salary_range || null,
          // Статус - архивная
          status: 'archived',
        };
        
        return normalized;
      });

      allItems = [...activeWithStatus, ...archivedWithStatus];
    } catch (archivedErr: any) {
      // Если запрос архивных публикаций не поддерживается, 
      // проверяем статус в активных публикациях
      console.log('Архивные публикации не доступны через отдельный запрос, проверяем статус в активных');
      
      // Фильтруем публикации по статусу, если он есть в ответе
      const itemsWithStatus = activeItems.map((item: any) => {
        // Функция для нормализации региона (та же, что и для активных)
        const normalizeRegion = (item: any) => {
          if (item.area && typeof item.area === 'object' && item.area.name) {
            return item.area;
          }
          if (item.region) {
            if (typeof item.region === 'string') {
              return { name: item.region };
            }
            if (typeof item.region === 'object') {
              return { 
                name: item.region.name || item.region.title || item.region.city || item.region.region || ''
              };
            }
          }
          if (item.address) {
            if (typeof item.address === 'string') {
              return { name: item.address };
            }
            if (typeof item.address === 'object') {
              const city = item.address.city || item.address.name || item.address.title;
              if (city) {
                return { name: city };
              }
            }
          }
          if (item.location) {
            if (typeof item.location === 'string') {
              return { name: item.location };
            }
            if (typeof item.location === 'object') {
              return { 
                name: item.location.name || item.location.city || item.location.title || ''
              };
            }
          }
          return null;
        };
        
        // Нормализуем структуру данных
        const normalized: any = {
          ...item,
          // Название вакансии
          name: item.name || item.title || '',
          // ID вакансии
          id: item.id || item.vacancy_id || item.vacancyId,
          // Регион - нормализуем с помощью функции
          area: normalizeRegion(item),
          // Зарплата
          salary: item.salary || item.salary_range || null,
        };
        
        // Если статус уже есть и он архивный, оставляем его
        if (item.status && (item.status === 'archived' || item.status === 'closed')) {
          normalized.status = 'archived';
        } else {
          normalized.status = item.status || 'published';
        }
        
        return normalized;
      });

      allItems = itemsWithStatus;
    }

    result.value.roles = {
      items: allItems,
    };
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorRoles = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника профессий rabota.ru
 * @returns Список профессий
 */
export const getProfessions = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/professions', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении списка профессий';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника регионов rabota.ru
 * @returns Список регионов
 */
export const getRegions = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/regions', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении списка регионов';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника типов занятости rabota.ru
 * @returns Список типов занятости
 */
export const getEmploymentTypes = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/employment-types', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении типов занятости';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника графиков работы rabota.ru
 * @returns Список графиков работы
 */
export const getWorkSchedules = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/work-schedules', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении графиков работы';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника опыта работы rabota.ru
 * @returns Список опыта работы
 */
export const getExperienceLevels = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/experience-levels', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении уровней опыта';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника образования rabota.ru
 * @returns Список уровней образования
 */
export const getEducationLevels = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionary/education-levels', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении уровней образования';
    }
  } finally {
    return result.value;
  }
};

/**
 * Маппинг данных вакансии из формата формы в формат rabota.ru API
 * @param data - Данные вакансии в формате DraftDataHh
 * @returns Данные в формате для rabota.ru API
 */
const mapDataToRabotaFormat = (data: DraftDataHh): Record<string, any> => {
  const rabotaData: Record<string, any> = {};

  // Обязательные поля
  if (data.name) {
    rabotaData.title = data.name;
  }

  if (data.description) {
    rabotaData.description = data.description;
  }

  // Профессиональная роль (обязательное поле)
  if (data.professional_roles && data.professional_roles.length > 0 && data.professional_roles[0]?.id) {
    rabotaData.profession_id = data.professional_roles[0].id;
  }

  // Регион/город (обязательное поле)
  if (data.areas && data.areas.length > 0 && data.areas[0]?.id) {
    rabotaData.region_id = data.areas[0].id;
  }

  // Тип занятости
  if (data.employment_form?.id) {
    rabotaData.employment_type_id = data.employment_form.id;
  }

  // График работы
  if (data.work_schedule_by_days?.id) {
    rabotaData.work_schedule_id = data.work_schedule_by_days.id;
  }

  // Опыт работы
  if (data.experience?.id) {
    rabotaData.experience_id = data.experience.id;
  }

  // Образование
  if (data.education_level?.id) {
    rabotaData.education_id = data.education_level.id;
  }

  // Зарплата
  if (data.salary_range) {
    const salary = data.salary_range as Record<string, any>;
    if (salary.from || salary.to) {
      rabotaData.salary = {};
      if (salary.from) {
        rabotaData.salary.from = Number(salary.from);
      }
      if (salary.to) {
        rabotaData.salary.to = Number(salary.to);
      }
      if (salary.currency) {
        rabotaData.salary.currency = salary.currency;
      }
      if (salary.gross !== undefined) {
        rabotaData.salary.gross = salary.gross;
      }
    }
  }

  // Навыки (key_skills или phrases)
  if (data.key_skills && Array.isArray(data.key_skills) && data.key_skills.length > 0) {
    rabotaData.skills = data.key_skills.map((skill: any) => 
      typeof skill === 'string' ? skill : skill.name || skill
    );
  } else if (data.phrases && Array.isArray(data.phrases) && data.phrases.length > 0) {
    rabotaData.skills = data.phrases.map((phrase: any) => 
      typeof phrase === 'string' ? phrase : phrase.name || phrase
    );
  }

  // Адрес работы (если указан)
  if (data.address && typeof data.address === 'object' && 'id' in data.address) {
    rabotaData.address_id = data.address.id;
  }

  // Формат работы (удаленная работа и т.д.)
  if (data.work_format && Array.isArray(data.work_format) && data.work_format.length > 0) {
    rabotaData.work_format_ids = data.work_format.map((format: any) => 
      typeof format === 'object' && format.id ? format.id : format
    );
  }

  // Дополнительные условия
  if (data.additional_conditions && Array.isArray(data.additional_conditions) && data.additional_conditions.length > 0) {
    rabotaData.additional_conditions = data.additional_conditions.map((condition: any) => 
      typeof condition === 'object' && condition.id ? condition.id : condition
    );
  }

  // Водительские права
  if (data.driver_license_types && Array.isArray(data.driver_license_types) && data.driver_license_types.length > 0) {
    rabotaData.driver_license_ids = data.driver_license_types.map((license: any) => 
      typeof license === 'object' && license.id ? license.id : license
    );
  }

  return rabotaData;
};

/**
 * Добавление черновика вакансии на Rabota.ru
 * Использует метод /me/vacancy/create.json с параметром draft=true
 * @param data - Данные вакансии в формате DraftDataHh
 * @returns Результат создания черновика
 */
export const addDraft = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден', errorDraft: null };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null, errorDraft: null });

  try {
    // Маппим данные в формат rabota.ru
    const rabotaData = mapDataToRabotaFormat(data);
    
    // Для черновика добавляем флаг draft: true
    const draftData = {
      ...rabotaData,
      draft: true, // Флаг для создания черновика
    };

    // Используем правильный эндпоинт согласно API rabota.ru
    const response = await $fetch<PlatformHhResponse>('/rabota/me/vacancy/create.json', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: draftData,
    });

    result.value.draft = response.data;
  } catch (err: any) {
    if (err.response?.status !== 401) {
      const errorMessage = err.response?._data?.message || err.response?._data?.error || err.response?._data?.errors;
      result.value.errorDraft = errorMessage || 'Ошибка при создании черновика на Rabota.ru';
      
      // Логируем детали ошибки для отладки
      if (err.response?._data) {
        console.error('Ошибка создания черновика rabota.ru:', err.response._data);
      }
    } else {
      handle401Error();
    }
  } finally {
    return result.value;
  }
};

/**
 * Публикация вакансии на Rabota.ru
 * Использует метод /me/vacancy/create.json без параметра draft (или с draft=false)
 * @param draftData - Данные вакансии в формате DraftDataHh
 * @returns Результат публикации
 */
export const publishVacancy = async (draftData: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    // Маппим данные в формат rabota.ru
    const rabotaData = mapDataToRabotaFormat(draftData);

    // Для публикации не добавляем флаг draft (или устанавливаем draft: false)
    // Вакансия будет опубликована сразу
    const publishData = {
      ...rabotaData,
      draft: false, // Явно указываем, что это не черновик
    };

    // Используем правильный эндпоинт согласно API rabota.ru
    const response = await $fetch<PlatformHhResponse>('/rabota/me/vacancy/create.json', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: publishData,
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
      result.value.error = 'Требуется повторная авторизация';
    } else if (err.response?.status === 400) {
      // Ошибка валидации - выводим детальную информацию
      const errorData = err.response?._data;
      let errorMessage = 'Ошибка валидации данных. Проверьте обязательные поля';
      
      if (errorData?.message) {
        errorMessage = errorData.message;
      } else if (errorData?.error) {
        errorMessage = errorData.error;
      } else if (errorData?.errors) {
        // Если есть массив ошибок, объединяем их
        if (Array.isArray(errorData.errors)) {
          errorMessage = errorData.errors.map((e: any) => 
            typeof e === 'string' ? e : e.message || e.field || JSON.stringify(e)
          ).join(', ');
        } else if (typeof errorData.errors === 'object') {
          // Если errors - объект с полями
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              return `${field}: ${msg}`;
            })
            .join('; ');
          errorMessage = fieldErrors || errorMessage;
        }
      }
      
      result.value.error = errorMessage;
      
      // Логируем детали ошибки для отладки
      console.error('Ошибка публикации вакансии rabota.ru:', errorData);
    } else if (err.response?.status === 403) {
      result.value.error = err.response?._data?.message || 'Доступ запрещен';
    } else {
      result.value.error = err.response?._data?.message || err.response?._data?.error || 'Ошибка при публикации вакансии на Rabota.ru';
    }
  } finally {
    return result.value;
  }
};