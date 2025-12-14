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

export const getPublications = async () => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  try {
    const response = await $fetch<PlatformHhResponse>('/hh/publications', {
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
