import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";
import { resolveRabotaEmploymentIdFromForm } from '@/utils/rabotaEmploymentMapping';

/**
 * Получение профиля пользователя Rabota.ru
 * @returns Профиль пользователя
 */
export const getRabotaProfile = async () => {
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

export type RabotaProfileContactDefaults = {
  name: string
  email: string
  phone: string
}

/** Распаковка объекта профиля из ответа GET /rabota/profile. */
export function unwrapRabotaProfileRecord(profilePayload: unknown): Record<string, unknown> | null {
  if (profilePayload == null || typeof profilePayload !== 'object') return null

  const root = profilePayload as Record<string, unknown>
  if (
    root.first_name != null ||
    root.last_name != null ||
    root.firstName != null ||
    root.lastName != null ||
    root.email != null ||
    root.phone != null
  ) {
    return root
  }

  if (root.data != null && typeof root.data === 'object') {
    const inner = root.data as Record<string, unknown>
    if (inner.data != null && typeof inner.data === 'object') {
      return inner.data as Record<string, unknown>
    }
    return inner
  }

  return null
}

/** Нормализация телефона профиля в формат +7XXXXXXXXXX (как в PhoneInput). */
export function normalizeRabotaProfilePhone(raw: unknown): string {
  if (raw == null || raw === '') return ''

  if (Array.isArray(raw)) {
    return normalizeRabotaProfilePhone(raw[0])
  }

  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>
    return normalizeRabotaProfilePhone(
      o.number_international ??
        o.formatted ??
        o.number ??
        o.phone ??
        o.value ??
        o.mobile,
    )
  }

  const digits = String(raw).replace(/\D/g, '')
  if (!digits) return ''

  let normalized = digits
  if (normalized.length === 10) normalized = `7${normalized}`
  if (normalized.length === 11 && normalized.startsWith('8')) {
    normalized = `7${normalized.slice(1)}`
  }
  if (normalized.length >= 11 && normalized.startsWith('7')) {
    return `+${normalized.slice(0, 11)}`
  }

  return normalized.length >= 10 ? `+${normalized}` : ''
}

/** Контакты по умолчанию из GET /rabota/profile. */
export function extractRabotaProfileContactDefaults(
  profilePayload: unknown,
): RabotaProfileContactDefaults {
  const person = unwrapRabotaProfileRecord(profilePayload)
  if (!person) return { name: '', email: '', phone: '' }

  const first = String(person.first_name ?? person.firstName ?? '').trim()
  const last = String(person.last_name ?? person.lastName ?? '').trim()
  const name = [first, last].filter(Boolean).join(' ')

  const email = String(
    person.email ??
      person.mail ??
      person.contact_email ??
      person.user_email ??
      '',
  ).trim()

  const phoneRaw =
    person.phone ??
    person.mobile ??
    person.phone_number ??
    person.contact_phone ??
    (Array.isArray(person.phones) ? person.phones[0] : null)

  const phone = normalizeRabotaProfilePhone(phoneRaw)

  return { name, email, phone }
}

/** Имя контактного лица из ответа GET /rabota/profile (first_name + last_name). */
export function formatRabotaProfileContactName(profilePayload: unknown): string {
  return extractRabotaProfileContactDefaults(profilePayload).name
}

/**
 * Авторизация на Rabota.ru
 * @returns Результат авторизации
 */
