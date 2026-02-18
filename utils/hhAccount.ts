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

    // Преобразуем данные в правильный формат для отображения
    const items = response.data?.publication_variants || [];
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

export const addDraft = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return null;
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });
  const bodyData = new FormData();
  
  Object.entries(data).forEach(([key, value]) => {
    // Специальная обработка для vacancy_properties
    if (key === 'vacancy_properties') {
      if (typeof value === 'object' && value !== null) {
        const vacancyProps = value as Record<string, any>;
        if ('properties' in vacancyProps && Array.isArray(vacancyProps.properties)) {
          vacancyProps.properties.forEach((prop: any, index: number) => {
            if (prop && typeof prop === 'object' && 'property_type' in prop) {
              bodyData.append(`vacancy_properties[properties][${index}][property_type]`, String(prop.property_type));
              console.log(`addDraft: Добавлен vacancy_properties[properties][${index}][property_type]:`, String(prop.property_type));
            } else {
              console.log(`addDraft: Пропущен prop[${index}]:`, prop);
            }
          });
        } else {
          console.log('addDraft: properties не массив или отсутствует');
        }
      } else {
        console.log('addDraft: vacancy_properties не объект или null');
      }
      return;
    }

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
export const publishVacancy = async (data: DraftDataHh) => {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { data: null, error: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const result = ref<ApiHhResult>({ data: null, error: null });

  const bodyData = new FormData();
  Object.entries(data).forEach(([key, value]) => {
    // Пропускаем null, undefined и функции
    if (value === null || value === undefined || typeof value === 'function') {
      return;
    }
    
    // Специальная обработка для salary_range
    if (key === 'salary_range' && typeof value === 'object' && value !== null) {
      const salaryValue = value as Record<string, any>;
      Object.keys(salaryValue).forEach((subKey) => {
        const subValue = salaryValue[subKey];
        if (subValue !== null && subValue !== undefined) {
          if (typeof subValue === 'object' && 'id' in subValue) {
            // Для объектов с id передаем только id
            bodyData.append(`salary_range[${subKey}][id]`, String(subValue.id));
          } else if (typeof subValue !== 'object') {
            // Для примитивных значений передаем как есть
            if (typeof subValue === 'boolean') {
              bodyData.append(`salary_range[${subKey}]`, subValue ? '1' : '0');
            } else {
              bodyData.append(`salary_range[${subKey}]`, String(subValue));
            }
          }
          // Пропускаем объекты без id, чтобы избежать [object Object]
        }
      });
      return;
    }
    
    // Специальная обработка для address
    if (key === 'address' && typeof value === 'object' && value !== null) {
      const addressValue = value as Record<string, any>;
      // Обрабатываем id адреса (обязательное поле)
      if ('id' in addressValue) {
        bodyData.append('address[id]', String(addressValue.id));
      }
      // Обрабатываем show_metro_only - передаем как '1' или '0', или не передаем если false
      if ('show_metro_only' in addressValue) {
        if (addressValue.show_metro_only === true || addressValue.show_metro_only === 'true' || addressValue.show_metro_only === 1) {
          bodyData.append('address[show_metro_only]', '1');
        } else if (addressValue.show_metro_only === false || addressValue.show_metro_only === 'false' || addressValue.show_metro_only === 0) {
          bodyData.append('address[show_metro_only]', '0');
        }
      }
      // Обрабатываем другие поля адреса, если они есть
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

    // Специальная обработка для industry - передаем только id, name и key, не roles
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
      // Не передаем roles и другие массивы объектов
      return;
    }
    
    // Специальная обработка для professional_roles - передаем как массив объектов с id
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
              // Формат: professional_roles[0][id] = "59"
              bodyData.append(`professional_roles[${index}][id]`, String(roleId));
            }
          }
        });
      } else if (typeof value === 'object' && value !== null && 'id' in value) {
        // Если пришел объект с id, преобразуем в массив с одним элементом
        const roleId = (value as any).id;
        if (roleId !== undefined && roleId !== null) {
          bodyData.append('professional_roles[0][id]', String(roleId));
        }
      }
      return;
    }

    // Специальная обработка для vacancy_properties
    if (key === 'vacancy_properties') {
      if (typeof value === 'object' && value !== null) {
        const vacancyProps = value as Record<string, any>;
       // bodyData.append(`vacancy_properties[properties]`, vacancyProps.property_type);
        if ('property_type' in vacancyProps && Array.isArray(vacancyProps.property_type)) {
          vacancyProps.property_type.forEach((prop: any, index: number) => {
            if (prop && typeof prop === 'object' && 'property_type' in prop) {
              bodyData.append(`vacancy_properties[properties][${index}][property_type]`, String(prop.property_type));
            } else {
              console.log(`addVacancy: Пропущен prop[${index}]:`, prop);
            }
          });
        } else {
          console.log('addVacancy: properties не массив или отсутствует');
        }
      } else {
        console.log('addVacancy: vacancy_properties не объект или null');
      }
      return;
    }


    if (Array.isArray(value)) {
      if (value.length > 0) {
        value.forEach((item, index) => {
          if (item !== null && item !== undefined) {
            if (typeof item === 'object' && 'id' in item) {
              // Проверяем, что id не undefined
              if (item.id !== undefined && item.id !== null) {
                bodyData.append(`${key}[${index}][id]`, String(item.id));
              }
            } else if (typeof item !== 'object') {
              // Передаем только примитивные значения
              bodyData.append(`${key}[${index}]`, String(item));
            }
            // Пропускаем объекты без id, чтобы избежать [object Object]
          }
        });
      }
    } else {
      if (typeof value === 'object' && value !== null) {
        const objValue = value as Record<string, any>;
        if (Object.keys(objValue).length > 0) {
          // Специальная обработка для объектов с id
          if ('id' in objValue) {
            bodyData.append(`${key}[id]`, String(objValue.id));
          }
          // Обрабатываем остальные поля объекта
          for (let index in objValue) {
            if (index !== 'id') {
              const fieldValue = objValue[index];
              
              // Пропускаем массивы, null, undefined и функции
              if (Array.isArray(fieldValue) || fieldValue === null || fieldValue === undefined || typeof fieldValue === 'function') {
                continue;
              }
              
              if (typeof fieldValue === 'object') {
                // Если объект имеет id, передаем только id
                if ('id' in fieldValue) {
                  bodyData.append(`${key}[${index}][id]`, String(fieldValue.id));
                } else {
                  // Для других объектов не передаем (чтобы избежать [object Object])
                  console.warn(`Пропущено поле ${key}[${index}]: объект без id`);
                }
              } else {
                // Для булевых значений преобразуем в строку '1' или '0'
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
        // Для простых значений
        if (value !== null && value !== undefined) {
          if (typeof value === 'boolean') {
            bodyData.append(key, value ? '1' : '0');
          } else {
            bodyData.append(key, String(value));
          }
        }
      }
    }
  })

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
    console.log('publishVacancy: response.data', response.data);
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
}