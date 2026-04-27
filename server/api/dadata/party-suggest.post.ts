type DaDataPartySuggestion = {
  value?: string
  unrestricted_value?: string
  data?: {
    inn?: string
    ogrn?: string
    name?: {
      full_with_opf?: string
      short_with_opf?: string
      full?: string
    }
    address?: {
      value?: string
      data?: {
        region_with_type?: string
        city_with_type?: string
        settlement_with_type?: string
      }
    }
  }
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token =
    (config as unknown as { dadataToken?: string }).dadataToken ||
    (process.env.DADATA_TOKEN as string | undefined)

  if (!token) {
    throw createError({
      statusCode: 501,
      statusMessage: 'DaData не настроена: задайте DADATA_TOKEN в окружении Nuxt',
    })
  }

  const body = await readBody<{ query?: string }>(event).catch(
    () => ({} as { query?: string })
  )
  const query = String(body.query ?? '').trim()
  if (query.length < 3) {
    return { suggestions: [] }
  }

  const res = await $fetch<{
    suggestions?: DaDataPartySuggestion[]
  }>('https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${token}`,
    },
    body: {
      query,
      count: 10,
    },
  }).catch((err: unknown) => {
    const e = err as { statusCode?: number; statusMessage?: string; data?: any }
    throw createError({
      statusCode: e?.statusCode || 502,
      statusMessage: e?.statusMessage || 'DaData Error',
      data: e?.data,
    })
  })

  // Возвращаем "сырые" suggestions от DaData (как у вас в примере)
  return { suggestions: res?.suggestions ?? [] }
})

