import { createAuthHeaders, getAuthTokens, getFetchErrorMeta, handle401Error, type ApiHhResult } from "@/helpers/authToken";
import type { PlatformHhResponse, DraftDataHh } from "@/types/platform";

export const getHhProfile = async () => {
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
  } catch (err: unknown) {
    const { status, message } = getFetchErrorMeta(err);
    if (status === 404) {
      result.value.error = message ?? 'Пользователь еще не авторизован';
    } else if (status === 401) {
      handle401Error(true);
    }
  } finally {
    return result.value;
  }
};

/** Laravel: { message, data } — data это ответ HH /me */
export function hhProfileIndicatesConnected(res: ApiHhResult | null): boolean {
  if (!res || res.error || !res.data) return false;
  const d = res.data;
  if (d.data != null) return true;
  return d.message === 'Success';
}

export const authHh = async () => {
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
  } catch (err: unknown) {
    const { status, message } = getFetchErrorMeta(err);
    if (status === 401) {
      handle401Error(true);
    } else {
      result.value.error = message ?? 'Ошибка авторизации hh.ru';
    }
  } finally {
    return result.value;
  }
};

export const unlinkHhProfile = async () => {
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
  } catch (err: unknown) {
    const { status, message } = getFetchErrorMeta(err);
    if (status === 401) {
      handle401Error(true);
    } else {
      result.value.error = message ?? 'Ошибка при отвязке профиля';
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

/**
 * Получение одной публикации HH по id
 */
export const getPublication = async (id: string | number) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any>(`/hh/publications/${id}`, {
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
 * Перевод публикации в архив на hh.ru (снятие с публикации).
 * Бэкенд вызывает API hh.ru для архивации вакансии.
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
    const response = await $fetch<any>(`/hh/publications/${publicationId}/archive`, {
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

export const getHhPublications = async (includeArchived: boolean = false) => {
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

/** Бэкенд может долго мержить страницы HH (per_page≤50); обрыв клиента раньше даёт «вечную» загрузку без результата. */
const HH_PUBLICATIONS_FETCH_TIMEOUT_MS = 300_000;

export type GetAllHhPublicationsOptions = {
  /** Только первая страница от HH — быстрый предпросмотр; полный список без флага. */
  firstPageOnly?: boolean;
};

export const getAllHhPublications = async (options?: GetAllHhPublicationsOptions) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  const firstPageOnly = options?.firstPageOnly === true;
  const listParams = firstPageOnly ? { first_page_only: '1' } : {};

  try {
    const headers = {
      Accept: 'application/json',
      Authorization: `Bearer ${serverToken}`,
      'X-Auth-User': userToken,
    };
    const base = config.public.apiBase as string;

    const fetchOpts = {
      baseURL: base,
      headers,
      timeout: HH_PUBLICATIONS_FETCH_TIMEOUT_MS,
    };

    const [activeSettled, archivedSettled] = await Promise.allSettled([
      $fetch<PlatformHhResponse>('/hh/publications', {
        ...fetchOpts,
        params: { ...listParams },
      }),
      $fetch<PlatformHhResponse>('/hh/publications', {
        ...fetchOpts,
        params: { archived: true, ...listParams },
      }),
    ]);

    if (activeSettled.status === 'rejected') {
      throw activeSettled.reason;
    }

    const activeResponse = activeSettled.value;
    const activeItems = activeResponse.data?.items || [];
    const activeWithStatus = activeItems.map((item: any) => ({
      ...item,
      status: item.status || 'published',
    }));

    let archivedFailed = false;
    let allItems: any[];

    if (archivedSettled.status === 'fulfilled') {
      const archivedItems = archivedSettled.value.data?.items || [];
      const archivedWithStatus = archivedItems.map((item: any) => ({
        ...item,
        status: 'archived',
      }));
      allItems = [...activeWithStatus, ...archivedWithStatus];
    } else {
      archivedFailed = true;
      console.warn(
        'Архивные публикации hh.ru: запрос не удался, используем только активные',
        archivedSettled.reason
      );
      allItems = activeItems.map((item: any) => {
        if (item.status && (item.status === 'archived' || item.status === 'closed')) {
          return { ...item, status: 'archived' };
        }
        return { ...item, status: item.status || 'published' };
      });
    }

    result.value.roles = {
      ...activeResponse.data,
      items: allItems,
    };

    if (allItems.length === 0 && archivedFailed) {
      result.value.errorRoles =
        'Не удалось загрузить архивные вакансии с hh.ru, а активных публикаций нет. Попробуйте обновить страницу или повторить позже.';
    }
  } catch (err: any) {
    const status = err.response?.status;
    if (status === 404) {
      result.value.errorRoles = err.response?._data?.message ?? 'Публикации не найдены';
    } else if (status === 401) {
      handle401Error();
    } else {
      result.value.errorRoles =
        err.response?._data?.message ?? err.message ?? 'Ошибка при загрузке публикаций с hh.ru';
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
    const response = await $fetch<PlatformHhResponse>('/hh/available-types', {
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

/** Локальные JSON-справочники формы публикации (роли + шаблоны тарифов), без api.hh.ru. */
export const getPublishFormReference = async () => {
  const config = useRuntimeConfig();
  return $fetch<{
    message?: string;
    data: {
      professional_roles: { categories?: unknown[] };
      tariff_templates: Array<{
        id?: number;
        name?: string;
        description?: string;
        property_type?: unknown[];
      }>;
    };
  }>('/hh/local/publish-form-reference', {
    method: 'GET',
    baseURL: config.public.apiBase as string,
    headers: { Accept: 'application/json' },
  });
};

/**
 * Остатки размещений с hh.ru для текущего работодателя (employer_id из токена middleware).
 * Тело запроса пустое — без предварительного getHhProfile на фронте.
 */
export const postAvailablePublicationsCounts = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null as PlatformHhResponse['data'] | null, error: 'Нет авторизации' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    const response = await $fetch<PlatformHhResponse>('/hh/available-publications', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: createAuthHeaders(serverToken, userToken),
      body: {},
    });
    return { data: response.data, error: null as string | null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    }
    return {
      data: null,
      error: err.response?._data?.message || err.message || 'Ошибка при получении остатков публикаций',
    };
  }
};

export const getAvailablePublications = async (employer_id: string) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { types: [], error: null };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/available-publications', {
      method: 'POST',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: createAuthHeaders(serverToken, userToken),
      body: { employer_id: employer_id },
    });

    // Только варианты с ненулевым остатком на счёте работодателя
    const rawItems = response.data?.publication_variants || [];
    const items = rawItems.filter(
      (item: any) => Number(item?.available_publications_count ?? 0) > 0,
    );
    result.value.types = items.map((item: any, index: number) => ({
      id: index + 1,
      name: item.appearance.title || 'Бесплатная публикация',
      property_type: item.vacancy_properties.required || [],
      description: item.appearance.description || '',
      available_publications_count: item.available_publications_count || 0,
    }));
  } catch (err: any) {
    if (err.response?.status === 404) {
      result.value.errorTypes = err.response._data.message;
      result.value.types = [];
    } else if (err.response?.status === 401) {
      handle401Error(true);
      result.value.types = [];
    } else {
      result.value.types = [];
      result.value.error = err.response?._data?.message || 'Ошибка при получении доступных публикаций';
    }
  } finally {
    return result.value;
  }
}

/**
 * Сборка multipart-полей вакансии для HH (как при публикации).
 * @param omitBillingFields — для черновика: не передаём tariff / vacancy_properties (без списания размещений).
 */
function buildHhVacancyFormData(data: DraftDataHh, omitBillingFields: boolean): FormData {
  const bodyData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    if (key === 'jobly_vacancy_id') {
      return;
    }
    if (omitBillingFields && (key === 'vacancy_properties' || key === 'billing_types')) {
      return;
    }
    if (value === null || value === undefined || typeof value === 'function') {
      return;
    }

    if (key === 'salary_range' && typeof value === 'object' && value !== null) {
      const salaryValue = value as Record<string, any>;
      Object.keys(salaryValue).forEach((subKey) => {
        const subValue = salaryValue[subKey];
        if (subValue !== null && subValue !== undefined) {
          if (typeof subValue === 'object' && 'id' in subValue) {
            bodyData.append(`salary_range[${subKey}][id]`, String(subValue.id));
          } else if (typeof subValue !== 'object') {
            if (typeof subValue === 'boolean') {
              bodyData.append(`salary_range[${subKey}]`, subValue ? '1' : '0');
            } else {
              bodyData.append(`salary_range[${subKey}]`, String(subValue));
            }
          }
        }
      });
      return;
    }

    if (key === 'address' && typeof value === 'object' && value !== null) {
      const addressValue = value as Record<string, any>;
      if ('id' in addressValue) {
        bodyData.append('address[id]', String(addressValue.id));
      }
      if ('show_metro_only' in addressValue) {
        if (addressValue.show_metro_only === true || addressValue.show_metro_only === 'true' || addressValue.show_metro_only === 1) {
          bodyData.append('address[show_metro_only]', '1');
        } else if (addressValue.show_metro_only === false || addressValue.show_metro_only === 'false' || addressValue.show_metro_only === 0) {
          bodyData.append('address[show_metro_only]', '0');
        }
      }
      Object.keys(addressValue).forEach((subKey) => {
        if (subKey !== 'show_metro_only' && subKey !== 'id') {
          const subValue = addressValue[subKey];
          if (typeof subValue === 'object' && subValue !== null && 'id' in subValue) {
            bodyData.append(`address[${subKey}][id]`, String(subValue.id));
          } else if (subValue !== null && subValue !== undefined) {
            bodyData.append(`address[${subKey}]`, String(subValue));
          }
        }
      });
      return;
    }

    if (key === 'industry' && typeof value === 'object' && value !== null) {
      const industryValue = value as Record<string, any>;
      if ('id' in industryValue) {
        bodyData.append('industry[id]', String(industryValue.id));
      }
      if ('name' in industryValue && typeof industryValue.name === 'string') {
        bodyData.append('industry[name]', industryValue.name);
      }
      if ('key' in industryValue) {
        bodyData.append('industry[key]', String(industryValue.key));
      }
      return;
    }

    if (key === 'professional_roles') {
      if (Array.isArray(value)) {
        value.forEach((role, index) => {
          if (role !== null && role !== undefined) {
            let roleId: string | number | undefined;
            if (typeof role === 'object' && 'id' in role) {
              roleId = role.id;
            } else if (typeof role === 'string' || typeof role === 'number') {
              roleId = role;
            }
            if (roleId !== undefined && roleId !== null) {
              bodyData.append(`professional_roles[${index}][id]`, String(roleId));
            }
          }
        });
      } else if (typeof value === 'object' && value !== null && 'id' in value) {
        const roleId = (value as any).id;
        if (roleId !== undefined && roleId !== null) {
          bodyData.append('professional_roles[0][id]', String(roleId));
        }
      }
      return;
    }

    if (key === 'vacancy_properties') {
      if (typeof value === 'object' && value !== null) {
        const vacancyProps = value as Record<string, any>;
        if ('property_type' in vacancyProps && Array.isArray(vacancyProps.property_type)) {
          vacancyProps.property_type.forEach((prop: any, index: number) => {
            const pt =
              typeof prop === 'string'
                ? prop
                : prop && typeof prop === 'object' && prop.property_type != null
                  ? prop.property_type
                  : null;
            if (pt != null && pt !== '') {
              bodyData.append(`vacancy_properties[properties][${index}][property_type]`, String(pt));
            }
          });
        }
      }
      return;
    }

    if (key === 'contacts' && typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const c = value as Record<string, any>;
      if (typeof c.name === 'string' && c.name.trim()) bodyData.append('contacts[name]', c.name.trim());
      if (typeof c.email === 'string' && c.email.trim()) bodyData.append('contacts[email]', c.email.trim());
      const phones = c.phones;
      if (Array.isArray(phones) && phones.length > 0) {
        phones.forEach((phone: any, index: number) => {
          if (phone && typeof phone === 'object' && typeof phone.formatted === 'string' && phone.formatted.trim()) {
            bodyData.append(`contacts[phones][${index}][formatted]`, phone.formatted.trim());
          }
        });
      }
      return;
    }

    if (Array.isArray(value)) {
      if (value.length > 0) {
        value.forEach((item, index) => {
          if (item !== null && item !== undefined) {
            if (typeof item === 'object' && 'id' in item) {
              if (item.id !== undefined && item.id !== null) {
                bodyData.append(`${key}[${index}][id]`, String(item.id));
              }
            } else if (typeof item !== 'object') {
              bodyData.append(`${key}[${index}]`, String(item));
            }
          }
        });
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        const objValue = value as Record<string, any>;
        if (Object.keys(objValue).length > 0) {
          if ('id' in objValue) {
            bodyData.append(`${key}[id]`, String(objValue.id));
          }
          for (const index in objValue) {
            if (index !== 'id') {
              const fieldValue = objValue[index];
              if (Array.isArray(fieldValue) || fieldValue === null || fieldValue === undefined || typeof fieldValue === 'function') {
                continue;
              }
              if (typeof fieldValue === 'object') {
                if ('id' in fieldValue) {
                  bodyData.append(`${key}[${index}][id]`, String(fieldValue.id));
                } else {
                  console.warn(`Пропущено поле ${key}[${index}]: объект без id`);
                }
              } else {
                if (typeof fieldValue === 'boolean') {
                  bodyData.append(`${key}[${index}]`, fieldValue ? '1' : '0');
                } else {
                  bodyData.append(`${key}[${index}]`, String(fieldValue));
                }
              }
            }
          }
        }
      } else {
        if (typeof value === 'boolean') {
          bodyData.append(key, value ? '1' : '0');
        } else {
          bodyData.append(key, String(value));
        }
      }
    }
  });

  if (data.jobly_vacancy_id != null && data.jobly_vacancy_id !== '') {
    bodyData.append('jobly_vacancy_id', String(data.jobly_vacancy_id));
  }
  return bodyData;
}

export const addHhDraft = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const bodyData = buildHhVacancyFormData(data, true);

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/drafts', {
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
      result.value.errorDraft = err.response._data.message;
    } else {
      handle401Error();
    }
  } finally {
    return result.value;
  }
}

