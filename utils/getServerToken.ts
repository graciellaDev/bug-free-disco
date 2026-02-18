interface ServerResponse {
  authorization: {
    token: string;
  };
}

export type GetServerTokenResult = { token: string; error?: never } | { token: null; error: string };

export const getServerToken = async (): Promise<GetServerTokenResult> => {
  const config = useRuntimeConfig();

  if (!config.public.apiBase || !config.public.apiEmail || !config.public.apiPassword) {
    const msg = 'Не заданы NUXT_PUBLIC_API_EMAIL или NUXT_PUBLIC_API_PASSWORD. Перезапустите контейнер bug-free-disco.';
    console.warn(msg);
    return { token: null, error: msg };
  }

  try {
    const response = await $fetch<ServerResponse>('/login-jwt', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        'Content-Type': 'application/json',
      },
      body: {
        email: config.public.apiEmail,
        password: config.public.apiPassword,
      },
      timeout: 10000,
    });

    if (response?.authorization?.token) {
      const tokenCookie = useCookie('auth_token');
      tokenCookie.value = response.authorization.token;
      return { token: tokenCookie.value };
    }
    return { token: null, error: 'Токен не получен в ответе сервера' };
  } catch (err: any) {
    let message = 'Не удалось получить серверный токен';
    if (err.code === 'ETIMEDOUT' || err.name === 'TimeoutError') {
      message = 'Таймаут: API не отвечает. Проверьте, что бэкенд (jobly-back) запущен.';
    } else if (err.code === 'ECONNREFUSED') {
      message = 'Ошибка подключения к API. Запустите бэкенд: docker compose up -d';
    } else if (err.response?.status === 401) {
      message = 'Неверные учётные данные для API (NUXT_PUBLIC_API_EMAIL/PASSWORD). Либо создайте пользователя в таблице users: php artisan tinker → User::create(...)';
    } else if (err.response?.status === 500) {
      message = 'Ошибка 500 на бэкенде. Проверьте JWT_SECRET в jobly-back/.env.local и логи: docker compose logs jobly-back';
    } else if (err.response?.status) {
      message = `Ошибка ${err.response.status}: ${err.response._data?.message || err.message || 'см. консоль браузера'}`;
    } else if (err.message) {
      message = err.message;
    }
    console.error('getServerToken:', message, err.response?._data ?? err);
    return { token: null, error: message };
  }
};
