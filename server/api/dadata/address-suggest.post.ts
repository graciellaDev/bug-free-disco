const DADATA_ADDRESS_SUGGEST_URL =
  'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address'

export default defineEventHandler(async (event) => {
  // В Nitro нужен event: иначе private runtimeConfig.dadataToken пустой
  const config = useRuntimeConfig(event)
  const token = String(config.dadataToken ?? '').trim()

  if (!token) {
    throw createError({
      statusCode: 501,
      statusMessage:
        'DaData не настроена: задайте DADATA_TOKEN (или NUXT_DADATA_TOKEN) в .env и перезапустите dev-сервер',
    })
  }

  const body = await readBody<{ query?: string }>(event).catch(
    () => ({} as { query?: string }),
  )
  const query = String(body.query ?? '').trim()
  if (query.length < 2) {
    return { suggestions: [] }
  }

  try {
    const res = await $fetch<{ suggestions?: unknown[] }>(DADATA_ADDRESS_SUGGEST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
      body: { query },
    })

    return { suggestions: res?.suggestions ?? [] }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; statusMessage?: string; data?: unknown }
    throw createError({
      statusCode: e?.statusCode || 502,
      statusMessage: e?.statusMessage || 'DaData Error',
      data: e?.data,
    })
  }
})