export const authRabota = async () => {
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
export const unlinkRabotaProfile = async () => {
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
export const getRabotaPublication = async (id: string | number) => {
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
export const archiveRabotaPublication = async (publicationId: string | number) => {
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
export const getRabotaPublications = async (includeArchived: boolean = false) => {
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
export const getAllRabotaPublications = async () => {
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

export interface RabotaProfessionsHierarchyParams {
  page?: number
  per_page?: number
  roots_only?: 0 | 1
  search?: string
  category_id?: number
  no_cache?: 1
}

/**
 * Иерархический справочник профессиональных сфер rabota.ru
 */
export const getRabotaProfessionsHierarchy = async (params: RabotaProfessionsHierarchyParams = {}) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, meta: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult & { meta?: Record<string, unknown> | null }>({
    data: null,
    error: null,
    meta: null,
  });

  const query: Record<string, string | number> = {};
  if (params.page != null) query.page = params.page;
  if (params.per_page != null) query.per_page = params.per_page;
  if (params.roots_only != null) query.roots_only = params.roots_only;
  if (params.search?.trim()) query.search = params.search.trim();
  if (params.category_id != null) query.category_id = params.category_id;
  if (params.no_cache != null) query.no_cache = params.no_cache;

  try {
    const response = await $fetch<PlatformHhResponse & { meta?: Record<string, unknown> }>(
      '/rabota/dictionaries/professions-hierarchy',
      {
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
        query,
      },
    );

    result.value.data = response.data;
    result.value.meta = response.meta ?? null;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при получении иерархии профессиональных сфер';
    }
  } finally {
    return result.value;
  }
};

/**
 * Сферы rabota.ru по professional_role (специализации) вакансии Jobly
 */
export const getRabotaProfessionsByProfessionalRole = async (professionalRoleId: number | string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(
      `/rabota/dictionaries/rabota-professions-by-professional-role/${professionalRoleId}`,
      {
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
      },
    );

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message ||
        'Ошибка при получении профессиональных сфер по специализации';
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение справочника профессий rabota.ru
 * @returns Список профессий
 */
export const getRabotaProfessions = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/professions', {
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

export interface RabotaRegionsSearchParams {
  query?: string
  limit?: number
  parent_id?: number | string
}

/**
 * Справочник регионов / городов rabota.ru
 * GET /api/rabota/dictionaries/regions?query=...&limit=100&parent_id=...
 */
export const searchRabotaRegions = async (params: RabotaRegionsSearchParams = {}) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: [], error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const query: Record<string, string | number> = {
    limit: params.limit ?? 100,
  };
  const q = String(params.query ?? '').trim();
  if (q) query.query = q;
  if (params.parent_id != null && params.parent_id !== '') {
    query.parent_id = params.parent_id;
  }

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/regions', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      query,
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при получении списка регионов';
    }
  } finally {
    return result.value;
  }
};

/**
 * @deprecated Используйте searchRabotaRegions()
 */
export const getRegions = async () => searchRabotaRegions({ limit: 100 });

/**
 * Сопоставление типа занятости Jobly (employments.id) с пунктом справочника rabota.ru
 * GET /api/rabota/dictionaries/employment/by-employment/{employment_id}
 */
export const getRabotaEmploymentByEmploymentId = async (employmentId: number | string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  const id = String(employmentId ?? '').trim();
  if (!id) {
    return { data: null, error: 'Не указан employment_id' };
  }

  try {
    const response = await $fetch<PlatformHhResponse>(
      `/rabota/dictionaries/employment/by-employment/${encodeURIComponent(id)}`,
      {
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
      },
    );

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message ||
        'Ошибка при получении типа занятости rabota.ru по employment_id';
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
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/employment', {
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
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/schedules', {
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
 * Сопоставление опыта Jobly (experiences.id) с пунктом справочника rabota.ru
 * GET /api/rabota/dictionaries/experiences/by-experience/{experience_id}
 */
export const getRabotaExperienceByExperienceId = async (experienceId: number | string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  const id = String(experienceId ?? '').trim();
  if (!id) {
    return { data: null, error: 'Не указан experience_id' };
  }

  try {
    const response = await $fetch<PlatformHhResponse>(
      `/rabota/dictionaries/experiences/by-experience/${encodeURIComponent(id)}`,
      {
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
      },
    );

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message ||
        'Ошибка при получении опыта rabota.ru по experience_id';
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
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/experiences', {
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
 * Справочник образования rabota.ru
 * GET /api/rabota/dictionaries/educations
 */
export const getEducations = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/educations', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении справочника образования';
    }
  } finally {
    return result.value;
  }
};

/**
 * Подсказки ключевых навыков rabota.ru
 * POST /api/rabota/skills/suggest  body: { query: string }
 */
export const suggestRabotaSkills = async (query: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: [], error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/skills/suggest', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { query: String(query ?? '').trim() },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при поиске навыков';
    }
  } finally {
    return result.value;
  }
};

export interface RabotaWorkplacesSearchParams {
  query?: string
  limit?: number
  offset?: number
}

/**
 * Поиск адресов работы (рабочих мест) rabota.ru
 * GET /api/rabota/dictionaries/workplaces?limit=10&offset=0&query=...
 */
export const searchRabotaWorkplaces = async (params: RabotaWorkplacesSearchParams = {}) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: [], error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const query: Record<string, string | number> = {
    limit: params.limit ?? 10,
    offset: params.offset ?? 0,
  };
  const q = String(params.query ?? '').trim();
  if (q) query.query = q;

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/workplaces', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      query,
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при поиске адресов работы';
    }
  } finally {
    return result.value;
  }
};

