import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse } from "@/types/platform";

/**
 * Получение профиля пользователя SuperJob
 */
export const getProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await fetch(`${config.public.apiBase}/superjob/profile`, {
      method: 'GET',
      headers: createAuthHeaders(serverToken, userToken),
    });

    if (!response.ok) {
      if (response.status === 404) {
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
 * Авторизация на SuperJob (редирект на OAuth)
 */
export const auth = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/superjob/auth', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response;
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при авторизации на SuperJob';
    }
  } finally {
    return result.value;
  }
};

/**
 * Отвязка профиля SuperJob
 */
export const unlinkProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/superjob/auth', {
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
 * Получение одной вакансии SuperJob по id
 */
export const getVacancy = async (id: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>(`/superjob/vacancies/${id}`, {
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
      result.value.error = err.response?._data?.message ?? 'Вакансия не найдена';
    } else if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message ?? 'Ошибка при загрузке вакансии';
    }
  } finally {
    return result.value;
  }
};

/**
 * Перевод вакансии в архив на SuperJob (снятие с публикации).
 * @param vacancyId - ID вакансии на платформе (platform_id из platforms_data)
 */
export const archivePublication = async (vacancyId: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  try {
    const response = await $fetch<any>(`/superjob/vacancies/${vacancyId}/archive`, {
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
    result.value.error = err.response?._data?.message ?? 'Ошибка при переводе вакансии в архив';
  } finally {
    return result.value;
  }
};

/**
 * Получение списка вакансий SuperJob (прокси к GET /api/superjob/vacancies)
 * Ответ бэкенда может повторять структуру API SuperJob: { objects: [...], total } или { data: { objects } }
 */
export const getPublications = async (_includeArchived: boolean = false) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>('/superjob/vacancies', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    // Нормализация: SuperJob API возвращает { objects: [...] } или бэкенд может обернуть в data
    const raw = response?.data ?? response;
    const items = raw?.objects ?? raw?.items ?? raw?.vacancies ?? (Array.isArray(raw) ? raw : []);
    result.value.roles = { items };
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorRoles = err.response._data?.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
};

/**
 * Получение всех вакансий SuperJob (активные; у SuperJob нет отдельного архива в том же API)
 * По аналогии с getAllPublications для hh.ru/rabota.ru — один запрос, нормализованный список.
 */
export const getAllPublications = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>('/superjob/vacancies', {
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    const raw = response?.data ?? response;
    const items = raw?.objects ?? raw?.items ?? raw?.vacancies ?? (Array.isArray(raw) ? raw : []);

    const normalizedItems = items.map((item: any) => ({
      ...item,
      id: item.id ?? item.vacancy_id ?? item.vacancyId,
      name: item.profession?.title ?? item.name ?? item.title ?? '',
      title: item.profession?.title ?? item.name ?? item.title ?? '',
      status: item.archived ? 'archived' : (item.status || 'published'),
      area: item.town ? { name: item.town.title ?? item.town.name ?? item.town } : (item.area || null),
      salary: item.payment_from != null || item.payment_to != null
        ? {
            from: item.payment_from,
            to: item.payment_to,
            currency: item.currency?.code ?? item.currency ?? 'RUB',
          }
        : (item.salary || null),
    }));

    result.value.roles = { items: normalizedItems };
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorRoles = err.response._data?.message;
    }
    if (err.response?.status === 401) {
      handle401Error();
    }
  } finally {
    return result.value;
  }
};
