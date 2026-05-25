export const deleteApplication = async (id: string | number) => {
  const config = useRuntimeConfig();

  try {
    const data = await $fetch(`/applications/${id}`, {
      method: 'DELETE',
      baseURL: config.public.apiBase as string,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${useCookie('auth_token').value}`,
        'X-Auth-User': `${useCookie('auth_user').value}`,
      },
    });

    const message = typeof data === 'object' && data && 'message' in data
      ? String((data as { message?: string }).message ?? '')
      : '';
    if (message.includes('не найдена')) {
      return { data: null, error: { data: { message }, message } };
    }

    return { data, error: null };
  } catch (error: any) {
    if (error?.status === 401 || error?.statusCode === 401) {
      useRouter().replace('/auth');
      return { data: null, error };
    }
    console.error('Ошибка при удалении заявки:', error);
    return { data: null, error };
  }
};
