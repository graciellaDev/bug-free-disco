export type DadataAddressSuggestion = {
  value?: string
  unrestricted_value?: string
  data?: Record<string, unknown>
}

/**
 * Подсказки адресов DaData.
 * Токен не нужен на клиенте — запрос идёт в Nitro, там useRuntimeConfig(event).dadataToken.
 */
export async function suggestDadataAddress(query: string) {
  const q = String(query ?? '').trim()
  if (q.length < 2) {
    return { suggestions: [] as DadataAddressSuggestion[] }
  }

  const token = useRuntimeConfig().public.dadataToken
  return await $fetch<{ suggestions?: DadataAddressSuggestion[] }>(
    'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/address',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'Authorization': `Token ${token}`,
      },
      body: { query: q },
    },
  )
}