export interface RabotaWorkplaceUpdatePayload {
  name: string
  address: string
  region_id: number
  geopoint: { latitude: number; longitude: number }
  subway_stations?: Array<{ id: number }>
}

/**
 * Обновление адреса работы (рабочего места) rabota.ru
 * PUT /api/rabota/dictionaries/workplaces/{id}
 */
export const updateRabotaWorkplace = async (
  id: number | string,
  payload: RabotaWorkplaceUpdatePayload,
) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(`/rabota/dictionaries/workplaces/${id}`, {
      method: 'PUT',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: payload,
    });

    result.value.data = response.data ?? response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при сохранении адреса работы';
    }
  } finally {
    return result.value;
  }
};

/**
 * Справочник рабочих часов / формата работы rabota.ru
 * GET /api/rabota/dictionaries/working-hours
 */
export const getWorkingHours = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/working-hours', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при получении справочника рабочих часов';
    }
  } finally {
    return result.value;
  }
};

/**
 * Справочник «Кто и как может откликаться» (категории соискателей) rabota.ru
 * GET /api/rabota/dictionaries/work-categories
 */
export const getWorkCategories = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/dictionaries/work-categories', {
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error =
        err.response?._data?.message || 'Ошибка при получении категорий соискателей';
    }
  } finally {
    return result.value;
  }
};

/** Тело POST /api/rabota/vacancy (прокси Jobly → Rabota.ru) */
export interface RabotaVacancyCreateBody {
  request: {
    vacancy: Record<string, unknown>
  }
  /** Не в OpenAPI; бэкенд Jobly может проксировать как черновик */
  draft?: boolean
}

const toPositiveInt = (value: unknown): number | null => {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : null
}

/** ID региона размещения: в форме rabota.ru — `area`, для HH — часто `areas[0]`. */
export function resolveRabotaRegionIdFromFormData(data: DraftDataHh): number | null {
  const raw = data as Record<string, unknown>
  const area = raw.area
  if (area != null && typeof area === 'object' && !Array.isArray(area)) {
    const fromArea = toPositiveInt((area as { id?: unknown }).id)
    if (fromArea != null) return fromArea
  }

  const areas = data.areas
  if (Array.isArray(areas) && areas.length > 0 && areas[0]?.id != null) {
    return toPositiveInt(areas[0].id)
  }

  return null
}

const buildRabotaContactPerson = (data: DraftDataHh): Record<string, unknown> => {
  const raw = data as Record<string, unknown>
  const contacts =
    raw.contacts && typeof raw.contacts === 'object' && !Array.isArray(raw.contacts)
      ? (raw.contacts as Record<string, unknown>)
      : null
  const platformData =
    data.platform && typeof data.platform === 'object' && data.platform.data != null
      ? (data.platform.data as Record<string, unknown>)
      : null
  const person =
    platformData?.person && typeof platformData.person === 'object'
      ? (platformData.person as Record<string, unknown>)
      : null

  const email =
    (typeof contacts?.email === 'string' && contacts.email.trim()) ||
    (typeof raw.executor_email === 'string' && raw.executor_email.trim()) ||
    (typeof platformData?.email === 'string' && platformData.email.trim()) ||
    ''

  const name =
    (typeof contacts?.name === 'string' && contacts.name.trim()) ||
    (typeof raw.executor_name === 'string' && raw.executor_name.trim()) ||
    (typeof person?.name === 'string' && person.name.trim()) ||
    (typeof platformData?.name === 'string' && platformData.name.trim()) ||
    ''

  const contact: Record<string, unknown> = {}
  if (name) contact.name = name
  if (email) contact.email = email

  const phonesRaw = contacts?.phones
  if (Array.isArray(phonesRaw) && phonesRaw.length > 0) {
    const phones = phonesRaw
      .map((phone) => {
        if (phone == null || typeof phone !== 'object') return null
        const p = phone as Record<string, unknown>
        const number =
          (typeof p.number_international === 'string' && p.number_international.trim()) ||
          (typeof p.formatted === 'string' && p.formatted.trim()) ||
          (typeof p.number === 'string' && p.number.trim()) ||
          ''
        if (!number) return null
        const entry: Record<string, unknown> = { number_international: number }
        if (p.extension != null && String(p.extension).trim()) {
          entry.extension = String(p.extension).trim()
        }
        return entry
      })
      .filter(Boolean)
    if (phones.length > 0) {
      contact.phones = phones
      contact.has_phone = true
    }
  } else {
    const executorPhone =
      typeof raw.executor_phone === 'string' ? raw.executor_phone.trim() : ''
    if (executorPhone) {
      contact.phones = [{ number_international: executorPhone }]
      contact.has_phone = true
    }
  }

  return contact
}

