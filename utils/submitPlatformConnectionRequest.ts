export type PlatformConnectionRequestPayload = {
  site_name: string
  vacancy_id?: number | string | null
}

export async function submitPlatformConnectionRequest(
  payload: PlatformConnectionRequestPayload,
): Promise<{ ok: boolean; message?: string; error?: string }> {
  const config = useRuntimeConfig()
  const authToken = useCookie('auth_token').value
  const authUser = useCookie('auth_user').value

  if (!authToken || !authUser) {
    return { ok: false, error: 'Требуется авторизация' }
  }

  try {
    const res = await $fetch<{ message?: string }>(
      `${config.public.apiBase}/platform-connection-requests`,
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Auth-User': authUser,
        },
        body: {
          site_name: String(payload.site_name || '').trim(),
          vacancy_id: payload.vacancy_id ?? null,
        },
      },
    )
    return { ok: true, message: res?.message || 'Заявка отправлена' }
  } catch (err: unknown) {
    const e = err as { data?: { message?: string }; message?: string }
    return {
      ok: false,
      error: e?.data?.message || e?.message || 'Не удалось отправить заявку',
    }
  }
}