export const getHhRoles = async () => {
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
export const publishHhVacancy = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const bodyData = buildHhVacancyFormData(data, false);

  // Логируем содержимое FormData для отладки
  for (const [key, value] of bodyData.entries()) {
    console.log(`${key}:`, value);
  }

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/publication', {
      method: 'POST',
      baseURL: config.public.apiBase as string, 
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
      body: bodyData,
    });

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

    result.value.data = response.data;
    console.log('publishHhVacancy: response.data', response.data);
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error();
      result.value.error = 'Требуется повторная авторизация';
    } else {
      // Обработка различных типов ошибок от hh.ru API
      const errorData = err.response?._data;
      
      // Проверяем специфические ошибки hh.ru
      if (errorData?.type === 'vacancies' && errorData?.value === 'not_enough_purchased_services') {
        result.value.error = 'Недостаточно купленных услуг для публикации вакансии. Пожалуйста, пополните баланс или выберите другой тариф публикации.';
      } else if (errorData?.errors) {
        // Если есть массив ошибок, обрабатываем их
        if (Array.isArray(errorData.errors)) {
          const errorMessages = errorData.errors.map((e: any) => {
            if (typeof e === 'string') return e;
            if (e.value === 'not_enough_purchased_services') {
              return 'Недостаточно купленных услуг для публикации вакансии';
            }
            return e.message || e.field || JSON.stringify(e);
          }).join(', ');
          result.value.error = errorMessages;
        } else if (typeof errorData.errors === 'object') {
          // Если errors - объект с полями
          const fieldErrors = Object.entries(errorData.errors)
            .map(([field, messages]: [string, any]) => {
              const msg = Array.isArray(messages) ? messages.join(', ') : messages;
              // Специальная обработка для not_enough_purchased_services
              if (String(msg).includes('not_enough_purchased_services')) {
                return 'Недостаточно купленных услуг для публикации вакансии';
              }
              return `${field}: ${msg}`;
            })
            .join('; ');
          result.value.error = fieldErrors || errorData.message || 'Ошибка при публикации вакансии';
        } else {
          result.value.error = errorData.message || 'Ошибка при публикации вакансии';
        }
      } else if (errorData?.message) {
        result.value.error = errorData.message;
      } else if (errorData?.error) {
        result.value.error = errorData.error;
      } else {
        result.value.error = 'Ошибка при публикации вакансии';
      }
      
      // Логируем детали ошибки для отладки
      console.error('Ошибка публикации вакансии hh.ru:', errorData);
    }
  } finally {
    return result.value;
  }
}

