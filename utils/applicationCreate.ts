export const createApplication = async (applicationData: Record<string, unknown>) => {
  const config = useRuntimeConfig();
  const authToken = useCookie('auth_token').value;
  const authUser = useCookie('auth_user').value;

  try {
    const response = await $fetch(`${config.public.apiBase}/applications`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authToken}`,
        'X-Auth-User': `${authUser}`,
      },
      body: applicationData,
    });

    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      throw new Error('Response is not a valid Application object');
    }

    return { data: response, error: null };
  } catch (error: any) {
    if (error?.response?.status === 401) {
      alert('Ваша сессия истекла! Пожалуйста, авторизуйтесь снова.');
      useRouter().replace('/auth');
      return { data: null, error };
    }
    console.error('Ошибка создания заявки:', error);
    return {
      data: null,
      error: error?.data ?? error?.response?._data ?? error,
    };
  }
};
