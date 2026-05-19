import { createAuthHeaders, getAuthTokens, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";
import { mapVacancyToAvitoFormat, ensureAvitoPayloadTypes } from "@/utils/mapVacancyToAvito";
import { formatDescriptionForAvitoApi } from "@/utils/avitoDescriptionFormat";
import { unwrapAvitoMappingsPayload } from "@/utils/avitoSpecializationMapping";

/**
 * Добавление черновика вакансии на Avito
 * @param data - Данные вакансии в формате DraftDataHh или из формы AddPublication
 * @returns Результат создания черновика
 */
function extractAvitoApiError(err: unknown): {
  message: string
  httpStatus?: number
  apiResponse?: unknown
} {
  const e = err as { response?: { status?: number; _data?: unknown }; message?: string; data?: unknown }
  const httpStatus = e?.response?.status
  const apiResponse = e?.response?._data ?? e?.data ?? null
  const dataObj = apiResponse && typeof apiResponse === 'object' ? apiResponse as Record<string, unknown> : null
  const slug = dataObj?.slug
  const message = typeof dataObj?.message === 'string' ? dataObj.message : ''
  if (slug === 'server_error' || message.includes('contact support')) {
    return {
      httpStatus,
      apiResponse,
      message: 'Временная ошибка на стороне Avito. Повторите попытку позже или обратитесь в поддержку: supportautoload@avito.ru, 8 800 600-00-01.',
    }
  }
  return {
    httpStatus,
    apiResponse,
    message: message || (typeof e?.message === 'string' ? e.message : '') || 'Ошибка запроса к Avito',
  }
}

export const addAvitoDraft = async (data: DraftDataHh | any, joblyVacancyId?: number | null) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден', errorDraft: null };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null, errorDraft: null });
  
  // Преобразуем данные в формат Avito API; нормализуем типы (profession и др. — number, не string)
  const avitoData = buildAvitoPublicationRequestBody(data, joblyVacancyId);
  result.value.requestPayload = avitoData

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
    result.value.data = response.data;
    result.value.apiResponse = response;
    result.value.httpStatus = 200;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } }
    if (e.response?.status === 401) {
      handle401Error();
    } else {
      const parsed = extractAvitoApiError(err)
      result.value.httpStatus = parsed.httpStatus
      result.value.apiResponse = parsed.apiResponse
      result.value.errorDraft = parsed.message
    }
  } finally {
    return result.value;
  }
}

/**
 * Получение профиля пользователя Avito
 * @returns Профиль пользователя
 */
export const getAvitoProfile = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
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
export const authAvito = async () => {
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
export const unlinkAvitoProfile = async () => {
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
 * Получение одной публикации Avito по id
 */
export type AvitoPublicationTableStats = {
  status?: string | null
  views?: number | null
  applications_count?: number | null
  /** Дата активации на Avito (start_time), ISO. */
  published_at?: string | null
  /** Дата окончания публикации (finish_time), ISO. */
  expires_at?: string | null
  /** Просмотры не удалось получить (ни client_credentials, ни user OAuth). */
  views_scope_missing?: boolean
  /** Подсказка с бекенда, если просмотры недоступны. */
  views_hint?: string
}

/** Импорт откликов Avito в CRM (аналог цикла importHhNegotiationItemsIntoVacancy). */
export const syncAvitoPublicationApplications = async (
  avitoVacancyId: string | number,
  vacancyId: number,
): Promise<{ data: { imported?: number; updated?: number; skipped?: number } | null; error: string | null }> => {
  const authTokens = getAuthTokens()
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' }
  }
  const { config, serverToken, userToken } = authTokens
  try {
    const response = await $fetch<{
      message: string
      data?: { imported?: number; updated?: number; skipped?: number }
    }>(`/avito/publications/${encodeURIComponent(String(avitoVacancyId))}/sync-applications`, {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { vacancy_id: vacancyId },
    })
    return { data: response?.data ?? null, error: null }
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error()
    }
    const msg =
      err.response?._data?.message ??
      err.data?.message ??
      err.message ??
      'Ошибка импорта откликов Avito'
    return { data: null, error: String(msg) }
  }
}

/** Синхронизация сообщений Avito Messenger в ленту событий кандидатов вакансии. */
export const syncAvitoPublicationMessenger = async (
  avitoVacancyId: string | number,
  vacancyId: number,
): Promise<{
  data: { imported?: number; updated?: number; skipped?: number; candidates_processed?: number } | null
  error: string | null
}> => {
  const authTokens = getAuthTokens()
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' }
  }
  const { config, serverToken, userToken } = authTokens
  try {
    const response = await $fetch<{
      message: string
      data?: { imported?: number; updated?: number; skipped?: number; candidates_processed?: number }
    }>(`/avito/publications/${encodeURIComponent(String(avitoVacancyId))}/sync-messenger`, {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: { vacancy_id: vacancyId },
    })
    return { data: response?.data ?? null, error: null }
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error()
    }
    const msg =
      err.response?._data?.message ??
      err.data?.message ??
      err.message ??
      'Ошибка синхронизации сообщений Avito'
    return { data: null, error: String(msg) }
  }
}