const mapSkillItems = (data: DraftDataHh): Array<{ name: string; id?: number }> => {
  const rawSkills =
    data.key_skills && Array.isArray(data.key_skills) && data.key_skills.length > 0
      ? data.key_skills
      : data.phrases && Array.isArray(data.phrases)
        ? data.phrases
        : []
  return rawSkills
    .map((skill) => {
      if (typeof skill === 'string') {
        const name = skill.trim()
        return name ? { name } : null
      }
      if (skill && typeof skill === 'object') {
        const name = String((skill as { name?: unknown }).name ?? '').trim()
        const id = toPositiveInt((skill as { id?: unknown }).id)
        if (!name && id == null) return null
        return id != null ? { id, ...(name ? { name } : {}) } : { name }
      }
      return null
    })
    .filter((item): item is { name: string; id?: number } => item != null)
}

/**
 * Маппинг данных формы в объект vacancy для POST /api/rabota/vacancy (прокси Jobly → Rabota.ru).
 * Обязательные поля API: title, description, places, salary, contact_person.
 */
const mapDataToRabotaFormat = (data: DraftDataHh): RabotaVacancyCreateBody => {
  const vacancy: Record<string, unknown> = {}

  if (data.name) {
    vacancy.title = String(data.name).trim()
  }
  if (data.description) {
    vacancy.description = String(data.description)
  }

  const shortDescription = (data as Record<string, unknown>).rabota_short_description
  if (typeof shortDescription === 'string' && shortDescription.trim()) {
    vacancy.short_description = shortDescription.trim()
  }

  const professions = (data.professional_roles ?? []).filter((role) => role?.id != null)
  if (professions.length > 0) {
    vacancy.professional_areas = professions.map((role) => {
      const id = toPositiveInt(role!.id)
      const entry: Record<string, unknown> = {}
      if (id != null) entry.id = id
      if (role!.name) entry.name = String(role!.name)
      return entry
    })
  }

  const parsedRegionId = resolveRabotaRegionIdFromFormData(data)
  if (parsedRegionId != null) {
    vacancy.region_id = parsedRegionId
    vacancy.regions = [{ id: parsedRegionId }]
  }

  const address = data.address as { id?: unknown } | null | undefined
  const placeId = address?.id != null ? toPositiveInt(address.id) : null
  if (placeId != null) {
    vacancy.places = [{ id: placeId }]
  }

  const employmentId = resolveRabotaEmploymentIdFromForm(data.employment_form)
  if (employmentId != null) {
    vacancy.employment_id = employmentId
  }

  const workSchedule = data.work_schedule_by_days
  const scheduleId = Array.isArray(workSchedule)
    ? workSchedule[0]?.id
    : workSchedule?.id
  const parsedScheduleId = toPositiveInt(scheduleId)
  if (parsedScheduleId != null) {
    vacancy.work_schedule_id = parsedScheduleId
  }

  const workFormat = data.work_format as
    | Array<{ id?: unknown }>
    | { id?: unknown }
    | null
    | undefined
  const workHourId = Array.isArray(workFormat)
    ? workFormat[0]?.id
    : workFormat && typeof workFormat === 'object'
      ? workFormat.id
      : null
  const parsedWorkHourId = toPositiveInt(workHourId)
  if (parsedWorkHourId != null) {
    vacancy.work_hour_id = parsedWorkHourId
  }

  const experienceId = toPositiveInt(data.experience?.id)
  if (experienceId != null) {
    vacancy.experience = { id: experienceId }
  }

  const educationId = data.education_level?.id
  if (educationId != null && educationId !== '') {
    const parsedEducationId = toPositiveInt(educationId)
    if (parsedEducationId != null) {
      vacancy.education = { id: parsedEducationId }
    }
  }

  if (data.salary_range) {
    const salary = data.salary_range as Record<string, unknown>
    const from = salary.from != null ? Number(salary.from) : null
    const to = salary.to != null ? Number(salary.to) : null
    const salaryPayload: Record<string, unknown> = {}
    if (from != null && !Number.isNaN(from)) salaryPayload.from = from
    if (to != null && !Number.isNaN(to)) salaryPayload.to = to
    if (salary.currency) salaryPayload.currency = salary.currency
    if (salary.gross !== undefined) {
      salaryPayload.pay_type =
        salary.gross === true || salary.gross === 'true' ? 'gross' : 'net'
    }
    if (salaryPayload.from != null || salaryPayload.to != null) {
      vacancy.salary = salaryPayload
    }
  }

  const skills = mapSkillItems(data)
  if (skills.length > 0) {
    vacancy.skills = skills
  }

  const workCategories =
    (data as Record<string, unknown>).rabota_work_categories ?? data.additional_conditions
  if (Array.isArray(workCategories) && workCategories.length > 0) {
    const applicantCategories = workCategories
      .map((item: unknown) => {
        if (item != null && typeof item === 'object' && 'id' in item) {
          const id = toPositiveInt((item as { id: unknown }).id)
          return id != null ? { id } : null
        }
        const id = toPositiveInt(item)
        return id != null ? { id } : null
      })
      .filter(Boolean)
    if (applicantCategories.length > 0) {
      vacancy.applicant_categories = applicantCategories
    }
  }

  vacancy.contact_person = buildRabotaContactPerson(data)

  return { request: { vacancy } }
}