/**
 * Получение списка городов России из локальной БД (импорт из hh.ru).
 * Запрос к бэкенду GET /api/areas.
 * @returns Массив городов с id и name
 */
export const getAreas = async () => {
  const result = ref<ApiHhResult>({ data: null, error: null });
  const config = useRuntimeConfig();

  try {
    const response = await $fetch<{ message?: string; data?: Array<{ id: string; name: string }> }>('/areas', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
      },
    });

    const cities = response?.data ?? [];
    result.value.data = Array.isArray(cities) ? cities : [];
  } catch (err: any) {
    result.value.error = err?.data?.message || err?.data?.error || 'Ошибка при получении списка городов';
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
 * Получение списка языков с внешнего API (API_BASE из .env)
 * @returns Массив языков с id, name, uid
 */
export const getLanguages = async () => {
  const config = useRuntimeConfig();
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<any[]>('/hh/languages', {
      baseURL: config.public.apiBase as string,
    });
    result.value.data = response || [];
  } catch (err: any) {
    result.value.error = err.response?._data?.message || 'Ошибка при получении списка языков';
  } finally {
    return result.value;
  }
};

/**
 * Получение уровней владения языком (через серверный прокси)
 * @returns Массив уровней с id и name (A1, A2, B1, B2, C1, C2, L1)
 */