/** Статистика публикации для таблицы «Активные публикации». */
export const getAvitoPublicationTableStats = async (id: string | number) => {
  const authTokens = getAuthTokens()
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' }
  }
  const { config, serverToken, userToken } = authTokens
  const result = ref<ApiHhResult>({ data: null, error: null })

  try {
    const response = await $fetch<{ data?: AvitoPublicationTableStats }>(
      `/avito/publications/${encodeURIComponent(String(id))}/table-stats`,
      {
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
      },
    )
    result.value.data = response?.data ?? null
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error()
    }
    result.value.error =
      err.response?._data?.message ?? 'Ошибка при загрузке статистики Avito'
  } finally {
    return result.value
  }
}

export const getAvitoPublication = async (id: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>(`/avito/publications/${id}`, {
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
 * Перевод публикации в архив на Avito (снятие с публикации).
 * @param publicationId - ID объявления на платформе (platform_id из platforms_data)
 */
export const archiveAvitoPublication = async (publicationId: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  try {
    const response = await $fetch<any>(`/avito/publications/${publicationId}/archive`, {
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
 * Получение публикаций с avito.ru
 * @param includeArchived - Включать ли архивные публикации
 * @returns Список публикаций
 */
export const getAvitoPublications = async (includeArchived: boolean = false) => {
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
export const getAllAvitoPublications = async () => {
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
export function buildAvitoPublicationRequestBody(
  draftData: DraftDataHh | Record<string, unknown>,
  joblyVacancyId?: number | null,
): Record<string, unknown> {
  const raw = draftData as Record<string, unknown>;
  const publicationId =
    raw.publication_id != null && String(raw.publication_id).trim() !== ''
      ? String(raw.publication_id).trim()
      : raw.vacancy_platform_id != null && String(raw.vacancy_platform_id).trim() !== ''
        ? String(raw.vacancy_platform_id).trim()
        : '';

  const avitoData = ensureAvitoPayloadTypes(
    mapVacancyToAvitoFormat({
      ...(draftData as object),
      description: formatDescriptionForAvitoApi(raw.description),
    } as Parameters<typeof mapVacancyToAvitoFormat>[0]),
  ) as Record<string, unknown>;

  if (typeof joblyVacancyId === 'number' && joblyVacancyId >= 1) {
    avitoData.jobly_vacancy_id = joblyVacancyId;
  }
  if (publicationId) {
    avitoData.publication_id = publicationId;
    avitoData.vacancy_platform_id = publicationId;
  }

  return avitoData;
}

export const publishAvitoVacancy = async (draftData: DraftDataHh, joblyVacancyId?: number | null) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const avitoData = buildAvitoPublicationRequestBody(draftData, joblyVacancyId);
    result.value.requestPayload = avitoData

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
    result.value.apiResponse = response;
    result.value.httpStatus = 200;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number } }
    if (e.response?.status === 401) {
      handle401Error();
    } else {
      const parsed = extractAvitoApiError(err)
      result.value.httpStatus = parsed.httpStatus
      result.value.apiResponse = parsed.apiResponse
      result.value.error = parsed.message
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
export const getAvitoProfessions = async (search?: string) => {
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
 * Получение списка сфер деятельности Avito (business_area) из локального кэша backend.
 */
export const getAvitoBusinessAreas = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/business-areas', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data?.items || response.data || [];
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сфер деятельности Avito';
    }
  } finally {
    return result.value;
  }
}

/**
 * Сотрудники / телефоны аккаунта Avito для блока «Контакты» публикации.
 */
export const getAvitoContactEmployees = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/contact-employees', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
    });

    result.value.data = response.data ?? response;
  } catch (err: unknown) {
    const e = err as { response?: { status?: number; _data?: { message?: string } } };
    if (e.response?.status === 401) {
      handle401Error(true);
    } else {
      result.value.error =
        e.response?._data?.message || 'Не удалось загрузить контакты Avito';
    }
  } finally {
    return result.value;
  }
};

/**
 * Все локально сохраненные каталоги Avito.
 */
export const getAvitoCatalogs = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/catalogs', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = response.data?.items || response.data || {};
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении каталогов Avito';
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

/**
 * Получение таблицы сопоставлений специализаций (hh_id -> avito profession id),
 * сохраненной в админке.
 */
/**
 * Получение таблицы сопоставлений опыта (id Наймикс -> avito experience id),
 * сохраненной в админке.
 */
export const getAvitoContractMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/contract-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений вида договора Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoSalaryPeriodMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/salary-period-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений периода зарплаты Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoPayoutFrequencyMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/payout-frequency-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений частоты выплат Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoSalaryTaxMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/salary-tax-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений налогового статуса зарплаты Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoEmploymentMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/employment-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений занятости Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoExperienceMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/experience-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений опыта Avito';
    }
  } finally {
    return result.value;
  }
}

export const getAvitoSpecializationMappings = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }

  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/avito/specialization-mappings', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    result.value.data = unwrapAvitoMappingsPayload(response.data?.items ?? response.data ?? {});
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
    } else {
      result.value.error = err.response?._data?.message || 'Ошибка при получении сопоставлений специализаций Avito';
    }
  } finally {
    return result.value;
  }
}