/**
 * Добавление черновика вакансии на Rabota.ru
 * POST /api/rabota/vacancy (тело с draft: true)
 * @param data - Данные вакансии в формате DraftDataHh
 * @returns Результат создания черновика
 */
export const addRabotaDraft = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден', errorDraft: null };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null, errorDraft: null });

  try {
    const body = mapDataToRabotaFormat(data)
    body.draft = true

    const response = await $fetch<PlatformHhResponse>('/rabota/vacancy', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body,
    });

    result.value.draft = (response as { data?: unknown })?.data ?? response;
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
 * POST /api/rabota/vacancy
 * @param draftData - Данные вакансии в формате DraftDataHh
 * @returns Результат публикации
 */
export const publishRabotaVacancy = async (draftData: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const body = mapDataToRabotaFormat(draftData)

    const response = await $fetch<PlatformHhResponse>('/rabota/vacancy', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body,
    });

    result.value.data = (response as { data?: unknown })?.data ?? response;
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

const RABOTA_VACANCY_ID_KEYS = ['vacancy_id', 'rabota_vacancy_id', 'rabota_id', 'external_vacancy_id'] as const

function findDeepValueByKeys(obj: unknown, keys: readonly string[], depth = 0): unknown {
  if (obj == null || depth > 14) return null
  if (typeof obj !== 'object') return null

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const hit = findDeepValueByKeys(item, keys, depth + 1)
      if (hit != null && String(hit).trim() !== '') return hit
    }
    return null
  }

  const rec = obj as Record<string, unknown>
  for (const key of keys) {
    const v = rec[key]
    if (v != null && String(v).trim() !== '') return v
  }
  for (const v of Object.values(rec)) {
    if (v != null && typeof v === 'object') {
      const hit = findDeepValueByKeys(v, keys, depth + 1)
      if (hit != null && String(hit).trim() !== '') return hit
    }
  }
  return null
}

