import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";
import { mapVacancyToAvitoFormat, ensureAvitoPayloadTypes } from "@/utils/mapVacancyToAvito";

/**
 * Добавление черновика вакансии на Avito
 * @param data - Данные вакансии в формате DraftDataHh или из формы AddPublication
 * @returns Результат создания черновика
 */
export const addDraft = async (data: DraftDataHh | any) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден', errorDraft: null };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null, errorDraft: null });
  
  // Преобразуем данные в формат Avito API; нормализуем типы (profession и др. — number, не string)
  const avitoData = ensureAvitoPayloadTypes(mapVacancyToAvitoFormat(data));

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/drafts', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: avitoData,
    });

    result.value.draft = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      const data = err.response?._data;
      const slug = data?.slug;
      const message = data?.message;
      if (slug === 'server_error' || (typeof message === 'string' && message.includes('contact support'))) {
        result.value.errorDraft = 'Временная ошибка на стороне Avito. Повторите попытку позже или обратитесь в поддержку: supportautoload@avito.ru, 8 800 600-00-01.';
      } else {
        result.value.errorDraft = message || 'Ошибка при создании черновика на Avito';
      }
    }
  } finally {
    return result.value;
  }
}

/**
 * Получение профиля пользователя Avito
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
    const response = await $fetch<PlatformHhResponse>('/avito/profile', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.error = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error(true);
    }
  } finally {
    return result.value;
  }
};

/**
 * Авторизация на Avito
 * @returns Результат авторизации
 */
export const auth = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/auth', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    // Улучшенная обработка ошибок
    if (err.response?.status === 401) {
      handle401Error(true);
      result.value.error = 'Требуется повторная авторизация';
    } else if (err.response?.status === 400) {
      // Ошибка валидации (возможно, неправильный код авторизации или redirect_uri)
      result.value.error = err.response?._data?.message || 'Ошибка валидации авторизации. Проверьте redirect_uri и параметры запроса';
    } else if (err.response?.status === 403) {
      // Доступ запрещен (возможно, неправильный client_id или scope)
      result.value.error = err.response?._data?.message || 'Доступ запрещен. Проверьте client_id и разрешения приложения';
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при авторизации на Avito';
    }
  } finally {
    return result.value;
  }
};

/**
 * Отвязка профиля Avito
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
    const response = await $fetch<PlatformHhResponse>('/avito/auth', {
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
 * Нормализация элемента публикации Avito в единый формат
 * Avito возвращает: { id, title, price, address, status, url, category }
 * Нужный формат: { id, name, salary: { from, to, currency }, area: { name }, status, url }
 */
function normalizeAvitoItem(item: any): any {
  return {
    ...item,
    // name — используется в UI для отображения названия
    name: item.title || item.name || 'Без названия',
    // area — используется в UI для отображения региона
    area: item.area || { name: item.address || '—' },
    // salary — используется в UI для отображения зарплаты
    salary: item.salary || (item.price != null ? { from: item.price, to: null, currency: 'RUR' } : null),
  };
}

/**
 * Получение публикаций с avito.ru
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

    const response = await $fetch<PlatformHhResponse>('/avito/publications', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      params,
    });

    // Avito API возвращает { meta, resources: [...] }, нормализуем в { items: [...] }
    const rawItems = response.data?.resources || response.data?.items || [];
    const normalizedItems = rawItems.map(normalizeAvitoItem);

    result.value.roles = {
      ...response.data,
      items: normalizedItems,
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
}

/**
 * Получение всех публикаций Avito.ru (активных и архивных)
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
    const activeResponse = await $fetch<PlatformHhResponse>('/avito/publications', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    // Avito API возвращает { meta, resources: [...] }
    const activeItems = activeResponse.data?.resources || activeResponse.data?.items || [];
    
    // Нормализуем и помечаем активные публикации
    const activeWithStatus = activeItems.map((item: any) => ({
      ...normalizeAvitoItem(item),
      status: item.status || 'published',
    }));

    let allItems = [...activeWithStatus];

    // Пытаемся получить архивные публикации
    try {
      const archivedResponse = await $fetch<PlatformHhResponse>('/avito/publications', {
        baseURL: config.public.apiBase as string,
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
        params: { archived: true },
      });

      // Avito API возвращает { meta, resources: [...] }
      const archivedItems = archivedResponse.data?.resources || archivedResponse.data?.items || [];
      
      // Нормализуем и помечаем архивные публикации
      const archivedWithStatus = archivedItems.map((item: any) => ({
        ...normalizeAvitoItem(item),
        status: 'archived',
      }));

      allItems = [...activeWithStatus, ...archivedWithStatus];
    } catch (archivedErr: any) {
      // Если запрос архивных публикаций не поддерживается, 
      // проверяем статус в активных публикациях
      console.log('Архивные публикации не доступны через отдельный запрос, проверяем статус в активных');
      
      // Фильтруем публикации по статусу, если он есть в ответе
      const itemsWithStatus = activeItems.map((item: any) => {
        const normalized = normalizeAvitoItem(item);
        // Если статус уже есть и он архивный, оставляем его
        if (item.status && (item.status === 'archived' || item.status === 'closed')) {
          return {
            ...normalized,
            status: 'archived',
          };
        }
        return {
          ...normalized,
          status: item.status || 'published',
        };
      });
      
      allItems = itemsWithStatus;
    }

    result.value.roles = {
      ...activeResponse.data,
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
}

/**
 * Публикация вакансии на avito.ru (без черновика)
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
    // Преобразуем данные в формат Avito API; нормализуем типы (profession и др. — number, не string)
    const avitoData = ensureAvitoPayloadTypes(mapVacancyToAvitoFormat(draftData as any));

    const response = await $fetch<PlatformHhResponse>('/avito/publications', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: avitoData,
    });

    result.value.data = response.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      const data = err.response?._data;
      const slug = data?.slug;
      const message = data?.message;
      if (slug === 'server_error' || (typeof message === 'string' && message.includes('contact support'))) {
        result.value.error = 'Временная ошибка на стороне Avito. Повторите попытку позже или обратитесь в поддержку Avito: supportautoload@avito.ru, 8 800 600-00-01.';
      } else {
        result.value.error = message || 'Ошибка при публикации вакансии на Avito';
      }
    }
  } finally {
    return result.value;
  }
}

/**
 * Получение списка профессий (отраслей) для Avito
 * @param search - Поисковый запрос по названию (опционально)
 * @returns Список профессий
 */
export const getProfessions = async (search?: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const params: Record<string, any> = {};
    if (search) {
      params.search = search;
    }

    const response = await $fetch<PlatformHhResponse>('/avito/professions', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      params,
    });

    result.value.data = response.data?.items || response.data || [];
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении профессий Avito';
    }
  } finally {
    return result.value;
  }
}

/**
 * Получение списка специализаций для профессии Avito
 * @param professionId - ID профессии
 * @param search - Поисковый запрос по названию (опционально)
 * @returns Список специализаций
 */
export const getSpecializations = async (professionId: string | number, search?: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const params: Record<string, any> = {};
    if (search) {
      params.search = search;
    }

    const response = await $fetch<PlatformHhResponse>(`/avito/professions/${professionId}/specializations`, {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      params,
    });

    result.value.data = response.data?.items || response.data || [];
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении специализаций Avito';
    }
  } finally {
    return result.value;
  }
}