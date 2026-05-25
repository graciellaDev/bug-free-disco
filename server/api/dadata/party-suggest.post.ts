import { fetchDadataPartyDirect } from '@/utils/dadataPartySuggest'

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
  const config = useRuntimeConfig(event)
  const token = String(config.dadataToken ?? '').trim()
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

  try {
    const { suggestions } = await fetchDadataPartyDirect(query, event)
    return { suggestions }
  } catch (err: unknown) {
    const e = err as { statusCode?: number; statusMessage?: string; data?: unknown }
    throw createError({
      statusCode: e?.statusCode || 502,
      statusMessage: e?.statusMessage || 'DaData Error',
      data: e?.data,
    })
  }
})

