import { useUserStore } from '@/stores/user';

interface VacancyResponse {
  data: {
    data: any[];
  };
}

interface UpdateVacancyData {
    name?: string | null;
    description?: string | null;
    code?: string | null;
    specializations?: string | null;
    industry?: string | null;
    employment?: string | null;
    schedule?: string | null;
    experience?: string | null;
    education?: string | null;
    drivers?: any;
    salary_from?: string | null;
    salary_to?: string | null;
    salary_type?: string | null;
    currency?: string | null;
    place?: string | null;
    location?: string | null;
    status?: 'active' | 'draft' | 'archive' | null;
    executor_id?: number | null;
    executor_name?: string | null;
    executor_phone?: string | null;
    executor_email?: string | null;
    show_executor?: boolean | null;
    role_id?: number | null;
    customer_role?: number | null;
}

export const getVacancies = async (params: any = '') => {
  const config = useRuntimeConfig();

  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response = await $fetch<VacancyResponse>(
      '/vacancies' + `?${params}`,
      {
        method: 'GET',
        baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${serverToken}`,
          'X-Auth-User': userToken, // Новый заголовок
        },
      }
    );

    return response?.data?.data || null;
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null; // Удаляем просроченный токен сервера
      userTokenCookie.value = null; // Удаляем просроченный токен пользователя
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return null;
  }
};

export const getVacancy = async (id: String) => {
  const config = useRuntimeConfig();

  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response: any = await $fetch<VacancyResponse>(`/vacancies/${id}`, {
      method: 'GET',
      baseURL: config.public.apiBase as string, // https://admin.job-ly.ru/api
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken, // Новый заголовок
      },
    });

    return response ? response.data : null;
    // return response ? JSON.parse(response).data : null;
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null; // Удаляем просроченный токен сервера
      userTokenCookie.value = null; // Удаляем просроченный токен пользователя
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return null;
  }
};

export const getVacanciesNames = async () => {
  const vacancies: any = await getVacancies();
  return (
    vacancies?.map((vacancy: string | number, key: keyof any) => {
      (vacancy as any)['name'] = (vacancy as any)['title'];

      return vacancy;
    }) || []
  );
};

export const updateVacancy = async (id: string | number, data: UpdateVacancyData) => {
    const config = useRuntimeConfig();

    // Токен сервера из cookie
    const serverTokenCookie = useCookie('auth_token');
    const serverToken = serverTokenCookie.value;
    if (!serverToken) {
        console.error('Токен сервера не найден в cookie');
        return { data: null, error: 'Токен сервера не найден' };
    }

    // Токен пользователя из cookie
    const userTokenCookie = useCookie('auth_user');
    const userToken = userTokenCookie.value;
    if (!userToken) {
        console.error('Токен пользователя не найден в cookie');
        return { data: null, error: 'Токен пользователя не найден' };
    }

    const params = new URLSearchParams();
    
    Object.entries(data).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
            params.append(key, String(value));
        }
    });

    try {
        const response = await $fetch(`/vacancies/${id}`, {
            method: 'PUT',
            baseURL: config.public.apiBase as string,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${serverToken}`,
                'X-Auth-User': userToken,
            },
            body: params.toString(),
        });

        return { data: response || null, error: null };
    } catch (err: any) {
        console.error('Ошибка при обновлении вакансии:', err);
        
        if (err.response?.status === 401) {
            const userStore = useUserStore();
            userStore.clearUserData();

            serverTokenCookie.value = null;
            userTokenCookie.value = null;
            alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
            navigateTo('/auth');
            return { data: null, error: 'Срок сессии истек. Пожалуйста, авторизуйтесь снова.' };
        }

        // Обработка ошибок валидации (422)
        if (err.response?.status === 422) {
            const validationErrors = err.response._data?.errors || err.response._data?.message;
            return { data: null, error: validationErrors || 'Ошибка валидации данных' };
        }

        return { data: null, error: err.response?._data?.message || 'Ошибка при обновлении вакансии' };
    }
};

export const getPhrases = async () => {
  const config = useRuntimeConfig();

  // Токен сервера из cookie
  const serverTokenCookie = useCookie('auth_token');
  const serverToken = serverTokenCookie.value;
  if (!serverToken) {
    console.error('Токен сервера не найден в cookie');
    return null;
  }

  // Токен пользователя из cookie
  const userTokenCookie = useCookie('auth_user');
  const userToken = userTokenCookie.value;
  if (!userToken) {
    console.error('Токен пользователя не найден в cookie');
    return null;
  }

  try {
    const response = await $fetch<VacancyResponse>('/phrases', {
      method: 'GET',
      baseURL: config.public.apiBase as string,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${serverToken}`,
        'X-Auth-User': userToken,
      },
    });

    return { data: response?.data || null, error: null };
  } catch (err: any) {
    console.error('Ошибка при запросе:', err);
    if (err.response?.status === 401) {
      const userStore = useUserStore();
      userStore.clearUserData();

      serverTokenCookie.value = null;
      userTokenCookie.value = null;
      // Middleware сработает автоматически при следующем роутинге
      alert('Срок сессии истек. Пожалуйста, авторизуйтесь снова.');
      navigateTo('/auth');
    }
    return {
      data: null,
      error: 'Срок сессии истек. Пожалуйста, авторизуйтесь снова.',
    };
  }
};