/** id вакансии rabota.ru из ответа POST /api/rabota/vacancy */
export function extractRabotaCreatedVacancyId(payload: unknown): number | string | null {
  if (payload == null) return null

  if (typeof payload !== 'object') {
    const s = String(payload).trim()
    return s && !Number.isNaN(Number(s)) ? (payload as number | string) : null
  }

  const byVacancyIdKey = findDeepValueByKeys(payload, RABOTA_VACANCY_ID_KEYS)
  if (byVacancyIdKey != null) return byVacancyIdKey as number | string

  const root = payload as Record<string, unknown>
  const vacancies = root.vacancies
  if (Array.isArray(vacancies) && vacancies.length > 0) {
    const first = vacancies[0]
    if (first && typeof first === 'object') {
      const v0 = first as Record<string, unknown>
      if (v0.vacancy_id != null && String(v0.vacancy_id).trim() !== '') {
        return v0.vacancy_id as number | string
      }
      if (v0.id != null && String(v0.id).trim() !== '') {
        return v0.id as number | string
      }
    }
  }

  const vacancy = root.vacancy
  if (vacancy && typeof vacancy === 'object') {
    const v = vacancy as Record<string, unknown>
    if (v.vacancy_id != null && String(v.vacancy_id).trim() !== '') {
      return v.vacancy_id as number | string
    }
    if (v.id != null && String(v.id).trim() !== '') {
      return v.id as number | string
    }
  }

  const request = root.request
  if (request && typeof request === 'object') {
    const reqVacancy = (request as Record<string, unknown>).vacancy
    if (reqVacancy && typeof reqVacancy === 'object') {
      const v = reqVacancy as Record<string, unknown>
      if (v.vacancy_id != null && String(v.vacancy_id).trim() !== '') {
        return v.vacancy_id as number | string
      }
      if (v.id != null && String(v.id).trim() !== '') {
        return v.id as number | string
      }
    }
  }

  const genericId = findDeepValueByKeys(payload, ['id'])
  if (genericId != null && String(genericId).trim() !== '') {
    return genericId as number | string
  }

  return null
}

export function extractRabotaVacancyIdFromFormData(data: DraftDataHh | Record<string, unknown>): number | string | null {
  const raw = (data as Record<string, unknown>).publication_id
    ?? (data as Record<string, unknown>).vacancy_platform_id
  if (raw == null || String(raw).trim() === '') return null
  const parsed = toPositiveInt(raw)
  return parsed != null ? parsed : (raw as number | string)
}

/** Блок тарифов из ответа POST /rabota/vacancies/tariffs. */
function unwrapRabotaTariffsBlocks(payload: unknown): unknown[] {
  if (payload == null || typeof payload !== 'object') return [];
  const root = payload as Record<string, unknown>;
  const data = root.data != null && typeof root.data === 'object'
    ? (root.data as Record<string, unknown>)
    : null;
  const response = root.response != null && typeof root.response === 'object'
    ? (root.response as Record<string, unknown>)
    : data?.response != null && typeof data.response === 'object'
      ? (data.response as Record<string, unknown>)
      : null;

  const candidates = [
    root.tariffs,
    data?.tariffs,
    response?.tariffs,
  ];
  for (const item of candidates) {
    if (Array.isArray(item)) return item;
  }
  return [];
}

/** Первый active_tariffs → order_item_id или id тарифа. */
function extractRabotaOrderItemIdFromTariffBlock(block: unknown): number | null {
  if (block == null || typeof block !== 'object') return null;
  const activeTariffs = (block as Record<string, unknown>).active_tariffs;
  if (!Array.isArray(activeTariffs) || activeTariffs.length === 0) return null;
  const first = activeTariffs[0];
  if (first == null || typeof first !== 'object') return null;
  const tariff = first as Record<string, unknown>;
  const raw = tariff.order_item_id ?? tariff.id;
  return toPositiveInt(raw);
}

