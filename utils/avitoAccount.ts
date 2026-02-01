import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";

/**
 * Добавление черновика вакансии на Avito
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
  const bodyData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        if (value[0] !== null) {
          console.log(`${key}[0][id]` + value[0].id)
          bodyData.append(`${key}[0][id]`, value[0].id);
        }
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        const objValue = value as Record<string, any>;
        if (Object.keys(objValue).length > 0) {
          for (const index in objValue) {
            console.log('API: ' + `${key}[${index}]` + `${objValue[index]}`);
            bodyData.append(`${key}[${index}]`, `${objValue[index]}`);
          }
        }
      } else {
        if (value !== null && value !== undefined) {
          bodyData.append(key, value as string);
        }
      }
    }
  })

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/drafts', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: bodyData,
    });

    result.value.draft = response.data;
  } catch (err: any) {
    if (err.response?.status !== 401) {
      result.value.errorDraft = err.response?._data?.message || 'Ошибка при создании черновика на Avito';
    } else {
      handle401Error();
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

    const activeItems = activeResponse.data?.items || [];
    
    // Помечаем активные публикации, если статус не указан
    const activeWithStatus = activeItems.map((item: any) => ({
      ...item,
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

      const archivedItems = archivedResponse.data?.items || [];
      
      // Помечаем архивные публикации
      const archivedWithStatus = archivedItems.map((item: any) => ({
        ...item,
        status: 'archived',
      }));

      allItems = [...activeWithStatus, ...archivedWithStatus];
    } catch (archivedErr: any) {
      // Если запрос архивных публикаций не поддерживается, 
      // проверяем статус в активных публикациях
      console.log('Архивные публикации не доступны через отдельный запрос, проверяем статус в активных');
      
      // Фильтруем публикации по статусу, если он есть в ответе
      const itemsWithStatus = activeItems.map((item: any) => {
        // Если статус уже есть и он архивный, оставляем его
        if (item.status && (item.status === 'archived' || item.status === 'closed')) {
          return {
            ...item,
            status: 'archived',
          };
        }
        return {
          ...item,
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
 * Публикация вакансии на avito.ru
 * @param draftData - Данные вакансии в формате DraftDataHh
 * @returns Результат публикации
 */
export const publishVacancy = async (draftData: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    // Сначала создаем черновик
    const draftResult = await addDraft(draftData);
    
    if (draftResult?.errorDraft) {
      result.value.error = draftResult.errorDraft;
      return result.value;
    }

    // Если черновик создан успешно, публикуем его
    // TODO: Добавить эндпоинт для публикации, если он есть в API
    // const publishResponse = await $fetch<PlatformHhResponse>('/hh/vacancies/publish', {
    //   method: 'POST',
    //   baseURL: config.public.apiBase as string,
    //   headers: {
    //     'Accept': 'application/json',
    //     'Authorization': `Bearer ${serverToken}`,
    //     'X-Auth-User': userToken,
    //   },
    //   body: { vacancy_id: draftResult.draft?.id },
    // });

    result.value.data = draftResult.draft;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при публикации вакансии';
    }
  } finally {
    return result.value;
  }
}