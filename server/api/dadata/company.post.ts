type DaDataPartySuggestion = {
  value?: string
  unrestricted_value?: string
  data?: {
    inn?: string
    ogrn?: string
    name?: {
      full_with_opf?: string
      short_with_opf?: string
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
      statusMessage:
        'DaData не настроена: задайте DADATA_TOKEN в окружении Nuxt',
    })
  }

  const body = await readBody<{ inn?: string }>(event).catch(() => ({}))
  const inn = String(body?.inn ?? '').replace(/\D/g, '')
  if (!(inn.length === 10 || inn.length === 12)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Некорректный ИНН',
    })
  }

  const res = await $fetch<{
    suggestions?: DaDataPartySuggestion[]
  }>('https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Token ${token}`,
    },
    body: { query: inn },
  }).catch((err: unknown) => {
    const e = err as { statusCode?: number; statusMessage?: string; data?: any }
    throw createError({
      statusCode: e?.statusCode || 502,
      statusMessage: e?.statusMessage || 'DaData Error',
      data: e?.data,
    })
  })

  const suggestion = res?.suggestions?.[0]
  const data = suggestion?.data
  if (!data) {
    return {
      found: false,
      inn,
    }
  }

  const region =
    data.address?.data?.region_with_type?.trim() ||
    ''
  const city =
    data.address?.data?.city_with_type?.trim() ||
    data.address?.data?.settlement_with_type?.trim() ||
    ''

  return {
    found: true,
    inn: data.inn || inn,
    ogrn: data.ogrn || '',
    companyName:
      data.name?.short_with_opf ||
      data.name?.full_with_opf ||
      suggestion?.value ||
      '',
    region,
    city,
    address: data.address?.value || '',
  }
})

