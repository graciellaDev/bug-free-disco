import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";

export const getProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/profile', {
      method: 'GET',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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

export const auth = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/auth', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response._data.message;
    }
  } finally {
    return result.value;
  }
};

export const unlinkProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/auth', {
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

export const getCode = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(`/hh/code`, {
      method: 'GET',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response._data.message;
    }
  } finally {
    return result.value;
  }
};

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

    const response = await $fetch<PlatformHhResponse>('/hh/publications', {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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

export const getAllPublications = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    // Получаем активные публикации
    const activeResponse = await $fetch<PlatformHhResponse>('/hh/publications', {
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
      const archivedResponse = await $fetch<PlatformHhResponse>('/hh/publications', {
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

export const getAvailableTypes = async (employerId: string, managerId: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/avalibale-types', {
      method: 'POST',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: createAuthHeaders(serverToken, userToken),
      body: { employer_id: employerId, manager_id: managerId },
    });

    result.value.types = response.data?.items;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorTypes = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error(true);
    }
  } finally {
    return result.value;
  }
}

export const addDraft = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  const bodyData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) {
        if (value[0] !== null) {
          console.log(`${key}[0][id]` + value[0].id)
          bodyData.append(`${key}[0][id]`, value[0].id);
          // for (let index in value[0]) {
          //     alert(`${key}[0][${index}]` + value[0][index])
          //     bodyData.append(`${key}[0][${index}]`, value[0][index]);
          // }
        }
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        const objValue = value as Record<string, any>;
        if (Object.keys(objValue).length > 0) {
          for (let index in objValue) {
            console.log('API: ' + `${key}[${index}]` + `${objValue[index]}`);
            bodyData.append(`${key}[${index}]`, `${objValue[index]}`);
          }
        }
      } else {
        bodyData.append(key, value as string);
      }

    }
    // if (key == 'professional_roles' ) {
    //     bodyData.append('professional_roles[0][id]', data.professional_roles[0].id);
    // } else {
    //     bodyData.append(key, value);
    // }
  })

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/drafts', {
      method: 'POST',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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
      result.value.errorDraft = err.response._data.message;
    } else {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getRoles = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/roles', {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
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

export const getHhVacancies = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/vacancies', {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.vacancies = response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorVacancies = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getDrafts = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/drafts', {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.drafts = response.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorDrafts = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getResponses = async (id: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(`/hh/vacancy-responses/${id}`, {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.responses = response.data;
    console.log(result.value.responses);
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorResponses = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getResponse = async (id: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(`/hh/vacancy-response/${id}`, {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.responses = response.data;
    console.log(result.value.responses);
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorResponses = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getData = async (url: any) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>(`/hh/send-url`, {
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: url
    });

    result.value.responses = response.data;
    console.log(result.value.responses);
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorResponses = err.response._data.message;
    }
    if (err.response?.status === 401) {
      handle401Error(true);
    }
  } finally {
    return result.value;
  }
}

/**
 * Публикация вакансии на hh.ru
 * @param draftData - Данные вакансии в формате DraftDataHh
 * @returns Результат публикации
 */
export const publishVacancyToHh = async (draftData: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
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

/**
 * Получение списка городов России из API hh.ru
 * @returns Массив городов с id и name
 */
export const getAreas = async () => {
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any[]>('https://api.hh.ru/areas', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'JobLy/1.0',
      },
    });

    // Находим Россию (id: "113")
    const russia = response.find(area => area.id === 113 || area.id === '113');
    
    if (!russia) {
      result.value.error = 'Россия не найдена в списке регионов';
      return result.value;
    }

    // Рекурсивно извлекаем города (регионы без вложенных areas) только из России
    const cities: Array<{ id: string; name: string }> = [];

    const extractCities = (areas: any[]) => {
      if (!areas || !Array.isArray(areas)) {
        return;
      }
      areas.forEach(area => {
        if (!area.areas || area.areas.length === 0) {
          // Это город (нет вложенных регионов)
          cities.push({ id: area.id.toString(), name: area.name });
        } else {
          // Рекурсивно обходим вложенные регионы
          extractCities(area.areas);
        }
      });
    };

    // Извлекаем города из России
    if (russia.areas && Array.isArray(russia.areas)) {
      extractCities(russia.areas);
    }
    
    // Сортируем по названию
    cities.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    result.value.data = cities;
  } catch (err: any) {
    result.value.error = err.response?._data?.message || 'Ошибка при получении списка городов';
  } finally {
    return result.value;
  }
}

/**
 * Получение списка адресов работадателя из API hh.ru
 * @returns Массив городов с id и name
 */
export const getAddresses = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
      const response = await $fetch<PlatformHhResponse>(`/hh/addresses`, {
          baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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
        result.value.error = err.response?._data?.message || 'Ошибка при получении списка адресов';
      }
    } finally {
      return result.value;
    }
}

/**
 * Получение количества просмотров вакансии из API hh.ru
 * @returns Массив городов с id и name
 */
export const getVacancyCountViews = async (id: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
      const response = await $fetch<PlatformHhResponse>(`/hh/publications/${id}/count-visitors`, {
          baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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
        result.value.error = err.response?._data?.message || 'Ошибка при получении количества просмотров';
      }
    } finally {
      return result.value;
    }
  }

/**
 * Получение количества просмотров вакансии из API hh.ru
 * @returns Массив городов с id и name
 */
export const getVacancyResponses = async (id: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
      const response = await $fetch<PlatformHhResponse>(`/hh/vacancy-responses/${id}`, {
          baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
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
        result.value.error = err.response?._data?.message || 'Ошибка при получении количества просмотров';
      }
    } finally {
      return result.value;
    }
}