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
    return null;
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
    if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при авторизации на Avito';
    }
  } finally {
    return result.value;
  }
};
