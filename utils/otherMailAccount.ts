import { createAuthHeaders, getAuthTokens, handle401Error } from '@/helpers/authToken';

export interface OtherMailParams {
  email: string;
  password: string;
  smtp_server: string;
  smtp_port?: number | string;
  smtp_encryption?: string;
}

/**
 * Подключить произвольную почту по SMTP (сервер, порт, шифрование).
 */
export async function connectOtherMail(params: OtherMailParams): Promise<{ ok: boolean; message: string }> {
  const authTokens = getAuthTokens();
  if (!authTokens) {
    return { ok: false, message: 'Токен авторизации не найден' };
  }
  const { config, serverToken, userToken } = authTokens;
  const body: Record<string, string | number> = {
    email: params.email.trim(),
    password: params.password,
    smtp_server: params.smtp_server.trim(),
  };
  if (params.smtp_port !== undefined && params.smtp_port !== '') {
    body.smtp_port = typeof params.smtp_port === 'string' ? parseInt(params.smtp_port, 10) : params.smtp_port;
  }
  if (params.smtp_encryption) {
    body.smtp_encryption = params.smtp_encryption;
  }
  try {
    const res = await $fetch<{ message: string }>('/other/connect', {
      method: 'POST',
      baseURL: config.public.apiBase as string,
      headers: {
        ...createAuthHeaders(serverToken, userToken),
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body,
    });
    return { ok: true, message: res?.message || 'Почта подключена.' };
  } catch (err: any) {
    if (err.response?.status === 401) {
      handle401Error(true);
      return { ok: false, message: 'Требуется повторная авторизация' };
    }
    const msg =
      err.response?._data?.message ||
      err.data?.message ||
      err.message ||
      'Не удалось подключить почту';
    return { ok: false, message: typeof msg === 'string' ? msg : 'Ошибка подключения' };
  }
}
