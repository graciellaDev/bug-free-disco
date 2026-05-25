const DADATA_PARTY_SUGGEST_URL =
  'https://suggestions.dadata.ru/suggestions/api/4_1/rs/suggest/party'

export type DadataPartySuggestion = {
  value?: string
  unrestricted_value?: string
  data?: Record<string, unknown>
}

import type { H3Event } from 'h3'

function getDadataToken(event: H3Event): string {
  const config = useRuntimeConfig(event)
  return String(config.dadataToken ?? '').trim()
}

/** Прямой запрос к DaData (только сервер / Nitro, с event) */
export async function fetchDadataPartyDirect(query: string, event: H3Event) {
  const q = String(query ?? '').trim()
  if (q.length < 3) {
    return { suggestions: [] as DadataPartySuggestion[] }
  }

  const token = getDadataToken(event)
  if (!token) {
    throw new Error('DaData: не задан DADATA_TOKEN')
  }

  const res = await $fetch<{ suggestions?: DadataPartySuggestion[] }>(
    DADATA_PARTY_SUGGEST_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${token}`,
      },
      body: {
        query: q,
        count: 10,
      },
    },
  )

  return { suggestions: res?.suggestions ?? [] }
}

/**
 * Подсказки DaData suggest/party.
 * В браузере — через Nuxt API (токен и CORS на сервере), на сервере — напрямую в DaData.
 */
export async function suggestDadataParty(query: string) {
  const q = String(query ?? '').trim()
  if (q.length < 3) {
    return { suggestions: [] as DadataPartySuggestion[] }
  }

  if (import.meta.client) {
    return await $fetch<{ suggestions?: DadataPartySuggestion[] }>(
      '/api/dadata/party-suggest',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: { query: q },
      },
    )
  }

  throw new Error('suggestDadataParty: вызывайте только с клиента')
}