/** order_item_id для вакансии из ответа /rabota/vacancies/tariffs. */
export function resolveRabotaOrderItemIdFromTariffs(
  tariffsPayload: unknown,
  vacancyId: number,
): number | null {
  const blocks = unwrapRabotaTariffsBlocks(tariffsPayload);
  for (const block of blocks) {
    if (block == null || typeof block !== 'object') continue;
    const vacancies = (block as Record<string, unknown>).vacancies;
    if (!Array.isArray(vacancies)) continue;
    const matchesVacancy = vacancies.some((v) => {
      if (v == null || typeof v !== 'object') return false;
      return toPositiveInt((v as Record<string, unknown>).id) === vacancyId;
    });
    if (matchesVacancy) {
      const orderItemId = extractRabotaOrderItemIdFromTariffBlock(block);
      if (orderItemId != null) return orderItemId;
    }
  }
  for (const block of blocks) {
    const orderItemId = extractRabotaOrderItemIdFromTariffBlock(block);
    if (orderItemId != null) return orderItemId;
  }
  return null;
}

/**
 * Тарифы для публикации вакансий на Rabota.ru
 * POST /api/rabota/vacancies/tariffs  body: { vacancy_ids: number[] }
 */
export const getRabotaVacanciesTariffs = async (vacancyIds: Array<number | string>) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const vacancy_ids = vacancyIds
    .map((id) => toPositiveInt(id))
    .filter((id): id is number => id != null);

  if (!vacancy_ids.length) {
    return { data: null, error: 'Не указан id вакансии для запроса тарифов' };
  }

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/vacancies/tariffs', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { vacancy_ids },
    });
    result.value.data = response?.data ?? response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
      result.value.error = 'Требуется повторная авторизация';
    } else {
      result.value.error =
        err.response?._data?.message ||
        err.response?._data?.error ||
        'Ошибка при получении тарифов Rabota.ru';
    }
  } finally {
    return result.value;
  }
};

/**
 * Публикация вакансий на Rabota.ru
 * POST /api/rabota/vacancies/publish  body: { vacancies: [{ id, order_item_id }] }
 */
export const publishRabotaVacancies = async (vacancyIds: Array<number | string>) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const parsedIds = vacancyIds
    .map((id) => toPositiveInt(id))
    .filter((id): id is number => id != null);

  if (!parsedIds.length) {
    return { data: null, error: 'Не указан id вакансии для публикации' };
  }

  const tariffsRes = await getRabotaVacanciesTariffs(parsedIds);
  if (tariffsRes.error) {
    return { data: tariffsRes.data, error: tariffsRes.error };
  }

  const vacancies = parsedIds
    .map((id) => {
      const order_item_id = resolveRabotaOrderItemIdFromTariffs(tariffsRes.data, id);
      if (order_item_id == null) return null;
      return { id, order_item_id };
    })
    .filter((item): item is { id: number; order_item_id: number } => item != null);

  if (!vacancies.length) {
    return {
      data: tariffsRes.data,
      error: 'Не удалось определить тариф (order_item_id) для публикации на Rabota.ru',
    };
  }

  try {
    const response = await $fetch<PlatformHhResponse>('/rabota/vacancies/publish', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { vacancies },
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
      result.value.error = 'Требуется повторная авторизация';
    } else {
      result.value.error =
        err.response?._data?.message ||
        err.response?._data?.error ||
        'Ошибка при публикации вакансии на Rabota.ru';
    }
  } finally {
    return result.value;
  }
};

/**
 * Создание вакансии (POST /rabota/vacancy) и публикация через /rabota/vacancies/publish.
 */
export const createAndPublishRabotaVacancy = async (draftData: DraftDataHh) => {
  const createRes = await publishRabotaVacancy(draftData);
  if (createRes.error) {
    return createRes;
  }

  const vacancyId =
    extractRabotaCreatedVacancyId(createRes.data) ??
    extractRabotaVacancyIdFromFormData(draftData);
  if (vacancyId == null) {
    console.warn('rabota: vacancy_id не найден в ответе POST /rabota/vacancy', createRes.data);
    return {
      data: createRes.data,
      error: 'Вакансия создана, но не удалось получить id для публикации на Rabota.ru',
    };
  }

  const publishRes = await publishRabotaVacancies([vacancyId]);
  if (publishRes.error) {
    return {
      data: createRes.data,
      error: publishRes.error,
    };
  }

  return {
    data: publishRes.data ?? createRes.data,
    error: null,
  };
};