export const getLanguageLevels = async () => {
  const config = useRuntimeConfig();
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<Array<{ id: string; name: string }>>('/hh/language-levels', {
      baseURL: config.public.apiBase as string,
    });
    result.value.data = response || [];
  } catch (err: any) {
    result.value.error = err.response?._data?.message || 'Ошибка при получении уровней владения языком';
  } finally {
    return result.value;
  }
};

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
};

/** Объект resume из элемента списка GET /negotiations/response (HH). */
export function extractHhResumeFromNegotiationItem(
  item: Record<string, unknown>
): Record<string, unknown> | null {
  const resume = item.resume;
  if (resume && typeof resume === 'object') {
    return resume as Record<string, unknown>;
  }
  const applicant = item.applicant;
  if (
    applicant &&
    typeof applicant === 'object' &&
    applicant !== null &&
    'resume' in applicant &&
    typeof (applicant as { resume?: unknown }).resume === 'object' &&
    (applicant as { resume?: unknown }).resume !== null
  ) {
    return (applicant as { resume: Record<string, unknown> }).resume;
  }
  return null;
}

/** Импорт кандидата из отклика HH в нашу вакансию (тот же маппинг, что в админке). */
export const importHhCandidateFromResponse = async (payload: {
  vacancy_id: number;
  resume: Record<string, unknown>;
  negotiation?: Record<string, unknown> | null;
  hh_vacancy_id?: string | null;
}): Promise<{ data: unknown | null; error: string | null }> => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  try {
    const response = await $fetch<{ message: string; data: unknown }>(
      `/hh/import-candidate-response`,
      {
        method: 'POST',
        baseURL: config.public.apiBase as string,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken,
        },
        body: payload,
      }
    );
    return { data: response, error: null };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
    }
    const msg =
      err.response?._data?.message ||
      err.data?.message ||
      err.message ||
      'Ошибка импорта отклика hh.ru';
    return { data: null, error: String(msg) };
  }
};