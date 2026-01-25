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

    const activeItems = activeResponse.data?.items || [];
    
    // Помечаем активные публикации, если статус не указан
    const activeWithStatus = activeItems.map((item: any) => ({
      ...item,
      status: item.status || 'published',
    }));

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
